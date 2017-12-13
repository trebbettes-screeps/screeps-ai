export function layRemoteStructures(room: Room): void {
  if (Game.time % 102 !== 0) {
    return;
  }
  maintainUpgraderStructure(room);
  placeExtractor(room);
}

function maintainUpgraderStructure(room: Room): void {
  if (!room.controller) {
    return;
  }
  const structures = room.getStructures([STRUCTURE_LINK, STRUCTURE_CONTAINER]);
  const structure = room.controller.pos.findClosestByRange(room.controller.pos.findInRange(structures, 4));
  if (!structure && !room.find(FIND_CONSTRUCTION_SITES)[0]) {
    const position = getStructurePosition(room);
    if (position) {
      if (room.controller && room.controller.level > 4) {
        position.createConstructionSite(STRUCTURE_LINK);
      } else {
        position.createConstructionSite(STRUCTURE_CONTAINER);
      }
    }
  }
  if (structure instanceof StructureContainer && room.controller.level > 4) {
    structure.destroy();
  }
}

function getStructurePosition(room: Room): RoomPosition | null {
  const spaces = _.map(room.controller!.pos.getNearbyPositions(2), (p: RoomPosition) => ({
    pos: p,
    spaces: _.filter(p.getNearbyPositions(), (w: RoomPosition) => w.isWalkable()).length
  }));
  return spaces.length ? _.max(spaces, (s: {spaces: number, pos: RoomPosition}) => s.spaces).pos : null;
}

function placeExtractor(room: Room): void {
  if (room.controller && room.controller.level >= 6) {
    const extractor = room.getStructures(STRUCTURE_EXTRACTOR);
    const mineral = room.find(FIND_MINERALS)[0];
    if (!extractor && mineral) {
      mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
    }
  }
}

function placeMineralContainers(room: Room): void {
  if (!room.controller || !room.controller.my || room.getType() !== RoomTypes.SourceKeeper) {
    return;
  }
  const mineral = room.find(FIND_MINERALS)[0];
  if (!mineral) {
    return;
  }
  if (mineral.mineralAmount > 0 || mineral.ticksToRegeneration < 1000) {
    const containers = room.getStructures(STRUCTURE_CONTAINER);
    if (mineral.pos.findInRange(containers, 1).length === 0) {
      const positions = mineral.pos.getNearbyPositions();
      if (positions.length) {
        const mostAvailable = _.max(positions, (p: RoomPosition) => p.findInRange(positions, 1).length);
        mostAvailable.createConstructionSite(STRUCTURE_CONTAINER);
      }
    }
  }
}
