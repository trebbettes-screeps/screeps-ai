export const aiLoop = () => {
  $.processSpawnRequests();
  memoryMaintenance();
};

function memoryMaintenance(): void {
  Memory.creeps = _.pick(Memory.creeps, (_m, name: string) => Game.creeps[name]);
}
