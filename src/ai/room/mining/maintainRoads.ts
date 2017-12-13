import {$} from "../../spawns/index";
import {getManagementData} from "./getManagementData";

export function pavers(room: Room): void {
    const taskId = `${room.name}_paver`;
    const roomToPave = getRoomToPave(room);
    $.registerSpawnRequest(taskId, room, {
        canSpawn: () => room.energyCapacityAvailable === room.energyAvailable,
        generateSpawnRequest: () => ({
            body: $.generateBody(room, [WORK, CARRY, MOVE]),
            onSuccess: () => $.setTimerCycle(taskId)
        }),
        shouldSpawn: () => !!roomToPave && $.spawnTimerCheck(taskId)
    });
}

function paver(creep: Creep, roomName: string) {
    if (creep.pos.roomName !== roomName) {
        creep.moveToRoom(roomName);
        return;
    }
    if (!creep.memory.target) {
        const newTarget = _.find(creep.room.getStructures(STRUCTURE_ROAD), unrepairedRoad) ||
            _.find(creep.room.find(FIND_CONSTRUCTION_SITES), unbuiltRoad);
        creep.memory.target = newTarget ? newTarget.id : undefined;
    }
    const target = Game.getObjectById<Structure | ConstructionSite>(creep.memory.target);
    if (creep.carry.energy === 0) {
        scavangeEnergy(creep);
        return;
    }
}

function scavangeEnergy(creep: Creep): void {
    throw Error("Not Implemented");
}

const unrepairedRoad = (road: StructureRoad) => road.hits / road.hitsMax < 0.95;
const unbuiltRoad = (site: ConstructionSite) => site.structureType === STRUCTURE_ROAD;

function getRoomToPave(room: Room): string | null {
    if (room.memory.pausePaver && room.memory.pausePaver > Game.time) {
        return null;
    }

    if (!room.memory.paving) {
        const data = getManagementData(room);
        room.memory.paving = data ? data.oversee : undefined;
    }

    if (!room.memory.paving || room.memory.paving.length === 0) {
        room.memory.pausePaver = Game.time + 15000;
        room.memory.paving = undefined;
        return null;
    }

    const r = Game.rooms[room.memory.paving[0]];
    if (r && Game.time % 21 === 0) {
        const roadsNeedRepair = _.any(r.getStructures(STRUCTURE_ROAD), unrepairedRoad);
        const roadsNeedBuilding = !roadsNeedRepair && _.any(r.find(FIND_CONSTRUCTION_SITES), unbuiltRoad);
        if (!roadsNeedRepair && !roadsNeedBuilding) {
            room.memory.paving.shift();
        }
    }
    return room.memory.paving[0];
}
