export function setRoomHostilityStatus(room: Room): void {
    if (!room.controller || room.controller.my || !room.controller.owner || isOwnedByScreeps(room.controller)) {
        Memory.$.hostileRooms[room.name] = undefined;
        return;
    }

    Memory.$.hostileRooms[room.name] = {
        lastSeen: Game.time,
        level: room.controller.level,
        username: room.controller.owner.username
    };
}

export function isHostileRoom(roomName: string): HostileRoomInfo | null {
    return Memory.$.hostileRooms[roomName] || null;
}

function isOwnedByScreeps(controller: StructureController): boolean {
    return controller.owner && controller.owner.username === "Screeps";
}
