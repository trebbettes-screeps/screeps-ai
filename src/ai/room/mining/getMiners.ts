import {$} from "../../spawns/index";

export function getMiners(from: Room, resource: Source | Mineral): Creep[] {
    const taskId = `miner_${from.name}_${resource.id}`;
    $.registerSpawnRequest(taskId, from, {
        canSpawn: () => from.energyCapacityAvailable > 1000 || from.energyCapacityAvailable === from.energyAvailable,
        generateSpawnRequest: () => generateSpawnRequest(taskId, from, resource),
        shouldSpawn: () => (resource instanceof Source || !resource.ticksToRegeneration) &&
            $.spawnTimerCheck(taskId)
    });
    return $.getCreeps(taskId);
}

function generateSpawnRequest(taskId: string, room: Room, resource: Source | Mineral): SpawnRequest {
    const mineralMiner = resource instanceof Mineral;
    const body = mineralMiner ? mineralMinerBody(room) : sourceMinerBody(room, resource as Source);
    return {
        body,
        onSuccess: () => $.setTimerCycle(taskId, getCycleModifier(room, resource, mineralMiner))
    };
}

function getCycleModifier(room: Room, resource: RoomObject, mineralMiner: boolean): number {
    return mineralMiner ? getWorkSpotsNear(room, resource.pos) : getSourceMinerCount(room, resource as Source);
}

function getSourceMinerCount(room: Room, source: Source) {
    if (room.energyCapacityAvailable > 800) {
        return 1;
    }
    const max = room.energyCapacityAvailable >= 550 ? 2 : 3;
    return Math.min(max, getWorkSpotsNear(source.room, source.pos));
}

function getWorkSpotsNear(room: Room, p: RoomPosition): number {
    const look = room.lookForAtArea(LOOK_TERRAIN, p.y - 1, p.x - 1, p.y + 1, p.x + 1, true) as LookAtResultWithPos[];
    const counts = _.countBy(look, "terrain");
    return 9 - (counts[`wall`] || 0);
}

function mineralMinerBody(room: Room): BodyPartConstant[] {
    const baseSegment = [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY];
    const maxCost = room.energyCapacityAvailable - _.sum(baseSegment, (p: BodyPartConstant) => BODYPART_COST[p]);
    const body = $.generateBody(room, [WORK], {maxCost});
    return [...body, ...baseSegment];
}

function sourceMinerBody(room: Room, resource: Source): BodyPartConstant[] {
    const segment = [WORK, WORK, MOVE];
    const additionalWorkParts = resource.energyCapacity <= 3000 ? 1 : 2;
    const workPartsRequired = Math.ceil(resource.energyCapacity / 300 / 2) + additionalWorkParts;
    const body = $.generateBody(room, segment, {
        maxCost: room.energyCapacityAvailable - 50,
        maxSize: Math.ceil(workPartsRequired / 2) * 3
    });
    return [...body, CARRY];
}
