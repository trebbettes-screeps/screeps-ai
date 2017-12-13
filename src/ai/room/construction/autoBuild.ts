import {builder} from "../roles/builder";
import {fortifier} from "../roles/fortifier";
import {starters} from "../roles/starter";
import {workers} from "../roles/worker";
import {layRemoteStructures} from "./layRemoteStructures";
import {layRoads} from "./layRoads";
import {layRoomStructures} from "./layRoomStructures";
const cache: {[roomName: string]: any} = {};

export function autoBuild(room: Room): void {
    builder(room);
    fortifier(room);
    starters(room);
    workers(room);
    if (Game.cpu.bucket < 9000) {
      return;
    }
    const flagName = `${room.name}_autoBuild`;
    if (Game.flags[flagName]) {
        layRoomStructures(room);
        layRemoteStructures(room);
        layRoads(room);
    } else {
        placeConstructionFlag(room, flagName);
    }
}

function placeConstructionFlag(room: Room, flagName: string) {
  cache[room.name] = cache[room.name] || [];
  if (cache[room.name].length === 0) {
    _.times(50, (x: number) => {
      if (x > 42 || x < 4) {
        return;
      }
      _.times(50, (y: number) => {
        if (y > 42 || y < 4) {
          return;
        }
        const lookResult = room.lookForAtArea(LOOK_TERRAIN, y - 7, x - 7, y + 7, x + 7, true) as LookAtResultWithPos[];
        const count = _.countBy(lookResult, (l: LookAtResultWithPos) => l.terrain);
        if ((count[`wall`] || 0) === 0 && (count[`plain`] || 0) > 81) {
          cache[room.name].push({x, y});
        }
      });
    });
  } else {
    _.forEach(cache[room.name], (xy: XYPos) => room.visual.circle(xy.x, xy.y));
    const points = [...room.find(FIND_SOURCES), room.controller!];

    const bestPosition = _.min(cache[room.name], (xy: XYPos) =>
        _.sum(points, (ro: RoomObject) => ro.pos.getRangeTo(xy.x, xy.y)));

    room.visual.circle(bestPosition.x, bestPosition.y, {fill: "red"});
    room.createFlag(bestPosition.x, bestPosition.y, flagName, COLOR_WHITE);
  }
}
