Creep.prototype.getState = function getState(): HaulState {
  const state = this.memory.state = this.memory.state || (this.carry.energy ? HaulState.Emptying : HaulState.Filling);
  const sum = _.sum(this.carry);
  console.log(state, sum, this.carryCapacity);
  if (state === HaulState.Emptying) {
    if (sum === 0) {
      this.memory.state = HaulState.Filling; }
  } else if (sum === this.carryCapacity) {
    this.memory.state = HaulState.Emptying;
  }
  console.log(this.memory.state);
  return this.memory.state;
};
