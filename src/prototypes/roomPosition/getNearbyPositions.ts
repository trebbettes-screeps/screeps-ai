RoomPosition.prototype.getNearbyPositions = function getNearbyPositions(range: number = 1): RoomPosition[] {
    if (!this.__nearbyPositions__) {
        const pos = _.flatten(
            _.times(range * 2 + 1, (x: number) =>
                _.times(range * 2 + 1, (y: number) =>
                    new RoomPosition(this.x - range + x, this.y - range + y, this.roomName))));

        this.__nearbyPositions__ = _.filter(pos, (p: RoomPosition) => 0 < p.x && p.x < 49 && 0 < p.y && p.y < 49);
    }
    return this.__nearbyPositions__;
};
