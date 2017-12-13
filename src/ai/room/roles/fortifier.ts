
import {$} from "../../spawns/index";

/*
 * Spawns fortifiers.
 * Max 4 creeps, scales depending on storage.store.energy.`
 */
export function fortifier(room: Room): void {
  if (!room.storage) {
    return;
  }
  const taskId = `${room.name}_fortifier`;
  $.registerSpawnRequest(taskId, room, {
      canSpawn: () => room.energyCapacityAvailable === room.energyAvailable,
      generateSpawnRequest: () => {
          const energy = room.storage!.store.energy || 0;
          const maxCreeps = Math.ceil(Math.min(energy / 1000000, 4));
          return {
              body: $.generateBody(room, [WORK, CARRY, MOVE]),
              onSuccess: () => $.setTimerCycle(taskId, maxCreeps)
          };
      },
      shouldSpawn: () => $.spawnTimerCheck(taskId) && fortifierRequired(room)
  });
  _.forEach($.getCreeps(taskId), creepAction);
}

function fortifierRequired(room: Room): boolean {
  if (!room.storage) {
    return false;
  }
  if (room.storage.store.energy || 0 < 50000) {
    return false;
  }
  if (Game.time % 51 === 0) {
    const ramparts = _.filter(room.getStructures(STRUCTURE_RAMPART),
      (r: StructureRampart) => r.hits < rampartHeights[room.controller!.level]);
    if (ramparts.length) {
      room.memory.fortifierRequired = true;
    }
    const sites = room.find(FIND_CONSTRUCTION_SITES,
      {filter: (cs: ConstructionSite): boolean => cs.structureType === STRUCTURE_RAMPART});
    room.memory.fortifierRequired = sites.length > 0;
  }
  return !!room.memory.fortifierRequired;
}

function creepAction(creep: Creep): void {
  const target = getTarget(creep);
  if (!target) {
    creep.suicide();
  }
  const state = creep.getState();
  if (state === HaulState.Emptying) {
    if (target instanceof Structure) {
      repair(creep, target);
    } else if (target instanceof ConstructionSite) {
      build(creep, target);
    }
  } else { // State.Filling
    collectEnergy(creep);
  }
}

function repair(creep: Creep, structure: Structure): void {
  const range = creep.pos.getRangeTo(structure);
  if (range > 3) {
    creep.moveTo(structure, {range: 3});
  } else {
    creep.moveOffRoad(structure);
  }
  if (range <= 3) {
    creep.repair(structure);
  }
}

function build(creep: Creep, site: ConstructionSite): void {
  if (creep.build(site) === ERR_NOT_IN_RANGE) {
    creep.moveTo(site, { range: 3 });
  }
}

function collectEnergy(creep: Creep): void {
  creep.memory.target = undefined;
  const storage = creep.room.storage;
  if (storage) {
    if (creep.pos.getRangeTo(storage) > 5) {
      creep.moveTo(storage);
    } else if ((storage.store.energy || 0) > creep.carryCapacity &&
        creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(storage);
    }
  }
}

function getNextTargetId(creep: Creep): string | undefined {
    const newRampart = getNewRampart(creep);
    if (newRampart) {
        return newRampart.id;
    }
    const site = _.find(creep.room.find(FIND_CONSTRUCTION_SITES),
        (cs: ConstructionSite) => cs.structureType === STRUCTURE_RAMPART);

    if (site && site.structureType === STRUCTURE_RAMPART) {
        creep.memory.lastTarget = site.pos;
        return site.id;
    }
    const ramparts = creep.room.getStructures(STRUCTURE_RAMPART);
    const lowest = _.min(ramparts, (r: StructureRampart) => r.hits);
    if (lowest) {
        return lowest.id;
    }
    return undefined;
}

function getTarget(creep: Creep): ConstructionSite | StructureRampart | null {
  if (creep.memory.target) {
    const target = Game.getObjectById<StructureRampart | ConstructionSite>(creep.memory.target);
    if (!target) {
      creep.memory.target = getNextTargetId(creep);
    } else {
      return target;
    }
  } else {
    creep.memory.target = getNextTargetId(creep);
  }
  return creep.memory.target ? Game.getObjectById<ConstructionSite | StructureRampart>(creep.memory.target) : null;
}

function getNewRampart(creep: Creep): StructureRampart | null {
  const lastTargetPos = _.create(RoomPosition.prototype, creep.memory.lastTarget);
  if (lastTargetPos) {
    const rampart = _.find(lastTargetPos.lookFor(LOOK_STRUCTURES),
        (s: StructureRampart) => s instanceof StructureRampart && s.hits < 10000);
    if (rampart) {
      return rampart as StructureRampart;
    }
    delete creep.memory.lastTarget;
  }
  return null;
}

const rampartHeights: { [roomLevel: number]: number } = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 100000,
  7: 1000000,
  8: 10000000
};
