export function analyseRoom(room: Room): void {
    const roomType = room.getType();
    if (!_.contains([RoomTypes.Center, RoomTypes.SourceKeeper, RoomTypes.Standard], roomType)) {
        return;
    }
    const minerals = room.isMine() || _.contains([RoomTypes.Center, RoomTypes.SourceKeeper], roomType) ?
        room.find(FIND_MINERALS) : [];

    const resources = [...room.find(FIND_SOURCES), ...minerals];
    _.forEach(resources, analyseResource);
}

function analyseResource(resource: Source | Mineral): void {
    Memory.__resources__ = Memory.__resources__ || {};
    const deliveryRoom = getAnalysis(resource);
    if (!deliveryRoom) {
        Memory.__resources__[resource.id] = undefined;
        return;
    }
    Memory.__resources__[resource.id] = getAnalysis(resource);
}

function getAnalysis(resource: Source | Mineral): ResourceInfo | undefined {
    const destInfo = _(Game.rooms)
        .filter((r: Room) => r.isMine() && Game.map.getRoomLinearDistance(resource.pos.roomName, r.name) <= 4)
        .map((r: Room) => getResourceInfo(resource, r))
        .sortBy((i: ResourceInfo) => i.routeDistance)
        .value();

    if (destInfo.length === 0) {
        return undefined;
    }

    let best = destInfo.length === 1 ? destInfo[0] : null;

    if (!best) {
        const rangeOfClosest = destInfo[0].routeDistance;
        const searchData = _.filter(destInfo, (i: ResourceInfo) => i.routeDistance <= rangeOfClosest + 1);
        best = _.min(searchData, (i: ResourceInfo) => {
            const st = Game.rooms[i.destRoomName] ? Game.rooms[i.destRoomName].storage : null;
            return PathFinder.search(resource.pos, {
                pos: st ? st.pos : new RoomPosition(25, 25, i.destRoomName),
                range: 1
            }).path.length;
        });

        if (!best || best instanceof Number) {
            return undefined;
        }
    }

    const storage = Game.rooms[best.destRoomName] ? Game.rooms[best.destRoomName].storage : null;

    best.distance = PathFinder.search(resource.pos, {
        pos: storage ? storage.pos : new RoomPosition(25, 25, best.destRoomName),
        range: 5
    }, {maxOps: 10000, swampCost: 2}).path.length;

    return best.distance <= 125 ? best : undefined;
}

function getResourceInfo(resource: Source | Mineral, room: Room): ResourceInfo {
    const route = Game.map.findRoute(resource.pos.roomName, room.name);
    return {
        destRoomName: room.name,
        distance: 0,
        id: resource.id,
        resourceType: resource instanceof Source ? RESOURCE_ENERGY : resource.mineralType,
        roomName: resource.pos.roomName,
        roomType: resource.room!.getType(),
        routeDistance: route instanceof Number ? Infinity : _.size(route)
    };
}
