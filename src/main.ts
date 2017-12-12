import {ErrorMapper} from "errors";
import {screepsAiLoop} from "./ai/main";
export const loop = ErrorMapper.wrapLoop(screepsAiLoop);
