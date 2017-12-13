import {$} from "../../spawns/index";
import {supplierCreep} from "./supplier";

export function upgraderCreep(room: Room): void {
    const taskId = `${room.name}_upgrader`;

    $.registerSpawnRequest(taskId, room, {
        canSpawn: () => room.energyCapacityAvailable === room.energyAvailable,
        generateSpawnRequest: () => ({
          body: [...$.generateBody(room, [WORK], {
            maxCost: room.energyCapacityAvailable - 150,
            maxSize: room.controller!.level === 8 ? 15 : undefined
          }), CARRY, CARRY, MOVE],
          onSuccess: () => $.setTimerCycle(taskId)
        }),
        shouldSpawn: () => !!room.storage && room.storage.store.energy! > 100000
    });

    _.forEach($.getCreeps(taskId), creepAction);

    const container = Game.getObjectById<Structure>(memoizedStructureId(room.name));
    if (container && container instanceof StructureContainer) {
      supplierCreep(room, container);
    }
}

function creepAction(creep: Creep): void {
  const room = Game.rooms[creep.memory.origin];
  const container = getUpgradeContainer(creep, room);
  if (container) {
    upgradeFromContainer(creep, container, room);
  }
}

const memoizedStructureId = _.memoize((roomName: string): string | undefined => {
  const room = Game.rooms[roomName];
  if (!room) {
    return undefined;
  }
  const controller = room.controller;
  if (!controller) {
      return undefined;
  }
  if (room.storage && room.storage.pos.inRangeTo(controller, 4) && room.storage.my) {
    return room.storage.id;
  }
  if (room.terminal && room.terminal.pos.inRangeTo(room.terminal, 4) && room.terminal.my) {
      return room.terminal.id;
  }
  const link = _.find(room.getStructures(STRUCTURE_LINK), (l: StructureLink) => l.my && l.pos.inRangeTo(controller, 4));
  if (link) {
    return link.id;
  }
  const container = _.find(room.getStructures(STRUCTURE_CONTAINER),
    (c: StructureContainer) => c.pos.inRangeTo(controller, 4));
  if (container) {
    return container.id;
  }

  return undefined;
});

function getUpgraderPositions(room: Room): RoomPosition[] {
    const structureId = memoizedStructureId(room.name);
    const structure = Game.getObjectById<Structure>(structureId);
    if (!structure || !room.controller) {
        return [];
    }
    const positions = structure.pos.getNearbyPositions();
    return _(positions)
        .filter((p: RoomPosition) => p.isWalkable())
        .sortBy((p: RoomPosition) => p.getRangeTo(room.controller!)).value();
}

function upgradeFromContainer(creep: Creep, container: Structure, room: Room): void {
  if (container instanceof StructureContainer && maintainContainer(creep, container)) {
    return;
  }
  creep.upgradeController(room.controller!);
  if (_.sum(creep.carry) / creep.carryCapacity < 0.3) {
    if (creep.pos.getRangeTo(container) > 3) {
      creep.moveTo(container, {range: 3});
    } else {
      getInPosition(creep, container);
      creep.withdraw(container, RESOURCE_ENERGY);
    }
  } else {
    if (creep.pos.getRangeTo(room.controller!) > 3) {
      creep.moveTo(room.controller!, {range: 3});
    }
  }
}

function getInPosition(creep: Creep, structure: Structure): void {
  if (!creep.memory.inPosition) {
    const position = _.find(getUpgraderPositions(creep.room), (p: RoomPosition) => {
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
      creep.memory.inPosition = creep.pos.isNearTo(structure);
    }
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
  if (creep.memory.container === undefined) {
    const c = Game.getObjectById<Structure>(memoizedStructureId(room.name));
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
