import {autoBuild} from "./construction/autoBuild";
import {roomDefense} from "./defense/index";
import {autoMine} from "./mining/autoMine";
import {chemistCreep} from "./roles/chemist";
import {fillerCreep} from "./roles/filler";
import {linkerCreep} from "./roles/linker";
import {upgraderCreep} from "./roles/upgrader";
import {exploreFrom} from "../cartography/exploreFrom";

export function manageRoom(room: Room): void {
    if (!room.controller || !room.controller.my) {
        return;
    }

    exploreFrom(room);

    // Creeps
    chemistCreep(room);
    fillerCreep(room);
    linkerCreep(room);
    upgraderCreep(room);

    // Other
    roomDefense(room);
    autoBuild(room);
    autoMine(room);
}
