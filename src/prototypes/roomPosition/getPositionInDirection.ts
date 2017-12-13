RoomPosition.prototype.getPositionInDirection = function(direction: number): RoomPosition | null {
    const [xOffset, yOffset]: number[] = offsets[direction];
    const x = this.x + xOffset;
    const y = this.y + yOffset;
    if (x > 49 || x < 0 || y > 49 || y < 0) {
        return null;
    }
    return new RoomPosition(x, y, this.roomName);
};

const offsets: {[dir: string]: [number, number]} = {
    [TOP]: [0, -1],
    [TOP_RIGHT]: [+1, -1],
    [RIGHT]: [+1, 0],
    [BOTTOM_RIGHT]: [+1, +1],
    [BOTTOM]: [0, +1],
    [BOTTOM_LEFT]: [-1, +1],
    [LEFT]: [-1, 0],
    [TOP_LEFT]: [-1, -1]
};
