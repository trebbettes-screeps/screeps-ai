export function distributor(creep: Creep, room: Room, source: Source, workers: Creep[]): void {
  const state = creep.getState();
  creep.memory.group = CreepGroup.Distrbutor;
  if (state === HaulState.Emptying) {
    emptyAction(creep, room, workers);
  } else {
    fillAction(creep, source);
  }
}

function fillAction(creep: Creep, source: Source): void {
  const container = getContainer(creep, source);
  if (container) {
    if (creep.pos.isNearTo(container)) {
      if (container.store.energy > creep.carryCapacity) {
        creep.withdraw(container, RESOURCE_ENERGY);
      }
    } else {
      creep.moveTo(container, {range: 1});
    }
  }
}

function getContainer(creep: Creep, source: Source): StructureContainer | null {
  if (!creep.memory.container) {
    const container = source.pos.findInRange(source.room.getStructures<StructureContainer>(STRUCTURE_CONTAINER), 1)[0];
    if (container) {
      creep.memory.container = container.id;
      return container;
    }
    return null;
  }
  const con = Game.getObjectById<StructureContainer>(creep.memory.container);
  creep.memory.container = con ? creep.memory.container : undefined;
  return con;
}

function emptyAction(creep: Creep, room: Room, workers: Creep[]): void {
  if (room) {
    if (supplyPrimaryTargets(creep, room)) {
      return;
    } else {
      if (room.find(FIND_CONSTRUCTION_SITES)[0] && room.controller!.ticksToDowngrade > 1000) {
        supplyToCreeps(creep, room, workers);
      } else if (!supplyToUpgradeContainer(creep, room)) {
        if (room.storage) {
          supplyStorage(creep, room.storage);
        }
      }
    }
  }
}

function supplyToCreeps(creep: Creep, room: Room, workers: Creep[]): void {
  if (creep.pos.roomName !== room.name) {
    creep.moveToRoom(room.name);
    return;
  }
  const target = getCreepTarget(creep, workers);
  if (target) {
    if (creep.pos.isNearTo(target)) {
      creep.transfer(target, RESOURCE_ENERGY);
      creep.memory.target = undefined;
    } else {
      creep.moveTo(target, {range: 1});
    }
  }
}

function supplyToUpgradeContainer(creep: Creep, room: Room): boolean {
  if (room.controller && creep.memory.container === undefined) {
    const container = room.controller.pos.findInRange(room.getStructures(STRUCTURE_CONTAINER), 4)[0];
    creep.memory.container = container && container instanceof StructureContainer ? container.id : undefined;
  }
  if (creep.memory.container) {
    const container = Game.getObjectById<StructureContainer>(creep.memory.container);
    if (container) {
      if (creep.pos.isNearTo(container)) {
        creep.transfer(container, RESOURCE_ENERGY);
      } else {
        creep.moveTo(container, {range: 1});
      }
    }
    return true;
  }
  return false;
}

function getCreepTarget(creep: Creep, workers: Creep[]): Creep | null {
  const target = Game.getObjectById<Creep>(creep.memory.target);
  if (!target) {
    const empty = _.filter(workers, (c: Creep) => !c.carry.energy);
    const closest = creep.pos.findClosestByRange<Creep>(empty);
    if (closest) {
      creep.memory.target = closest.id;
      return closest;
    }
  }
  return target;
}

function supplyStorage(creep: Creep, storage: StructureStorage): void {
  if (creep.pos.isNearTo(storage)) {
    creep.transfer(storage, RESOURCE_ENERGY);
  } else {
    creep.moveTo(storage, {range: 1});
  }
}

function supplyPrimaryTargets(creep: Creep, room: Room): boolean {
  const target = getPrimaryEnergyTarget(creep, room);
  if (target) {
    if (creep.pos.isNearTo(target)) {
      creep.transfer(target, RESOURCE_ENERGY);
    } else {
      creep.moveTo(target, {range: 1});
    }
    return true;
  } else {
    return false;
  }
}

type EnergyStructure = StructureSpawn | StructureExtension | StructureTower;

function getPrimaryEnergyTarget(creep: Creep, room: Room): Structure | null {
  creep.memory.targets = creep.memory.targets || [];
  const target = Game.getObjectById<StructureSpawn>(creep.memory.targets[0]);
  const newTarget = !target || target.energy === target.energyCapacity;
  if (!newTarget) {
    return target;
  }
  if (newTarget && creep.memory.targets.length > 1) {
    creep.memory.targets.splice(0, 1);
    const next = Game.getObjectById<StructureSpawn>(creep.memory.targets[0]);
    if (next) { return next; }
  }
  if (newTarget && _.sum(creep.carry) === creep.carryCapacity) {
    const structures = room.getStructures<EnergyStructure>([STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER]);
    const toReserve = getStructuresToReserve(structures, creep, room);
    if (toReserve.length) {
      creep.memory.targets = _.map(toReserve, (s: any) => s.id);
      return toReserve[0];
    }
  }
  return null;
}

function getStructuresToReserve(structures: EnergyStructure[], creep: Creep, room: Room): Structure[] {
  const reservedStructures = _(room.find(FIND_MY_CREEPS))
    .filter((c: Creep) => c.memory.group === CreepGroup.Distrbutor &&
        c.memory.state === HaulState.Emptying &&
        c.memory.targets &&
        c.memory.targets.length)
    .map((c: Creep) => c.memory.targets)
    .flatten()
    .value();

  let energyReserved = 0;
  const carrying = _.sum(creep.carry);
  return _(structures)
    .sortBy((s: Spawn) => creep.pos.getRangeTo(s))
    .filter((s: StructureSpawn) => {
      if (energyReserved >= carrying) {
        return false;
      }
      const needsEnergy = s instanceof StructureTower ?
        s.energy / s.energyCapacity < 0.5 :
        s.energy < s.energyCapacity;
      if (needsEnergy && !_.contains(reservedStructures, s.id)) {
        energyReserved += s.energyCapacity - s.energy;
        return true;
      }
      return false;
  }).value();
}
