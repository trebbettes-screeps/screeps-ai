import {$} from "../../spawns/index";

export function fillerCreep(room: Room): void {
    const taskId = `${room.name}_filler`;
    const count = $.getCreepCount(taskId);

    $.registerSpawnRequest(taskId, room, {
        canSpawn: () => {
          if (count === 0) {
            return room.energyAvailable >= 300;
          }
          return room.energyAvailable === room.energyCapacityAvailable;
        },
        generateSpawnRequest: () => ({
          body: $.generateBody(room, [CARRY, CARRY, MOVE], {maxCost: room.energyAvailable}),
          onSuccess: () => $.setTimerCycle(taskId)
        }),
        shouldSpawn: () => !!room.storage && ($.spawnTimerCheck(taskId) || count === 0)
    });

    _.forEach($.getCreeps(taskId), creepAction);
}

function creepAction(creep: Creep): void {
  if (creep.ticksToLive < 20) {
    depositInStorage(creep);
    if (creep.carry.energy === 0) {
      creep.suicide();
    }
    return;
  }
  const state = creep.getState();
  if (state === HaulState.Filling) {
   collectFromStorage(creep);
  } else { // State.Emptying
    supplyPrimaryTargets(creep);
  }
}

function collectFromStorage(creep: Creep): void {
  const storage = creep.room.storage;
  if (storage) {
    if (creep.pos.isNearTo(storage)) {
      creep.withdraw(storage, RESOURCE_ENERGY);
      supplyPrimaryTargets(creep);
    } else {
      creep.moveTo(storage);
    }
  }
}

function depositInStorage(creep: Creep): void {
  const storage = creep.room.storage;
  if (storage) {
    if (creep.pos.isNearTo(storage)) {
      creep.transfer(storage, RESOURCE_ENERGY);
    } else {
      creep.moveTo(storage);
    }
  }
}

function supplyPrimaryTargets(creep: Creep): boolean {
  const room = Game.rooms[creep.memory.origin];
  const target = getPrimaryEnergyTarget(creep, room);
  if (target) {
    if (creep.pos.isNearTo(target)) {
      creep.transfer(target, RESOURCE_ENERGY);
      delete creep.memory.target;
    } else {
      creep.moveTo(target);
    }
    return true;
  } else {
    creep.moveOffRoad(creep.room.storage);
    return false;
  }
}

function getPrimaryEnergyTarget(creep: Creep, room: Room): Structure | null {
  const target = Game.getObjectById<StructureSpawn | StructureExtension>(creep.memory.target);

  if (!target || target.energy === target.energyCapacity || target instanceof Creep) {

    const structures = [
      ...room.getStructures<StructureSpawn>(STRUCTURE_SPAWN),
      ...room.getStructures<StructureExtension>(STRUCTURE_EXTENSION),
      ...room.getStructures<StructureTower>(STRUCTURE_TOWER)];

    const filtered = _.filter(structures, (s: StructureSpawn) =>
      s instanceof StructureTower ? s.energy / s.energyCapacity < 0.5 : s.energy < s.energyCapacity);

    const closest = creep.pos.findClosestByRange<Structure>(filtered);

    if (!closest) { return null; } // Early

    creep.memory.target = closest.id;
    return closest;
  }

  return target;
}
