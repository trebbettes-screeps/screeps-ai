export function registerRoad(room: Room, destination: {id: string}, every?: number): void {
    if (every && Game.time % every !== 0) {
        return;
    }
    room.memory.roads = room.memory.roads || [];
    if (!_.contains(room.memory.roads, destination.id)) {
        room.memory.roads.push(destination.id);
    }
}
