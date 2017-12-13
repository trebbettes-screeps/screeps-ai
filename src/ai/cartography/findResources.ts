export function findResources(room: Room, sk: boolean = false): ResourceInfo[] {
    return _(Memory.__resources__)
        .filter((ri: ResourceInfo) => ri.destRoomName === room.name && (sk || ri.roomType === RoomTypes.Standard))
        .sortBy((ri: ResourceInfo) => ri.routeDistance === 0 ? 0 : ri.distance).value();
}
