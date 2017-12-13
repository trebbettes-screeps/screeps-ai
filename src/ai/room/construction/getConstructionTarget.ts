export function getConstructionTarget(room: Room, nearestTo?: RoomPosition): ConstructionSite | null {
    if (!room.memory.constructionTarget) {
        if ((room.memory.pauseConstructionCheck || 0) > Game.time - 25) {
            return null;
        } else {
            const sites = room.find(FIND_MY_CONSTRUCTION_SITES,
                { filter: (cs: ConstructionSite): boolean => cs.structureType !== STRUCTURE_RAMPART});
            if (sites.length) {
                const site = nearestTo && sites.length > 1 ? nearestTo.findClosestByRange(sites) : sites[0];
                room.memory.constructionTarget = site.id;
                return site;
            } else {
                room.memory.pauseConstructionCheck = Game.time;
            }
        }
    }
    if (room.memory.constructionTarget) {
        const site = Game.getObjectById<ConstructionSite>(room.memory.constructionTarget);
        if (!site) {
            delete room.memory.constructionTarget;
        } else {
            return site;
        }
    }
    return null;
}
