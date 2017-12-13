import {$} from "../../spawns/index";

export function linkerCreep(room: Room): void {
    const taskId = `${room.name}_linker`;

    $.registerSpawnRequest(taskId, room, {
        canSpawn: () => room.energyAvailable >= 1050,
        generateSpawnRequest: () => ({
          body: [...$.generateBody(room, [CARRY], {
            maxCost: room.energyCapacityAvailable - 50,
            maxSize: 20
          }), MOVE],
          onSuccess: () => $.setTimerCycle(taskId)
        }),
        shouldSpawn: () => room.getStructures(STRUCTURE_LINK).length > 1 && $.getCreepCount(taskId) === 0
    });

    _.forEach($.getCreeps(taskId), creepAction);
}

function creepAction(creep: Creep): void {

  const storage = creep.room.storage;
  if (!storage) {
    return;
  }

  if (moveToPosition(creep)) {
    return;
  }

  if (creep.ticksToLive < 5) {
    const resource = _.findKey(creep.carry) as ResourceConstant;
    creep.transfer(storage, resource);
    if (!resource) {
      creep.suicide();
    }
    return;
  }
  const terminal = creep.room.terminal;
  if (terminal) {
    if (terminalMinerals(creep, terminal, storage)) {
      return;
    }
    if (terminalEnergy(creep, terminal, storage)) {
      return;
    }
  }

  const links = creep.room.getLinks();
  const inboundLinkLow = _.some(links.inboundLinks, (l: StructureLink) => l.energy < 400);
  if (inboundLinkLow) {
    transferToLinks(creep, links.storeLinks, storage);
  } else {
    transferToStorage(creep, links.storeLinks, storage);
  }
}

function terminalMinerals(creep: Creep, terminal: StructureTerminal, storage: StructureStorage): boolean {
  if (creep.carry.energy) {
    return false;
  }
  if (_.sum(creep.carry) > 0) {
    creep.transfer(terminal, _.findKey(creep.carry) as ResourceConstant);
    return true;
  }
  for (const mineralType in storage.store) {
    if (mineralType !== RESOURCE_ENERGY) {
      const terminalAmount = terminal.store[mineralType as ResourceConstant] || 0;
      if (terminalAmount < 10000) {
        const amount = Math.min(creep.carryCapacity, 10000 - terminalAmount,
          storage.store[mineralType as ResourceConstant] || 0);

        creep.withdraw(storage, mineralType as ResourceConstant, amount);
        return true;
      }
    }
  }
  return false;
}

function terminalEnergy(creep: Creep, terminal: StructureTerminal, storage: StructureStorage): boolean {
  if (storage.store[RESOURCE_ENERGY]! > 100000 && terminal.store[RESOURCE_ENERGY] < 40000) {
    if (creep.carry.energy! > 0) {
      creep.transfer(terminal, RESOURCE_ENERGY);
    } else {
      creep.withdraw(storage, RESOURCE_ENERGY);
    }
    return true;
  }
  if (creep.room.terminal && terminal.store[RESOURCE_ENERGY] > 42000 && storage.store[RESOURCE_ENERGY]! < 210000) {
    if (creep.carry.energy! > 0) {
      creep.transfer(storage, RESOURCE_ENERGY);
    } else {
      creep.withdraw(terminal, RESOURCE_ENERGY);
    }
    return true;
  }
  return false;
}

function transferToLinks(creep: Creep, links: ReadonlyArray<StructureLink>, storage: StructureStorage): void {
  if (creep.carry.energy! > 0) {
    const link = _.find(links, (l: StructureLink) => l.energy < l.energyCapacity && (!l.cooldown || l.cooldown < 3));
    if (link) {
      creep.transfer(link, RESOURCE_ENERGY);
    }
  } else if (storage.store.energy! > 100000) {
    creep.withdraw(storage, RESOURCE_ENERGY);
  }
}

function transferToStorage(creep: Creep, links: ReadonlyArray<StructureLink>, storage: StructureStorage): void {
  if (creep.carry.energy! > 0) {
    creep.transfer(storage, RESOURCE_ENERGY);
  } else {
    const link = _.find(links, (l: StructureLink) => l.energy > 0);
    if (link) {
      creep.withdraw(link, RESOURCE_ENERGY);
    }
  }
}

function moveToPosition(creep: Creep): boolean {
  if (!creep.memory.inPosition) {
    const position = getPosition(creep);
    if (position) {
      if (creep.pos.isEqualTo(position)) {
        creep.memory.inPosition = true;
        return false;
      } else if (creep.pos.isNearTo(position)) {
        const c = position.lookFor(LOOK_CREEPS)[0];
        if (c) {
            c.move(c.pos.getDirectionTo(creep));
        }
        creep.move(creep.pos.getDirectionTo(position));
        return true;
      } else {
        creep.moveTo(position);
        return true;
      }
    }
  }
  return false;
}

function getPosition(creep: Creep): RoomPosition | null {
  if (creep.room.storage) {
    return creep.room.storage.pos.getPositionInDirection(4);
  }
  return null;
}
