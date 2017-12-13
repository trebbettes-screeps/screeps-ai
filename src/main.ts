import {aiLoop} from "./ai/main";
import {ErrorMapper} from "./errors";

import * as Movement from "./movement/index";
import "./prototypes/index";

Movement.setConfig({
  calculateCarryWeight: true,
  trackHostileRooms: true
});

export const loop = ErrorMapper.wrapLoop(aiLoop);
