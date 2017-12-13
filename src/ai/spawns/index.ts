import {generateBody} from "./generateBody";
import "./init";
import {getCreepCount, getCreeps, hasCreeps, processSpawnRequests, registerSpawnRequest} from "./spawnManagers";
import {setTimer, setTimerCycle, spawnTimerCheck} from "./spawnTimers";

export const $ = {
  generateBody,
  getCreepCount,
  getCreeps,
  hasCreeps,
  processSpawnRequests,
  registerSpawnRequest,
  setTimer,
  setTimerCycle,
  spawnTimerCheck
};
