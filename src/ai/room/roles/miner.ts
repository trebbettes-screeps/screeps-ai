import {registerRoad} from "../construction/registerRoad";
import {simpleMiner} from "./simpleMiner";

export function minerRole(creep: Creep, source: Source): void {
  if (creep.memory.simplified) {
    simpleMiner(creep);
    return;
  }

  const sourceStructure = getStructure(creep, source);

  if (sourceStructure) {
    if (getInPosition(creep, source, sourceStructure)) {
      simplifyCreep(creep, source, sourceStructure);
    }
    return;
  }

  const constructionSite = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1,
    {filter: (cs: ConstructionSite): boolean => cs.structureType === STRUCTURE_CONTAINER})[0];

  if (constructionSite) {
    buildSourceContainer(creep, source, constructionSite);
  } else {
    placeConstructionSite(source);
  }
}

function getStructure(creep: Creep, source: Source): Structure | null {
  if (!creep.memory.structure) {
    const structures = source.room.find<Structure>(FIND_STRUCTURES, {
      filter: (s: Structure) => s instanceof StructureContainer || s instanceof StructureLink
    });

    const sourceStructure: Structure = source.pos.findInRange(structures, 1)[0];

    if (sourceStructure) {
      creep.memory.structure = sourceStructure.id;
      return sourceStructure;
    }
  }
  return Game.getObjectById(creep.memory.structure);
}

function simplifyCreep(creep: Creep, source: Source, structure: Structure): void {
  const origin = Game.rooms[creep.memory.origin];
  if (origin && origin.energyCapacityAvailable >= 800) {
      registerRoad(origin, structure);
  }
  creep.memory = {
    origin: creep.memory.origin,
    simplified: true,
    source: source.id,
    structure: structure.id,
    workPosition: creep.pos
  };
}

function getInPosition(creep: Creep, source: Source, structure: Structure): boolean {
  if (creep.pos.isEqualTo(structure)) {
    return true;
  }

  if (creep.pos.getRangeTo(structure) > 5) {
    creep.moveTo(structure, {range: 2});
    return false;
  }

  if (structure instanceof StructureContainer && !structure.pos.lookFor(LOOK_CREEPS)[0]) {
    creep.moveTo(structure);
    return false;
  }
  if (creep.pos.isNearTo(structure) && creep.pos.isNearTo(source)) {
    return true;
  }
  const positions = nearByPositions(source.pos);
  const pos = _.find(positions, (p: RoomPosition) => !p.lookFor(LOOK_CREEPS)[0] && p.isNearTo(structure));
  if (pos) {
    creep.moveTo(pos);
  }
  return false;
}

function nearByPositions(pos: RoomPosition): RoomPosition[] {
  const positions = _.flatten(
    _.times(3, (x: number) =>
      _.times(3, (y: number) =>
        new RoomPosition(pos.x - 1 + x, pos.y - 1 + y, pos.roomName))));

  return _.filter(positions, (p: RoomPosition) => {
    return 0 < p.x && p.x < 49 && 0 < p.y && p.y < 49 && p.lookFor(LOOK_TERRAIN)[0] !== "wall";
  });
}

function buildSourceContainer(creep: Creep, source: Source, constructionSite: ConstructionSite): void {
  if (!creep.pos.isNearTo(source)) {
    creep.moveTo(source);
    return;
  }

  const resource = constructionSite.pos.lookFor(LOOK_RESOURCES);
  if (resource.length) {
    creep.pickup(resource[0]!);
    creep.build(constructionSite);
    return;
  }

  if (_.sum(creep.carry) < creep.carryCapacity * 0.9) {
    creep.harvest(source);
  } else {
    creep.build(constructionSite);
  }
}

function placeConstructionSite(source: Source): void {
  const positions = nearByPositions(source.pos);
  const best = _.max(positions, (p: RoomPosition) => p.findInRange(positions, 1).length);
  if (best) {
    best.createConstructionSite(STRUCTURE_CONTAINER);
  }
}
