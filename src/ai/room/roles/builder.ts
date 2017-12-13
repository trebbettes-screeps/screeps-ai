import {$} from "../../spawns/index";
import {getConstructionTarget} from "../construction/getConstructionTarget";

/*
 * Spawns a builder for a room if it has a storage structure. (See Worker for pre storage building.)
 * Max 4 builders, scales depending on constructionSite.progressTotal and storage.store.energy.
 */
export function builder(room: Room) {
  const storage = room.storage;
  if (!storage) {
    return;
  }
  const taskId = `${room.name}_builder`;
  const target = getConstructionTarget(room, storage.pos);
  $.registerSpawnRequest(taskId, room, {
      canSpawn: () => room.energyAvailable === room.energyCapacityAvailable,
      generateSpawnRequest: () => {
          const energy = storage.store.energy!;
          const maxCreeps = Math.min(energy / 20000, 4);
          const builders = target!.progressTotal < 10000 ? 1 : Math.min(target!.progressTotal / 10000, maxCreeps);
          return {
            body: $.generateBody(room, [WORK, CARRY, MOVE]),
            onSuccess: () => $.setTimerCycle(taskId, builders)
          };
      },
      shouldSpawn: () => !!target && $.spawnTimerCheck(taskId)
  });
  _.forEach($.getCreeps(taskId), (c: Creep) => creepAction(c, target));
}

function creepAction(creep: Creep, constructionSite: ConstructionSite | null): void {
  if (!constructionSite) {
    creep.moveOffRoad();
    return;
  }
  const state = creep.getState();
  if (state === HaulState.Filling) {
    scavangeEnergy(creep, creep.room);
  } else { // State.Emptying
    build(creep, constructionSite);
  }
}

function build(creep: Creep, constructionSite: ConstructionSite): void {
  if (constructionSite.structureType === STRUCTURE_RAMPART) {
    return;
  }
  if (!creep.room.memory.leadBuilder || !Game.creeps[creep.room.memory.leadBuilder]) {
    creep.room.memory.leadBuilder = creep.name;
  }
  if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
    creep.moveTo(constructionSite);
  } else {
    if (creep.moveOffRoad() === OK) {
      const lead = Game.creeps[creep.room.memory.leadBuilder];
      if (lead && lead.pos.getRangeTo(constructionSite) <= 4 && creep.pos.getRangeTo(lead) > 2) {
        creep.moveTo(lead);
      }
    }
  }
}

function scavangeEnergy(creep: Creep, room: Room): void {
  if (!room.storage || (room.storage.store.energy || 0) < 10000) {
    // creep.suicide();
    return;
  }
  const target = room.storage;
  if (target) {
    if (creep.pos.isNearTo(target)) {
      creep.withdraw(target, RESOURCE_ENERGY);
      delete creep.memory.target;
    } else {
      creep.moveTo(target);
    }
  }
}
