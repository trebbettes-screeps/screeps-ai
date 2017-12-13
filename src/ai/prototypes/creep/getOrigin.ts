Creep.prototype.getOrigin = function() {
    if (!this.memory.origin) {
        const best = _(Game.rooms)
            .filter((r: Room) => r.controller && r.controller.my)
            .min((r: Room) => Game.map.getRoomLinearDistance(r.name, this.pos.roomName)) as Room | number;
        this.memory.origin = typeof(best) !== "number" ? best.name : _.find(Game.rooms)!.name;
    }
    return Game.rooms[this.memory.origin];
};
