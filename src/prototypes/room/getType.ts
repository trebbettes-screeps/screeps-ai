const memoizedType = _.memoize((roomName: string): number => {
    const coordinates = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
    if (coordinates) {
        const [modX, modY]: [number, number] = [Number(coordinates[1]) % 10, Number(coordinates[2]) % 10];

        if (modX === 0 && modY === 0) {
            return RoomTypes.Crossroads;
        } else if (modX === 0 || modY === 0) {
            return RoomTypes.Highway;
        } else if (modX === 5 && modY === 5) {
            return RoomTypes.Center;
        } else if (modX >= 4 && modX <= 6 && modY >= 4 && modY <= 6) {
            return RoomTypes.SourceKeeper;
        } else {
            return RoomTypes.Standard;
        }
    }
    return RoomTypes.Error;
});

Room.prototype.getType = function(): number {
    return Room.getType(this.name);
};

Room.getType = function getType(roomName: string): number {
    return memoizedType(roomName);
};

const enum RoomTypes {
  Crossroads = 1,
  Highway = 2,
  Center = 3,
  SourceKeeper = 4,
  Standard = 5,
  Error = 6
}
