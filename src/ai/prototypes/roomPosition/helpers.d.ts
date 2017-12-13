interface RoomPosition {
    __nearbyPositions__?: RoomPosition[];
    getNearbyPositions: (range?: number) => RoomPosition[];
    getPositionInDirection: (dir: number) => RoomPosition | null;
    __isWalkable__?: boolean;
    isWalkable: () => boolean;
}
