import {$} from "../../spawns/index";

export function prospector(room: Room) {
    const taskId = `${room.name}_prospector`;
    $.registerSpawnRequest(taskId, room, {
        canSpawn: () => room.energyAvailable >= 300,
        generateSpawnRequest: () => ({
            body: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]
        }),
        shouldSpawn: () => !room.memory.prospectingComplete && $.spawnTimerCheck(taskId)
    });
    _.forEach($.getCreeps(taskId), (c: Creep) => creepAction);
}

function creepAction(creep: Creep) {
    if (!creep.memory.target || !requiresAnalysis(creep.memory.target)) {
        const next = nextRoomToExplore(creep);
        if (!next) {
            creep.getOrigin().memory.prospectingComplete = true;
            creep.suicide();
            return;
        }
        creep.memory.target = next;
    }
    creep.moveToRoom(creep.memory.target);
    const targetRoom = Game.rooms[creep.memory.target];
    if (targetRoom) {
        const sourceData = _.map(targetRoom.find(FIND_SOURCES), (s: Source) => ({x: s.pos.x, y: s.pos.y}));
        const roomType = targetRoom.getType();
        const canMine = targetRoom.isMine() || roomType === RoomTypes.SourceKeeper || roomType === RoomTypes.Center;
        const mineral = canMine ? targetRoom.find(FIND_MINERALS)[0]! : undefined;
        Memory.mining[targetRoom.name] = {
          mineral: mineral ? {x: mineral.pos.x, y: mineral.pos.y} : undefined,
          mineralType: mineral ? mineral.mineralType : undefined,
          roomName: targetRoom.name,
          sources: sourceData,
          type: roomType
        };
    }
}

function nextRoomToExplore(creep: Creep): string | null {
    const origin = creep.getOrigin();
    const rooms = creep.memory.targets = creep.memory.targets || getRoomsInRange(origin.name, 4);
    const toExplore = _.filter(rooms, requiresAnalysis);
    return !toExplore.length ? null :
        _.min(toExplore, (rn: string) => Game.map.getRoomLinearDistance(origin.name, rn));
}

function requiresAnalysis(roomName: string): boolean {
    return !Memory.mining[roomName];
}

function getRoomsInRange(roomName: string, range: number, exits: Set<string> = new Set()): string[] {
    _(Game.map.describeExits(roomName))
        .values<string>().value()
        .forEach((n: string) => {
            exits.add(n);
            if (range > 1) { getRoomsInRange(n, range - 1, exits); }
        });

    return [...exits];
}
