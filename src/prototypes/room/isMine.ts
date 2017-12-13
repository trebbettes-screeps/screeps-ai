Room.prototype.isMine = function isMine(): boolean {
    return this.controller && this.controller.my;
};
