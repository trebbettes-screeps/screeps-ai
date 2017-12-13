import {safeModeLogic} from "./safeMode";
import {towerAI} from "./towers";

export function roomDefense(room: Room): void {
  safeModeLogic(room);
  towerAI(room);
}
