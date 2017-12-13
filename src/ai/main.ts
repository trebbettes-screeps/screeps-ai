import * as Movement from "./movement/index";
import "./prototypes/index";
import {manageRoom} from "./room/index";

Movement.setConfig({
  calculateCarryWeight: true,
  trackHostileRooms: true
});

export const screepsAiLoop = () => {
  _.forEach(Game.rooms, manageRoom);
  memoryMaintenance();
};

function memoryMaintenance(): void {
  for (var name in Memory.creeps) { // tslint:disable-line prefer-const no-var-keyword
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
}
