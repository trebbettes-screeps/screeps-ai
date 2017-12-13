declare var $: Spawny;

interface Spawny {
  generateBody(room: Room, segment: string[], options?: BodyConfig): string[];
  getCreeps(id: string, includeSpawning?: boolean): Creep[];
  getCreepCount(id: string): number;
  hasCreeps(id: string): boolean;
  registerSpawnRequest(id: string, room: Room, spawnRequest: SpawnRequester): void;
  setTimerCycle(id: string, cycleModifier?: number): void;
  setTimer(id: string, ticks: number): void;
  spawnTimerCheck(id: string): boolean;
  processSpawnRequests(): void;
}

interface CreepMemory {
  origin: string;
  taskId: string;
}

interface SpawnRequester {
    canSpawn: (id: string, room: Room) => boolean;
    generateSpawnRequest: (id: string, room: Room) => SpawnRequest;
    shouldSpawn: (id: string, room: Room) => boolean;
}

interface SpawnRequestMemory {
    lastSpawn: number;
    creeps?: string[];
    timer?: number;
}

interface Memory {
    __spawn: {[spawnId: string]: SpawnRequestMemory | undefined};
}

interface SpawnRequest {
    body: BodyPartConstant[];
    memory?: any;
    name?: string;
    onSuccess?: (id: string, name: string) => void;
}

/**
 * Options for the body generator.
 */
interface BodyConfig {
    maxCost?: number;
    maxSize?: number;
    moveShield?: boolean;
    additionalSegment?: BodyPartConstant[];
    sortOrder?: {
        [part: string]: number;
    };
}
