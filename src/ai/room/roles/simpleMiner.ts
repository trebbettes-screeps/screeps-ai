export function simpleMiner(creep: Creep): void {
  creep.setStatic();
  const structure = Game.getObjectById<Structure>(creep.memory.structure);
  const source = Game.getObjectById<Source>(creep.memory.source);

  if (!structure || !source) {
    creep.memory.simplified = undefined;
    return;
  }

  if (moveToWorkPosition(creep, structure)) {
    return;
  }

  if (maintainStructure(creep, structure)) {
    return;
  }

  creep.harvest(source);

  transferToStructure(creep, structure);
}

function moveToWorkPosition(creep: Creep, structure: Structure): boolean {
  const workPos = _.create(RoomPosition.prototype, creep.memory.workPosition);

  if (!workPos || creep.pos.isEqualTo(workPos)) {
    return false;
  }

  if (creep.pos.isEqualTo(structure)) {
    creep.memory.workPosition = structure.pos;
    return false;
  }

  if (creep.pos.isNearTo(workPos)) {
    const blocking = workPos.lookFor(LOOK_CREEPS)[0];
    if (blocking) {
      blocking.move(blocking.pos.getDirectionTo(creep));
    }
    creep.move(creep.pos.getDirectionTo(workPos));
    return true;
  }

  creep.moveTo(workPos);
  return true;
}

function maintainStructure(creep: Creep, structure: Structure): boolean {
  if (structure instanceof StructureContainer && structure.hits < structure.hitsMax) {
    const canWithdraw = structure.store.energy > creep.carryCapacity;
    if (canWithdraw || (creep.carry.energy || 0) >= 30) {
      creep.withdraw(structure, RESOURCE_ENERGY);
      creep.repair(structure);
      return true;
    }
  }
  return false;
}

function transferToStructure(creep: Creep, structure: Structure): void {
  if (creep.pos.isEqualTo(structure) || (creep.carry.energy || 0) < creep.carryCapacity * 0.8) {
    return;
  }
  if (structure instanceof StructureContainer && !structure.pos.lookFor(LOOK_CREEPS)[0]) {
    creep.move(creep.pos.getDirectionTo(structure));
  }
  creep.transfer(structure, RESOURCE_ENERGY);
}
