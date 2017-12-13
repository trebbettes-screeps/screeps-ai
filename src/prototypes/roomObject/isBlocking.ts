RoomObject.prototype.isBlocking = function isBlocking(): boolean {
    return inaccessibleRampart(this) ||
        isBlockingStructure(this) ||
        isBlockingConstructionSite(this);
};

function inaccessibleRampart(thing: RoomObject): boolean {
    return thing instanceof StructureRampart && !thing.my && !thing.isPublic;
}

function isBlockingStructure(thing: RoomObject): boolean {
    return thing instanceof Structure &&
        thing.structureType !== STRUCTURE_CONTAINER &&
        thing.structureType !== STRUCTURE_ROAD &&
        thing.structureType !== STRUCTURE_PORTAL;
}

function isBlockingConstructionSite(thing: RoomObject) {
    return thing instanceof ConstructionSite &&
        thing.my &&
        thing.structureType !== STRUCTURE_CONTAINER &&
        thing.structureType !== STRUCTURE_ROAD &&
        thing.structureType !== STRUCTURE_RAMPART;
}
