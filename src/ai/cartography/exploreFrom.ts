import {$} from "../spawns/index";
import {analyseRoom} from "./analyseRoom";
import {getRoomsInRange} from "./getRoomsInRange";

export function exploreFrom(from: Room) {
    if (from.controller && from.controller.level === 1) {
      return;
    }
    const targetRooms = getRoomsToExplore(from, 4);
    const taskId = `${from.name}_cartographer`;
    const pauseSpawn = pauseExploring(from, targetRooms);
    $.registerSpawnRequest(taskId, from, {
        canSpawn: () => from.energyAvailable >= 300,
        generateSpawnRequest: () => ({
            body: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]
        }),
        shouldSpawn: () => !pauseSpawn && $.getCreepCount(taskId) === 0
    });

    _.forEach($.getCreeps(taskId), (c: Creep) => scoutRoom(c, targetRooms[0], from));
}

function pauseExploring(room: Room, targets: string[]): boolean {
    if (room.memory.pauseExploring && room.memory.pauseExploring > Game.time) {
        return true;
    }
    if (targets.length === 0) {
        room.memory.pauseExploring = Game.time + 5000;
        room.memory.toExplore = undefined;
        return true;
    }
    return false;
}

function scoutRoom(creep: Creep, roomName: string, origin: Room) {
    if (!roomName) {
        creep.suicide();
    }
    creep.moveToRoom(roomName);

    if (Game.rooms[roomName]) {
        analyseRoom(Game.rooms[roomName]);

        _.pull(origin.memory.toExplore!, roomName);

        origin.memory.toExplore = _.sortBy(origin.memory.toExplore!,
            (n: string) => Game.map.getRoomLinearDistance(creep.pos.roomName, n));
    }
}

function getRoomsToExplore(room: Room, range: number): string[] {
    if (room.memory.pauseExploring) {
        return [];
    }
    if (!room.memory.toExplore) {
        room.memory.toExplore = [room.name, ...getRoomsInRange(room.name, range)];
    }
    return room.memory.toExplore;
}
