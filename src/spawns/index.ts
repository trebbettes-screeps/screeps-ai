import {generateBody} from "./generateBody";
import "./init";
import {getCreepCount, getCreeps, hasCreeps, processSpawnRequests, registerSpawnRequest} from "./spawnRequests";
import {setTimer, setTimerCycle, spawnTimerCheck} from "./spawnTimers";

$ = {
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
