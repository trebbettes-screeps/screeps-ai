import * as Movement from "./movement/index";
Movement.setConfig({
  calculateCarryWeight: true,
  trackHostileRooms: true
});

export const screepsAiLoop = () => {
  console.log(`Tick: ${Game.time}`);

  memoryMaintenance();
};

function memoryMaintenance(): void {
  for (var name in Memory.creeps) { // tslint:disable-line prefer-const no-var-keyword
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
}
