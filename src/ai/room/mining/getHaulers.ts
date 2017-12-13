import {getResourceInfo} from "../../cartography/getResourceInfo";
import {$} from "../../spawns/index";

export function getHaulers(room: Room, resource: Source | Mineral, shouldSpawn: boolean = true): Creep[] {
    const taskId = `hauler_${room.name}_${resource.id}`;
    $.registerSpawnRequest(taskId, room, {
        canSpawn: () => room.energyCapacityAvailable === room.energyAvailable,
        generateSpawnRequest: () => generateSpawnRequest(taskId, room, resource),
        shouldSpawn: () => shouldSpawn && $.spawnTimerCheck(taskId)
    });
    return $.getCreeps(taskId);
}

function generateSpawnRequest(taskId: string, room: Room, resource: Source | Mineral): SpawnRequest {
    const analysis = haulerAnalysis(room, resource);
    if (!room.storage) {
        analysis.creeps++;
    }
    return {
        body: $.generateBody(room, [CARRY, CARRY, MOVE], {maxCost: analysis.maxCost}),
        onSuccess: () => $.setTimerCycle(taskId, analysis.creeps)
    };
}

function haulerAnalysis(room: Room, tgt: Source | Mineral): {maxCost: number, creeps: number} {
    const info = getResourceInfo(tgt);
    const pathLength = info && info.roomName === room.name ? Math.max(info.distance, 25) : getPathLength(tgt, room);
    const carryPartsRequired = getCarryPartsRequired(room, tgt, pathLength);
    const maxCarryParts = Math.floor(room.energyCapacityAvailable / BODYPART_COST[CARRY] * 0.666);
    const ratio = carryPartsRequired / maxCarryParts;
    const numberOfCreeps = ratio <= 1 ? 1 : Math.min(Math.ceil(ratio), 5);
    const energyModifier = ratio <= 1 ? ratio : ratio / Math.ceil(ratio);
    return {
        creeps: numberOfCreeps,
        maxCost: Math.ceil(room.energyCapacityAvailable * energyModifier)
    };
}

function getPathLength(collection: RoomObject, room: Room): number {
    if (room.storage) {
        return getRange(collection, room.storage);
    }

    const ranges = _.map([room.find(FIND_MY_SPAWNS)[0], room.controller],
        (d?: RoomObject) => getRange(collection, d));
    return _.max([...ranges, 10]);
}

function getRange(to: RoomObject, from?: RoomObject): number {
    if (!from) { return -Infinity; }
    return PathFinder.search(from.pos, {pos: to.pos, range: 1}, {swampCost: 2}).path.length;
}

function getCarryPartsRequired(room: Room, collection: RoomObject, range: number): number {
    if (collection instanceof Source) {
        return Math.ceil(getSourceLoad(collection, range) / 50 * 1.2);
    }
    if (collection instanceof Mineral) {
        return collection.ticksToRegeneration ? 0 :
            Math.ceil(getMineralLoad(collection, room, range) / 50 * 1.2);
    }
    return Math.ceil(10 * range * 2 / 50);
}

function getSourceLoad(source: Source, range: number) {
    return source.energyCapacity / 300 * range * 2;
}

function getMineralLoad(mineral: Mineral, room: Room, range: number): number {
    const minerSize = getMaxWorkPartsPerMiner(room);
    const maxMiners = getWorkSpotsNear(room, mineral.pos);
    return minerSize * maxMiners / 6 * range * 2;
}

function getWorkSpotsNear(room: Room, p: RoomPosition): number {
    const look = room.lookForAtArea(LOOK_TERRAIN, p.y - 1, p.x - 1, p.y + 1, p.x + 1, true) as LookAtResultWithPos[];
    const counts = _.countBy(look, "terrain");
    return 9 - (counts[`wall`] || 0);
}

function getMaxWorkPartsPerMiner(room: Room): number {
    return Math.min(room.energyCapacityAvailable / 100 * 0.9, 45);
}
