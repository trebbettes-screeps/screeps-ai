// tslint:disable:no-bitwise
import {getRampartPositions} from "./getRampartPositions";

export function getRoomLayout(r: Room, start?: RoomPosition, save: boolean = false): {[type: string]: RoomPosition[]} {
    const flagName = `${r.name}_autoBuild`;
    const flag = Game.flags[flagName];
    if (!flag) {
      return {};
    }
    if (start && (!flag.memory.startPos || !start.isEqualTo(flag.memory.startPos.x, flag.memory.startPos.y))) {
      const layout = calculateLayout(r, start);
      layout[STRUCTURE_RAMPART] = getRampartPositions(layout, start);
      if (save) {
          flag.memory.layout = serialiseLayout(layout);
          flag.memory.startPos = start;
      }
      return layout;
    } else if (flag.memory.layout) {
      return deserialiseLayout(flag.memory.layout, r);
    }
    return {};
}

function calculateLayout(room: Room, startPos: RoomPosition): {[structureType: string]: RoomPosition[]} {
  console.log(`Calculating new Room Layout @ ${JSON.stringify(startPos)}`);
  const coreLayout = getCorePositions(startPos);
  const dynamicLayout = getDynamicLayoutMap(room, startPos, coreLayout);
  const result: {[structureType: string]: RoomPosition[]} = {};

  _.forEach(coreLayout, (positions: RoomPosition[], structureType?: string) =>
    result[structureType!] = positions);

  _.forEach(dynamicLayout, (positions: RoomPosition[], structureType?: string) =>
    result[structureType!] = positions);

  result[STRUCTURE_ROAD] = getRoadPositions(result, [...getObjectsToAvoid(room), ...coreLayout[STRUCTURE_STORAGE]]);
  return result;
}

function serialiseLayout(layout: {[structureType: string]: RoomPosition[]}): {[structureType: string]: string} {
  const result: {[structureType: string]: string} = {};
  _.forEach(layout, (positions: RoomPosition[], structureType?: string) => {
    result[structureType!] = positionsToString(positions);
  });
  return result;
}

function deserialiseLayout(layout: {[type: string]: string}, room: Room): {[type: string]: RoomPosition[]} {
  const result: {[type: string]: RoomPosition[]} = {};
  _.forEach(layout, (posString: string, structureType?: string) => {
    result[structureType!] = positionsFromString(posString, room.name);
  });
  return result;
}

// Write the positions to a string by using 12 bits (6 for X, 6 for Y) and using the correct UTF character.
function positionsToString(positions: RoomPosition[]): string {
  const chars = _.map(positions, (pos: RoomPosition) => {
    const charCode = pos.x << 6 | pos.y; // bitwise
    return String.fromCharCode(charCode);
  });
  return chars.join("");
}

function positionsFromString(posString: string, roomName: string): RoomPosition[] {
  return _.map(posString, (char: string) => {
    const charCode = char.charCodeAt(0);
    return new RoomPosition(charCode >> 6, charCode & 63, roomName); // bitwise
  });
}

const corePositions: {[structureName: string]: ReadonlyArray<XYPos>} = {
  lab: [{x: 3, y: 2}, {x: 4, y: 2}, {x: 2, y: 3}, {x: 4, y: 3}, {x: 5, y: 3},
    {x: 2, y: 4}, {x: 3, y: 4}, {x: 5, y: 4}, {x: 3, y: 5}, {x: 4, y: 5}],
  link: [{x: 0, y: 2}],
  storage: [{x: 0, y: 0}],
  terminal: [{x: 2, y: 2}]
};

function getRoadPositions(layout: {[structureType: string]: RoomPosition[]}, avoid: RoomPosition[]): RoomPosition[] {
  const structurePositions = _(layout).map((positions: RoomPosition[]) => positions).flatten().value();
  return _(structurePositions)
    .map((p: RoomPosition) => p.getNearbyPositions())
    .flatten()
    .filter((roadPos: RoomPosition) =>
      roadPos.isWalkable() &&
      _.all(structurePositions, (p: RoomPosition) => !p.isEqualTo(roadPos)) &&
      _.all(avoid, (a: RoomPosition) => roadPos.getRangeTo(a) > 1))
    .uniq((p: RoomPosition) => `${p.x}_${p.y}`)
    .value() as RoomPosition[];
}

function clamp(n: number): number {
  if (n > 47) { return 47; }
  if (n < 2) { return 2; }
  return n;
}

