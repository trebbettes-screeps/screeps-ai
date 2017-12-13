export function getRoomsFromRoute(roomName: string, roomName2: string): string[] {
    const route = Game.map.findRoute(roomName, roomName2);
    if (route instanceof Number) {
        return [];
    }
    return [roomName, ..._.map(route, "room")] as string[];
}
