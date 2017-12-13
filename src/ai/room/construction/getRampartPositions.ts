export function getRampartPositions(layout: { [type: string]: RoomPosition[] }, start: RoomPosition): RoomPosition[] {
  const roomName = start.roomName;
  const ramparts: Array<RoomPosition> = []; // tslint:disable-line
  const edges = getLayoutEdges(layout);
  const width = edges.bottomRight.x - edges.topLeft.x + 1;
  const height = edges.bottomRight.y - edges.topLeft.y + 1;
  _.times(height, (oY: number) => {
    ramparts.push(new RoomPosition(edges.topLeft.x, edges.topLeft.y + oY, roomName));
    ramparts.push(new RoomPosition(edges.bottomRight.x, edges.topLeft.y + oY, roomName));
  });
  _.times(width, (oX: number) => {
    ramparts.push(new RoomPosition(edges.topLeft.x + oX, edges.topLeft.y, roomName));
    ramparts.push(new RoomPosition(edges.topLeft.x + oX, edges.bottomRight.y, roomName));
  });
  return reduceRamparts(start, ramparts);
}

function getLayoutEdges(layout: { [structureType: string]: RoomPosition[] }): {topLeft: XYPos, bottomRight: XYPos} {
  const positions: RoomPosition[] = _(layout)
    .filter((_p: RoomPosition[], structureType: string) => structureType !== STRUCTURE_ROAD)
    .flatten().value() as RoomPosition[];
  const left = _.min(positions, (p: RoomPosition) => p.x);
  const right = _.max(positions, (p: RoomPosition) => p.x);
  const top = _.min(positions, (p: RoomPosition) => p.y);
  const bottom = _.max(positions, (p: RoomPosition) => p.y);
  return {
    bottomRight: { x: right.x + 2, y: bottom.y + 2 },
    topLeft: { x: left.x - 2, y: top.y - 2 }
  };
}

function reduceRamparts(startPos: RoomPosition, rampartPositions: RoomPosition[]): RoomPosition[] {
  const room = Game.rooms[startPos.roomName]!;
  const targetRooms: string[] = _.values(Game.map.describeExits(room.name));
  const costMatrix = new PathFinder.CostMatrix();
  _.forEach(rampartPositions, (pos: RoomPosition) => costMatrix.set(pos.x, pos.y, 0xff));
  return _.filter(rampartPositions, (pos: RoomPosition) => rampartRequired(pos, startPos, costMatrix, targetRooms));
}

function rampartRequired(pos: RoomPosition, start: RoomPosition, matrix: CostMatrix, names: string[]): boolean {
  if (pos.lookFor(LOOK_TERRAIN)[0] === "wall") {
    return false;
  }
  matrix.set(pos.x, pos.y, 1);
  const required = _.any(names, (roomName: string) => {
    const goal = {
      pos: new RoomPosition(25, 25, roomName),
      range: 24
    };
    const search = PathFinder.search(start, goal, {
      maxOps: 1500,
      roomCallback: (rn: string): CostMatrix | boolean => rn === start.roomName ? matrix : true });
    return !search.incomplete;
  });
  matrix.set(pos.x, pos.y, 0xff);
  return required;
}