function getAllPossiblePositions(room: Room, startPos: RoomPosition, core: LayoutMap, avoidPositions: RoomPosition[]) {
  let allPositions: RoomPosition[] = []; // tslint:disable-line:no-let
  _.times(50, (x: number): void => {
    // if (x < 3 || x > 46) { return; }
    _.times(50, (y: number): void => {
      // if (y < 3 || y > 46) { return; }
      const d = 4;
      const xd = x % d;
      const yd = y % d;
      if (xd === yd && (yd % 4 === 0 || yd % 2 === 0)) {
        const crossPositions = getCrossPositions(new RoomPosition(x, y, room.name));
        const allowedPositions = _.filter(crossPositions,
          (p: RoomPosition) => isValidPosition(p, startPos, core, avoidPositions));
        allPositions = [...allPositions, ...allowedPositions];
      }
    });
  });
  return allPositions;
}

function getPosInfo(positions: RoomPosition[], core: LayoutMap): PosInfo[] {
  const costMatrix = new PathFinder.CostMatrix();
  _.forEach(positions, (pos: RoomPosition) => costMatrix.set(pos.x, pos.y, 0xff));

  return _.map(positions, (pos: RoomPosition) => {
    const opts: PathFinderOpts = {roomCallback: (): CostMatrix => costMatrix, maxRooms: 1, swampCost: 1, plainCost: 1};
    const cp = _(core).values().flatten().map((p: any): any => ({pos: p, range: 1})).value();
    const pathResult = PathFinder.search(pos, cp, opts);
    return {
      pos,
      range: pathResult.path.length,
      valid: !pathResult.incomplete
    };
  });
}

function getDynamicLayoutMap(room: Room, startPosition: RoomPosition, coreStructures: LayoutMap): LayoutMap {
  const avoidObjects = getObjectsToAvoid(room);
  const nonCorePositions = getAllPossiblePositions(room, startPosition, coreStructures, avoidObjects);
  const positionInfo = getPosInfo(nonCorePositions, coreStructures);

  const sortedPositions = _(positionInfo)
    .filter((p: PosInfo) => p.valid)
    .sortBy((p: PosInfo) => p.range)
    .map((p: PosInfo) => p.pos).value();

  return positionsToLayout(sortedPositions);
}

function positionsToLayout(sortedPositions: RoomPosition[]): LayoutMap {
  const structureTypes = [STRUCTURE_TOWER, STRUCTURE_SPAWN, STRUCTURE_POWER_SPAWN,
    STRUCTURE_EXTENSION, STRUCTURE_NUKER, STRUCTURE_OBSERVER];

  const map: LayoutMap = {};

  let taken = 0;

  _.forEach(structureTypes, (structureType: BuildableStructureConstant) => {
    const amount = CONTROLLER_STRUCTURES[structureType][8];
    const positions = sortedPositions.slice(taken, amount + taken);
    taken += amount;
    map[structureType] = positions;
  });

  return map;
}

function getCorePositions(startPos: RoomPosition): LayoutMap {
  const mappedCore: LayoutMap = {};
  _.forEach(corePositions, (p: XYPos[], type?: string) => {
      mappedCore[type!] = _.map(corePositions[type!], (pos: XYPos) => mapCoreStructure(startPos, pos));
  });
  return mappedCore;
}

function mapCoreStructure(startPos: RoomPosition, rp: XYPos): RoomPosition {
  return new RoomPosition(startPos.x + rp.x, startPos.y + rp.y, startPos.roomName);
}

function getCrossPositions(pos: RoomPosition): RoomPosition[] {
  const dirs = [TOP, LEFT, BOTTOM, RIGHT];
  const positions = _.filter(_.map(dirs,
      (d: number) => pos.getPositionInDirection(d)), _.identity) as RoomPosition[];
  return [pos, ...positions];
}

function isValidPosition(p: RoomPosition, start: RoomPosition, core: LayoutMap, avoid: RoomPosition[]): boolean {
  if (p.x > start.x && p.y > start.y) {
    return false;
  }
  if (p.x < 4 || p.y < 4 || p.x > 46 || p.y > 46) {
    return false;
  }
  if (_.any(core, (positions: RoomPosition[]) => nearContainedPosition(p, positions))) {
    return false;
  }
  if (_.any(avoid, (ro: RoomObject) => p.getRangeTo(ro) <= 2)) {
    return false;
  }
  return p.lookFor(LOOK_TERRAIN)[0] !== "wall";
}

function getObjectsToAvoid(room: Room): RoomPosition[] {
  const positions = _.map([
        ...room.find(FIND_SOURCES),
        ...room.find(FIND_MINERALS)
  ], (o: RoomObject) => o.pos);

  return room.controller ? [...positions, room.controller.pos] : positions;
}

function nearContainedPosition(position: RoomPosition, positions: RoomPosition[]): boolean {
  return _.any(positions, (p: RoomPosition) => p.isNearTo(position));
}
