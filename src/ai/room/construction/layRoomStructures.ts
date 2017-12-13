import {getRoomLayout} from "./getRoomLayout";

export function layRoomStructures(room: Room): void {
  const flag = Game.flags[`${room.name}_autoBuild`];
  if (!flag) {
    return;
  }
  const skipUntil = flag.memory.skipCheckUntil = flag.memory.skipCheckUntil || Game.time + 3;

  if (flag.color !== COLOR_RED && !flag.memory.startPos) {
    flag.setColor(COLOR_RED);
    return;
  }
  if (flag.color === COLOR_RED) {
    const layout = getRoomLayout(room, flag.pos, true);
    flag.setColor(COLOR_WHITE);
    // visualiseLayout(layout, room);

  } else if (skipUntil === Game.time + 1) {
    const layout = getRoomLayout(room, flag.pos, true);
    removeMisplacedStructure(layout, room);
    removeMisplacedRoads(room);

  } else if (skipUntil <= Game.time) {
    const layout = getRoomLayout(room, flag.pos, true);
    // visualiseLayout(layout, room);
    const sitesCreated = layConstructionSites(layout, room);
    placeExtractor(room);
    flag.memory.skipCheckUntil = sitesCreated ? Game.time + 100 : Game.time + 1000 + Math.round(100 * Math.random());
  }
}

function layConstructionSites(layout: {[structureType: string]: ReadonlyArray<RoomPosition>}, room: Room): boolean {
  let createdSites = false; // tslint:disable-line
  const level = room.controller!.level;
  _.forEach(layout, (positions: RoomPosition[], st?: string) => {
    const structureType = st!;
    if (structureType === STRUCTURE_ROAD && !room.storage) {
      return;
    }
    if (structureType === STRUCTURE_RAMPART && level < 6) {
      return;
    }

    const existing = room.getStructures(structureType);
    const missing = _.filter(positions, (p: RoomPosition) => _.all(existing, (s: Structure) => !s.pos.isEqualTo(p)));

    if (missing.length && existing.length < CONTROLLER_STRUCTURES[structureType as BuildableStructureConstant][level]) {
      console.log(`Laying ${structureType} construction site(s) in ${room.name}. (${missing.length})`);
      _.forEach(missing, (pos: RoomPosition) => pos.createConstructionSite(structureType as any));
      createdSites = true;
    }
  });
  return createdSites;
}

function visualiseLayout(layout: {[structureType: string]: ReadonlyArray<RoomPosition>}, room: Room): void {
  _.forEach(layout, (positions: RoomPosition[], structureType?: string) => {
    const colour = colours[structureType!] || "pink";
    _.forEach(positions, (p: RoomPosition) => {
      room.visual.circle(p, {fill: colour});
    });
  });
}

function removeMisplacedStructure(layout: {[structureType: string]: ReadonlyArray<RoomPosition>}, room: Room): void {
  if (room.find(FIND_CONSTRUCTION_SITES).length) {
    return;
  }
  const outOfPlace = _.find(room.find(FIND_MY_STRUCTURES), (s: Structure): any => {
    const ignore = !layout[s.structureType] ||
        _.contains([STRUCTURE_RAMPART, STRUCTURE_LINK, STRUCTURE_STORAGE], s.structureType) ||
        (s.structureType === STRUCTURE_SPAWN && room.getStructures(STRUCTURE_SPAWN).length === 1);

    if (!ignore) {
      return !_.any(layout[s.structureType], (p: RoomPosition) => p.isEqualTo(s.pos));
    }
  });
  if (outOfPlace) {
    console.log(`Destorying misplaced structure ${outOfPlace.structureType} in ${room.name}`);
    outOfPlace.destroy();
  }
}

function removeMisplacedRoads(room: Room): void {
  _.forEach(room.getStructures(STRUCTURE_ROAD), (r: Structure) => {
    if (_.any(r.pos.lookFor(LOOK_STRUCTURES), (s: Structure) => _.contains(OBSTACLE_OBJECT_TYPES, s.structureType))) {
      r.destroy();
    }
  });
}

function placeExtractor(room: Room): void {
  if (room.controller && room.controller.level > 5) {
    const extractor = room.getStructures<StructureExtractor>(STRUCTURE_EXTRACTOR)[0];
    const mineral = room.find(FIND_MINERALS)[0];
    if (!extractor && mineral) {
      mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
    } else if (mineral.mineralAmount > 0 || mineral.ticksToRegeneration < 1000) {
      const containers = room.getStructures(STRUCTURE_CONTAINER);
      if (extractor.pos.findInRange(containers, 1).length === 0) {
        const positions = _.filter(extractor.pos.getNearbyPositions(), (p: RoomPosition) => p.isWalkable());
        if (positions.length) {
          const mostAvailable = _.max(positions, (p: RoomPosition) => p.findInRange(positions, 1).length);
          mostAvailable.createConstructionSite(STRUCTURE_CONTAINER);
        }
      }
    }
  }
}

const colours: { [structureType: string]: string } = {
  [STRUCTURE_ROAD]: "black",
  [STRUCTURE_TOWER]: "red",
  [STRUCTURE_SPAWN]: "orange",
  [STRUCTURE_POWER_SPAWN]: "purple",
  [STRUCTURE_EXTENSION]: "yellow",
  [STRUCTURE_NUKER]: "green",
  [STRUCTURE_OBSERVER]: "cyan",
  [STRUCTURE_STORAGE]: "black",
  [STRUCTURE_TERMINAL]: "blue",
  [STRUCTURE_LINK]: "grey",
  [STRUCTURE_LAB]: "red",
  [STRUCTURE_RAMPART]: "green"
};
