export function safeModeLogic(room: Room): void {
  if (!room.controller || room.controller.level < 7) {
    return;
  }
  if (!room.controller || skipCheck(room)) {
    return;
  }
  const hostiles = _.filter(room.find(FIND_HOSTILE_CREEPS), (c: Creep) => isDangerousCreep(c));
  if (hostiles.length) {
    safeModeCheck(room, hostiles);
  }
}

function safeModeCheck(room: Room, hostiles: RoomObject[]): void {
  if (hostiles.length) {
    const spawns = room.getStructures(STRUCTURE_SPAWN);
    const spawnsInDanger = _.filter(spawns, (s: Spawn) => s.pos.findInRange(hostiles, 10).length > 0);
    if (spawnsInDanger) {
      const goals = hostiles.map((h: RoomObject) => ({pos: h.pos, range: 0}));
      const activateSafeMode = _.any(spawnsInDanger, (s: Spawn) =>
          !PathFinder.search(s.pos, goals, {roomCallback: getCostMatrix, maxRooms: 1}).incomplete);
      if (activateSafeMode) {
        room.controller!.activateSafeMode();
      }
    }
  }
}

function getCostMatrix(roomName: string): CostMatrix | boolean {
  const room = Game.rooms[roomName];
  if (!room) {
    return false;
  }
  const matrix = new PathFinder.CostMatrix();
  const ramparts = room.getStructures(STRUCTURE_RAMPART);
  _.forEach(ramparts, (r: StructureRampart) => matrix.set(r.pos.x, r.pos.y, 0xff));
  const walls = room.getStructures( STRUCTURE_WALL);
  _.forEach(walls, (w: StructureWall) => matrix.set(w.pos.x, w.pos.y, 0xff));
  const spawns = room.getStructures( STRUCTURE_SPAWN);
  _.forEach(spawns, (s: StructureSpawn) => matrix.set(s.pos.x, s.pos.y, 0));
  return matrix;
}

function isDangerousCreep(creep: Creep): boolean {
  if (creep.owner.username === "Invader") {
    return false;
  }
  return _.some(creep.body, (bp: BodyPartDefinition) => isDangerousPart(bp));
}

function isDangerousPart(part: BodyPartDefinition): boolean {
  return ([ATTACK, RANGED_ATTACK, WORK] as ReadonlyArray<string>).indexOf(part.type) > -1;
}

function skipCheck(r: Room): boolean {
  if (!r.controller || r.controller.safeMode || r.controller.safeModeAvailable === 0 || r.controller.safeModeCooldown) {
    return true;
  }
  return false;
}
