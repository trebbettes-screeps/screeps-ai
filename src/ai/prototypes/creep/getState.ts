Creep.prototype.getState = function getState(): HaulState {
  const state = this.memory.state = this.memory.state || (this.carry.energy ? HaulState.Emptying : HaulState.Filling);
  const sum = _.sum(this.carry);
  if (state === HaulState.Emptying && sum === 0) {
    this.memory.state = HaulState.Filling;
  } else if (sum === this.carryCapacity) {
    this.memory.state = HaulState.Emptying;
  }
  return this.memory.state;
};
