interface SerenityCartographyModule {
    analyseRoom(room: Room): void;
    findResources(room: Room, includeSk?: boolean): ResourceInfo[];
    getRoomsFromRoute(room1: string, room2: string): string[];
    getRoomsInRange(startRoom: string, range: number): string[];
    getMineralsInRange(room: Room, take: number): Mineral[];
    getResourceInfo(resource: Source | Mineral): ResourceInfo | null;
    isHostileRoom(roomName: string): HostileRoomInfo | null;
    sendExplorer(from: Room): void;
    setRoomHostilityStatus(room: Room): void;
}

interface ResourceInfo {
    id: string;
    destRoomName: string;
    roomName: string;
    distance: number;
    resourceType: string;
    roomType: RoomTypes;
    routeDistance: number;
}

interface HostileRoomInfo {
    lastSeen: number;
    level: number;
    username: string;
}
