export function collectorRole(creep: Creep, room: Room, source: Source): void {
  const state = creep.getState();
  if (state === HaulState.Emptying) {
    emptyAction(creep, room);
  } else {
    fillAction(creep, source, room);
  }
}

function fillAction(creep: Creep, source: Source, room: Room): void {
  const container = getContainer(creep, source) as StructureContainer;
  if (!container) {
    creep.moveTo(source, {range: 5});
    return;
  }
  if (suicideCheck(creep, room, container)) {
    creep.suicide();
    return;
  }
  if (_.sum(container.store) > creep.carryCapacity - _.sum(creep.carry)) {
    if (creep.withdraw(container, _.findKey(container.store) as ResourceConstant) === ERR_NOT_IN_RANGE) {
      creep.moveTo(container, {range: 1});
    }
    return;
  }

  if (creep.pos.getRangeTo(container) > 8) {
    creep.moveTo(container, {range: 2});
    return;
  }
}

function suicideCheck(creep: Creep, room: Room, container: StructureContainer): boolean {
  if (!room.storage) {
    return false;
  }
  creep.memory.pathLength = creep.memory.pathLength ||
    (PathFinder.search(container.pos, {pos: room.storage.pos, range: 1}).path.length * 1.1);
  return creep.ticksToLive <= creep.memory.pathLength;
}

function emptyAction(creep: Creep, room: Room): void {
  if (room && room.storage) {
    if (creep.pos.isNearTo(room.storage)) {
      creep.transfer(room.storage, _.findKey(creep.carry) as ResourceConstant);
    } else {
      creep.moveTo(room.storage, {range: 1});
    }
  }
}

function getContainer(creep: Creep, source: Source): Structure | null {
  if (!creep.memory.container && Game.time % 10 === 0) {
    const containers = source.room.find<Structure>(FIND_STRUCTURES, {
      filter: (s: Structure) => s instanceof StructureContainer
    });
    const container = source.pos.findInRange(containers, 1)[0];
    if (container) {
      creep.memory.container = container.id;
    }
  }
  const result = Game.getObjectById<StructureContainer>(creep.memory.container);
  if (creep.memory.container && !result) {
    creep.memory.container = undefined;
  }
  return result;
}
