import {$} from "../../spawns/index";
import {MINERALS_RAW, PRODUCT_LIST, PRODUCTION_AMOUNT, REAGENT_LIST} from "./chemistConfig";

export function chemistCreep(room: Room): void {
  const taskId = `${room.name}_chemist`;

  $.registerSpawnRequest(taskId, room, {
      canSpawn: () => room.energyAvailable >= 1250 || room.energyAvailable === room.energyCapacityAvailable,
      generateSpawnRequest: () => ({
        body: $.generateBody(room, [CARRY, CARRY, CARRY, CARRY, MOVE], {maxCost: 1250}),
        onSuccess: () => $.setTimerCycle(taskId)
      }),
      shouldSpawn: () => !!room.getStructures(STRUCTURE_LAB)[0] && $.spawnTimerCheck(taskId)
  });

  _.forEach($.getCreeps(taskId), creepAction);
}

function creepAction(creep: Creep): void {
  const reagentLabs = getReagentLabs(creep);
  if (reagentLabs.length < 2) {
    return;
  }

  runReactions(creep.room, reagentLabs);

  creep.memory.sleepUntil = (creep.memory.sleepUntil || 0) > Game.time ? creep.memory.sleepUntil : undefined;
  if (creep.memory.sleepUntil) {
    return;
  }

  const terminal = creep.room.terminal;
  if (!terminal) {
    return;
  }

  if (!creep.memory.reagents && emptyLabs(creep, terminal)) {
    return;
  }

  if (fillReagents(creep, terminal, reagentLabs)) {
    return;
  }

  if (moveToIdlePosition(creep, terminal)) {
    return;
  }

  if (creep.memory.reagents && _.all(reagentLabs, (lab: StructureLab) => lab.mineralAmount > 0)) {
    creep.memory.reagents = undefined;
    const leastFull = _.min(reagentLabs, (l: StructureLab) => l.mineralAmount);
    if (leastFull) {
      creep.memory.sleepUntil = Game.time + Math.ceil(leastFull.mineralAmount / 5) + 10;
    }
  }
}

function moveToIdlePosition(creep: Creep, terminal: StructureTerminal): boolean {
  const idlePos = terminal.pos.getPositionInDirection(4);
  if (!idlePos || creep.pos.isEqualTo(idlePos)) {
    return false;
  }

  if (creep.pos.isNearTo(idlePos)) {
    const oc = idlePos.lookFor(LOOK_CREEPS)[0];
    if (oc) {
      oc.move(oc.pos.getDirectionTo(creep));
    }
    creep.move(creep.pos.getDirectionTo(idlePos));
  } else {
    creep.moveTo(idlePos, {range: 1});
  }
  return true;
}

function runReactions(room: Room, reagentLabs: ReadonlyArray<StructureLab>): void {
  const labs = _.filter(room.getStructures(STRUCTURE_LAB),
    (l: StructureLab) => !_.find(reagentLabs, (lab: StructureLab) => l.id === lab.id));

  _.forEach(labs, (l: StructureLab): void | false => {
    if (l.runReaction(reagentLabs[0], reagentLabs[1]) === OK) {
      return false;
    }
  });
}

function fillReagents(creep: Creep, terminal: StructureTerminal, labs: ReadonlyArray<StructureLab>): boolean {
  const reagents = getReagentsToLoad(creep);

  const reagentToFill = _.find(reagents, (r: ResourceConstant) =>
    !_.any(labs, (lab: StructureLab) => lab.mineralType === r) && (terminal.store[r] || creep.carry[r]));

  const labToFill = _.find(labs, (l: StructureLab) => !l.mineralType);
  if (reagentToFill && labToFill) {
    if (creep.carry[reagentToFill]) {
      transferToStructure(creep, labToFill);
    } else {
      if (creep.pos.isNearTo(terminal)) {
        creep.withdraw(terminal, reagentToFill);
      } else {
        creep.moveTo(terminal);
      }
    }
    return true;
  }
  return false;
}

function emptyLabs(creep: Creep, terminal: StructureTerminal): boolean {
  if (transferToStructure(creep, terminal)) {
    return true;
  }
  const labs = creep.room.getStructures<StructureLab>(STRUCTURE_LAB);
  const labToEmpty = _.find(labs, (l: StructureLab) => l.mineralAmount > 0);
  if (labToEmpty) {
    if (creep.pos.isNearTo(labToEmpty)) {
      creep.withdraw(labToEmpty, labToEmpty.mineralType);
    } else {
      creep.moveTo(labToEmpty);
    }
    return true;
  }
  return false;
}

function transferToStructure(creep: Creep, structure: Structure): boolean {
  if (_.findKey(creep.carry)) {
    if (creep.pos.isNearTo(structure)) {
      creep.transfer(structure, _.findKey(creep.carry) as ResourceConstant);
    } else {
      creep.moveTo(structure, {range: 1});
    }
    return true;
  }
  return false;
}

function getReagentsToLoad(creep: Creep): ReadonlyArray<ResourceConstant> {
  if (!creep.memory.reagents) {
    const target = getTargetResource(creep.room);
    creep.memory.reagents = target ? getReagents(target) : undefined;
  }
  return creep.memory.reagents || [];
}

function getReagentLabs(creep: Creep): ReadonlyArray<StructureLab> {
  if (creep.memory.reagentLabs) {
    const memorisedLabs = _(creep.memory.reagentLabs)
      .map((id: string) => Game.getObjectById<StructureLab>(id))
      .filter(_.identity)
      .value() as ReadonlyArray<StructureLab>;

    if (memorisedLabs.length >= 2) {
      return memorisedLabs;
    }
    creep.memory.reagentLabs = undefined;
  }

  const labs = creep.room.getStructures<StructureLab>(STRUCTURE_LAB);
  if (labs.length <= 2) {
    return [];
  }
  const reagentLabs = _.sortBy(labs, (l: StructureLab) => -l.pos.findInRange(labs, 2).length).slice(0, 2);
  creep.memory.reagentLabs = _.map(reagentLabs, (l: StructureLab) => l.id);
  return reagentLabs;
}

function getReagents(resource: string): ResourceConstant[] {
  return REAGENT_LIST[resource];
}

function getTargetResource(room: Room): string | null {
  if (!room.terminal) {
    return null;
  }

  const terminal = room.terminal!;

  const targetProduct = getTargetProduct(terminal);
  if (!targetProduct) {
    return null;
  }

  const targetResource = getTargetResourceRecursive(targetProduct, terminal);

  return targetResource || null;
}

function getTargetProduct(terminal: StructureTerminal): string | null {
  return _.find(PRODUCT_LIST, (r: ResourceConstant): boolean => currentAmt(r, terminal) < PRODUCTION_AMOUNT) || null;
}

function getTargetResourceRecursive(resource: string, terminal: StructureTerminal): string | null {
  const reagents = REAGENT_LIST[resource];
  const canConstruct = _.all(reagents, (r: ResourceConstant) => isRawMineral(r) || currentAmt(r, terminal) > 0);
  if (canConstruct) {
    return resource;
  }
  const nextReagent = _.find(reagents, (r: ResourceConstant) => !isRawMineral(r) && currentAmt(r, terminal) === 0);
  return nextReagent ? getTargetResourceRecursive(nextReagent, terminal) : null;
}

function isRawMineral(resource: string): boolean {
  return _.contains(MINERALS_RAW, resource);
}

function currentAmt(resource: ResourceConstant, terminal: StructureTerminal): number {
  return terminal.store[resource] || 0;
}
