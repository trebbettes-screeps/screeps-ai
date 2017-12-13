import {$} from "../../spawns/index";

export function supplierCreep(room: Room, upgradeContainer: StructureContainer): void {
    const taskId = `${room.name}_supplier`;

    $.registerSpawnRequest(taskId, room, {
        canSpawn: () => room.energyAvailable === room.energyCapacityAvailable,
        generateSpawnRequest: () => ({
          body: $.generateBody(room, [CARRY, CARRY, MOVE]),
          onSuccess: () => $.setTimerCycle(taskId)
        }),
        shouldSpawn: () => room.getStructures(STRUCTURE_LINK).length < 2
    });

    _.forEach($.getCreeps(taskId), (c: Creep) => creepAction(c, upgradeContainer));
}

export function creepAction(creep: Creep, container: StructureContainer): void {
  const room = Game.rooms[creep.memory.origin];
  if (room && room.storage) {
    if (nearDeath(creep, room.storage)) {
      return;
    }
    if (container && container instanceof StructureContainer) {
      const state = creep.getState();
      if (state === HaulState.Emptying) {
        if (creep.pos.getRangeTo(container) > 3) {
          creep.moveTo(container, {range: 1});
        } else if (container.storeCapacity - _.sum(container.store) >= creep.carry.energy!) {
          if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(container, {range: 1});
          }
        } else {
          creep.moveOffRoad(container);
        }
      } else { // State.Filling
        if (creep.pos.getRangeTo(room.storage) > 3) {
          creep.moveTo(room.storage, {range: 1});
        } else {
          if (room.storage.store.energy! > creep.carryCapacity) {
            if (creep.withdraw(room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
              creep.moveTo(room.storage, {range: 1});
            }
          }
        }
      }
    } else if (creep.room.storage && creep.carry.energy) {
      if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.storage);
      }
    } else {
      creep.suicide();
    }
  }
}

function nearDeath(creep: Creep, storage: StructureStorage): boolean {
  if (creep.ticksToLive <= 25) {
    const sum = _.sum(creep.carry);
    if (sum > 0) {
      if (creep.transfer(storage, _.findKey(creep.carry) as ResourceConstant) === ERR_NOT_IN_RANGE) {
        creep.moveTo(storage);
      }
    }
    if (sum === 0) {
        creep.suicide();
    }
    return true;
  }
  return false;
}
