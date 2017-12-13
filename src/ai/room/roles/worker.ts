import {$} from "../../spawns/index";
import {getConstructionTarget} from "../construction/getConstructionTarget";
import {registerRoad} from "../construction/registerRoad";
/*
 * Spawns General Workers if the room does not have a storage. (See Builder for Post Storage building).
 * 4-6 creep depending on RCL. work,carry,move.
 *
 * Will build, then upgrade.
 */
export function workers(room: Room): void {
  if (room.storage || !room.controller || room.controller.level === 1) {
    return;
  }
  const taskId = `${room.name}_workers`;
  $.registerSpawnRequest(taskId, room, {
      canSpawn: () => room.energyAvailable === room.energyCapacityAvailable,
      generateSpawnRequest: () => ({
          body: $.generateBody(room, [WORK, CARRY, MOVE]),
          onSuccess: () => $.setTimerCycle(taskId, room.energyCapacityAvailable <= 800 ? 6 : 4)
      }),
      shouldSpawn: () => $.spawnTimerCheck(taskId)
  });
  _.forEach($.getCreeps(taskId), (c: Creep) => worker(c, room));
}

function worker(creep: Creep, room: Room): void {
  const construction = getConstructionTarget(room, creep.pos);
  if (construction && room.controller!.ticksToDowngrade > 1000) {
    build(creep, construction);
  } else {
    const container = getUpgradeContainer(creep, room);
    if (container) {
      upgradeFromContainer(creep, container, room);
    }
  }
  if (room.storage && !creep.carry.energy) {
    creep.suicide();
  }
}

function build(creep: Creep, constructionSite: ConstructionSite): void {
  creep.setStatic();
  if (!creep.room.memory.leadBuilder || !Game.creeps[creep.room.memory.leadBuilder]) {
    creep.room.memory.leadBuilder = creep.name;
  }
  const lead = Game.creeps[creep.room.memory.leadBuilder];
  if (creep.name === lead.name) {
    moveToLeadPosition(creep, constructionSite);
  } else {
    moveToConstructionPosition(creep, lead, constructionSite);
  }
  if (_.findKey(creep.carry) && creep.pos.getRangeTo(constructionSite) <= 4) {
    const result = creep.build(constructionSite);
    if (result === ERR_RCL_NOT_ENOUGH) {
      constructionSite.remove();
    }
    if (result === ERR_INVALID_TARGET) {
      const blockingCreep = constructionSite.pos.lookFor(LOOK_CREEPS)[0];
      if (blockingCreep) {
          blockingCreep.move(Math.floor((Math.random() * 8) + 1) as DirectionConstant);
      }
    }
  }
}

function moveToConstructionPosition(creep: Creep, lead: Creep, constructionSite: ConstructionSite): void {
  if (creep.pos.isNearTo(lead) && creep.pos.getRangeTo(constructionSite) <= 3) {
    return;
  }

  if (lead.memory.inPosition !== constructionSite.id) {
    creep.moveOffRoad(creep);
    return;
  }

  if (creep.pos.getRangeTo(lead) > 4) {
    creep.moveTo(lead);
    return;
  }

  const positions = lead.pos.getNearbyPositions();
  const filtered = _.filter(positions,
      (p: RoomPosition) => !p.lookFor(LOOK_CREEPS)[0] && p.getRangeTo(constructionSite) <= 3);
  if (filtered.length) {
    creep.moveTo(filtered[0]);
  } else {
    if (creep.pos.getRangeTo(constructionSite) > 4) {
      creep.moveTo(constructionSite, {range: 4});
    }
  }
}

function moveToLeadPosition(creep: Creep, constructionSite: ConstructionSite): void {
  if (creep.memory.inPosition === constructionSite.id) {
    creep.setStatic();
    return;
  }
  creep.setStatic(false);
  if (creep.pos.getRangeTo(constructionSite) > 3) {
    creep.moveTo(constructionSite, {range: 2});
    return;
  }
  const positions = constructionSite.pos.getNearbyPositions(3);
  const best = _.max(positions, (p: RoomPosition) => {
    return _.filter(p.getNearbyPositions(), (op: RoomPosition) => op.isWalkable()).length;
  });
  if (best) {
    creep.moveTo(best);
    if (creep.pos.isEqualTo(best)) {
      creep.memory.inPosition = constructionSite.id;
    } else if (creep.pos.isNearTo(best)) {
      const c = best.lookFor(LOOK_CREEPS)[0];
      if (c) {
        c.move(c.pos.getDirectionTo(creep));
      }
      creep.move(creep.pos.getDirectionTo(best));
    } else {
      creep.moveTo(best);
    }
  }
}

function upgradeFromContainer(creep: Creep, container: Structure, room: Room): void {
  if (container instanceof StructureContainer && maintainContainer(creep, container)) {
    return;
  }

  if (creep.pos.getRangeTo(container) < 2) {
    creep.setStatic();
    creep.upgradeController(room.controller!);
  } else {
    creep.setStatic(false);
  }
  if (creep.pos.getRangeTo(container) > 3) {
    creep.moveTo(container, {range: 3});
    creep.memory.inPosition = undefined;
  } else {
    moveToUpgradePosition(creep, container);
    creep.withdraw(container, RESOURCE_ENERGY);
  }
}

function maintainContainer(creep: Creep, structure: StructureContainer): boolean {
  if (structure.hits < structure.hitsMax) {
    if (creep.repair(structure) === ERR_NOT_IN_RANGE) {
      creep.moveTo(structure);
    }
    if (_.sum(creep.carry) / creep.carryCapacity < 0.3 &&
        creep.withdraw(structure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(structure);
    }
    return true;
  }
  return false;
}

function getUpgradeContainer(creep: Creep, room: Room): Structure | null {
  if (!room.controller) {
    return null;
  }
  if (!creep.memory.container) {
    const c = room.controller.pos.findClosestByRange(
        room.controller.pos.findInRange(room.getStructures(STRUCTURE_CONTAINER), 4));
    creep.memory.container = c ? c.id : undefined;
  }
  if (creep.memory.container) {
    const container = Game.getObjectById<StructureContainer>(creep.memory.container);
    if (container) {
      return container;
    } else {
      delete creep.memory.container;
    }
  }
  return null;
}

function moveToUpgradePosition(creep: Creep, structure: Structure): void {
  if (creep.memory.inPosition && creep.pos.getRangeTo(structure) > 1) {
    creep.memory.inPosition = undefined;
  }
  if (creep.memory.inPosition !== true) {
    creep.memory.inPosition = undefined;
    const position = _.find(structure.pos.getNearbyPositions(), (p: RoomPosition) => {
      const c = p.lookFor(LOOK_CREEPS)[0];
      return !c || c.id === creep.id;
    });
    if (position) {
      if (creep.pos.isEqualTo(position)) {
        creep.memory.inPosition = true;
      } else {
        creep.moveTo(position);
      }
    } else {
      creep.moveTo(structure);
      registerRoad(creep.room, structure, 5000);
      creep.memory.inPosition = creep.pos.isNearTo(structure);
    }
  }
}
