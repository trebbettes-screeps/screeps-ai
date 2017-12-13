RoomPosition.prototype.isWalkable = function isWalkable(): boolean {
    if (!this.__isWalkable__) {
        if (this.x < 0 || this.x > 49 || this.y < 0 || this.y > 49) {
            return this.__isWalkable__ = false;
        }
        if (_.includes(OBSTACLE_OBJECT_TYPES as string[], this.lookFor(LOOK_TERRAIN)[0])) {
            return this.__isWalkable__ = false;
        }
        if (Game.rooms[this.roomName]) {
            if (_.find(this.lookFor(LOOK_STRUCTURES), (s: Structure) => s.isBlocking())) {
                return this.__isWalkable__ = false;
            }
            if (_.find(this.lookFor(LOOK_CONSTRUCTION_SITES), (c: ConstructionSite) => c.isBlocking())) {
                return this.__isWalkable__ = false;
            }
        }
        return this.__isWalkable__ = true;
    }
    return this.__isWalkable__;
};
