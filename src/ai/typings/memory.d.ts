interface Memory {
    rooms: {[roomName: string]: RoomMemory};
    creeps: {[creepName: string]: CreepMemory};
    mining: {[roomName: string]: MiningData};
}

interface MiningData {
    roomName: string;
    sources: XyPos[];
    mineral?: XyPos;
    mineralType?: string;
    type: RoomTypes;
    reserve?: boolean;
}

interface Creep {
    memory: CreepMemory;
}

interface Room {
    memory: RoomMemory;
}

interface RoomMemory {
  __miningData__?: MiningManagementData;
  pauseExploring?: number;
  pausePaver?: number;
  toExplore?: string[];
  paving?: string[];
  leadBuilder?: string;
  fortifierRequired?: boolean;
  spawnStarterCreeps?: boolean;
  roads: string[];
  constructionTarget?: string;
  pauseConstructionCheck?: number;
}

interface FlagMemory {
  startPos?: RoomPosition;
  layout?: {[structureType: string]: string};
  skipCheckUntil?: number;
}

interface CreepMemory {
  simplified?: boolean;
  inPosition?: boolean | string;
  reagents?: ResourceConstant[];
  reagentLabs?: string[];
  sleepUntil?: number;
  state?: HaulState;
  origin: string;
  target?: string;
  targets?: string[];
  container?: string;
  structure?: string;
  pathLength?: number;
  group?: number;
  source?: string;
  workPosition?: RoomPosition;
  lastTarget?: RoomPosition;
}

declare const enum CreepGroup {
  Distrbutor
}

interface XyPos {
  x: number;
  y: number;
}
