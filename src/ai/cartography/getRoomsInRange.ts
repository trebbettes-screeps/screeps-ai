export function getRoomsInRange(roomName: string, range: number, exits: Set<string> = new Set()): string[] {
    _(Game.map.describeExits(roomName))
        .values<string>().value()
        .forEach((n: string) => {
            exits.add(n);
            if (range > 1) { getRoomsInRange(n, range - 1, exits); }
        });
    return [...exits];
}
