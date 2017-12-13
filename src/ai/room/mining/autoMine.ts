import {$} from "../../spawns/index";
import {collectorRole} from "../roles/collector";
import {distributor} from "../roles/distributor";
import {minerRole} from "../roles/miner";
import {getHaulers} from "./getHaulers";
import {getManagementData} from "./getManagementData";
import {getMiners} from "./getMiners";

export function autoMine(room: Room): void {
  const managementData = getManagementData(room, {
    maxMinerals: 0,
    maxSources: _.get(room.controller, "level", 0) + 1
  });

  if (!managementData) {
      return;
  }

  _.forEach(managementData.mine, (s: Source) => mineSource(room, s));
  _.forEach(managementData.reserve, (roomName: string) => sendScout(room, roomName));

}

function mineSource(room: Room, source: Source) {
    const miners = getMiners(room, source);
    _.forEach(miners, (c: Creep) => minerRole(c, source));
    const haulers = getHaulers(room, source, miners[0] && !!miners[0].memory.structure);
    _.forEach(haulers, (c: Creep) => !room.storage ?
            distributor(c, room, source, $.getCreeps(`${room.name}_workers`)) :
            collectorRole(c, room, source));
}

function sendScout(room: Room, scoutRoom: string): void {
    const id = `${scoutRoom}_scout`;
    $.registerSpawnRequest(id, room, {
        canSpawn: () => room.energyCapacityAvailable === room.energyAvailable,
        generateSpawnRequest: () => ({
            body: [MOVE],
            onSuccess: () => $.setTimerCycle(id)
        }),
        shouldSpawn: () => !Game.rooms[scoutRoom] && $.spawnTimerCheck(id)
    });
    _.forEach($.getCreeps(id), (c: Creep) => c.moveToRoom(scoutRoom));
}
