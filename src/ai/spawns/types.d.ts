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
interface GenerateBodyOptions {
    maxCost?: number;
    maxSize?: number;
    moveShield?: boolean;
    additionalSegment?: BodyPartConstant[];
    sortOrder?: {
        [part: string]: number;
    };
}
