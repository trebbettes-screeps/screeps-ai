export function layRoads(room: Room): void {
  if (Game.time % 20 !== 0) {
    return;
  }

  const dest = (room.memory.roads || []).shift();
  if (!dest || !Game.getObjectById(dest)) {
    return;
  }

  const origin = getOrigin(room);
  const destination = Game.getObjectById<RoomObject>(dest);
  if (origin && destination) {
    layRoad(origin.pos, destination.pos);
    _.remove(room.memory.roads, dest);
  }
}

function getOrigin(room: Room): StructureStorage | StructureSpawn {
  return room.storage || room.getStructures<Spawn>(STRUCTURE_SPAWN)[0];
}

function layRoad(start: RoomPosition, end: RoomPosition): void {
  const pathResult = PathFinder.search(start, {pos: end, range: 1}, {
      maxOps: 10000,
      plainCost: 2,
      roomCallback: (roomName: string): CostMatrix | false => getMatrix(roomName),
      swampCost: 3
  });
  _.forEach(pathResult.path, (pos: RoomPosition) => pos.createConstructionSite(STRUCTURE_ROAD));
}

function getMatrix(roomName: string): CostMatrix | false {
  const room = Game.rooms[roomName];
  if (!room) {
    return false;
  }
  const matrix = new PathFinder.CostMatrix();
  _.forEach(room.find(FIND_STRUCTURES), (s: Structure) => {
    if (s.isBlocking()) {
      matrix.set(s.pos.x, s.pos.y, 0xff);
    } else if (s instanceof StructureRoad) {
      matrix.set(s.pos.x, s.pos.y, 1);
    }
  });
  _.forEach(room.find(FIND_CONSTRUCTION_SITES, {
      filter: (cs: ConstructionSite): boolean => cs.structureType === STRUCTURE_ROAD
  }), (cs: ConstructionSite): void => {
      matrix.set(cs.pos.x, cs.pos.y, 1);
  });
  return matrix;
}
