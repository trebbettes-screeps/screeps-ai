import {$} from "../../spawns/index";

/*
 * Spawns starter creep.
 * Max 4 creep, scales depending on storage.store.energy.`
 * These act as 1. get you started in an RCL 1 base with only a spawn and 2. recovery creep in the event of base fail.
 */

export function starters(room: Room): void {
  const taskId = `${room.name}_starters`;
  $.registerSpawnRequest(taskId, room, {
      canSpawn: () => room.energyAvailable >= 300,
      generateSpawnRequest: () => ({
          body: $.generateBody(room, [WORK, CARRY, CARRY, MOVE, MOVE], {maxCost: room.energyAvailable})
      }),
      shouldSpawn: () => $.getCreepCount(taskId) < 4 && shouldSpawnStarterCreeps(room)
  });
  _.forEach($.getCreeps(taskId), (creep: Creep) => starter(creep, room));
}

function shouldSpawnStarterCreeps(room: Room): boolean {
  if (room.controller && room.controller.level === 1) {
    return true;
  }
  if (Game.time % 10 === 0) {
      const creepCount = room.find(FIND_MY_CREEPS).length;
      if (creepCount === 0) {
          room.memory.spawnStarterCreeps = true;
      } else if (creepCount > 7) {
          room.memory.spawnStarterCreeps = undefined;
      }
  }
  return room.memory.spawnStarterCreeps || false;
}

export function starter(creep: Creep, room: Room): void {
  const state = creep.getState();
  if (state === HaulState.Filling) {
    const target = creep.memory.container ?
        Game.getObjectById<Structure>(creep.memory.container) : getEnergySupplyTarget(creep, room);
    if (target) {
      creep.memory.container = target.id;
      if (target instanceof Structure) {
          withdraw(creep, target as Structure);
      } else {
          harvest(creep, target as Source);
      }
    }
  } else {
    creep.memory.container = undefined;
    const target = creep.memory.target ? Game.getObjectById<Spawn>(creep.memory.target) : getSpawnTarget(creep, room);
    if (target) {
      creep.memory.target = target.id;
      if (creep.pos.isNearTo(target)) {
        creep.transfer(target, RESOURCE_ENERGY);
        creep.memory.target = undefined;
      } else {
        creep.moveTo(target, {range: 1});
      }
    } else {
      if (creep.upgradeController(creep.room.controller!) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller!);
      }
    }
  }
}

function withdraw(creep: Creep, structure: Structure): void {
  if (creep.pos.isNearTo(structure)) {
    creep.withdraw(structure, RESOURCE_ENERGY);
    creep.memory.container = undefined;
  } else {
    creep.moveTo(structure, {range: 1});
  }
}

function harvest(creep: Creep, source: Source): void {
  if (creep.pos.isNearTo(source)) {
    if (source.energy) {
      creep.harvest(source);
    }
  } else {
    creep.moveTo(source, {range: 1});
  }
}

function getSpawnTarget(creep: Creep, room: Room): Structure | undefined {
  const targets = room.getStructures([STRUCTURE_EXTENSION, STRUCTURE_SPAWN]);
  const target = creep.pos.findClosestByRange(_.filter(targets, (t: Spawn) => t.energy < t.energyCapacity));
  return target;
}

function getEnergySupplyTarget(creep: Creep, room: Room): Structure | Source | undefined {
  if (room.storage && room.storage.store.energy) {
    return room.storage;
  }
  const tower = _.find(room.getStructures(STRUCTURE_TOWER), (t: StructureTower) => t.energy > 0);
  if (tower) {
    return tower;
  }

  const container = _.find(room.getStructures(STRUCTURE_CONTAINER), (c: StructureContainer) => c.store.energy > 0);
  if (container) {
    return container;
  }
  return creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
}
