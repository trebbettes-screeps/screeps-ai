import {analyseRoom} from "../../cartography/analyseRoom";
import {findResources} from "../../cartography/findResources";

export function getManagementData(room: Room, config?: MiningConfig): MiningManagementDataResult | null {
    const data = getData(room, config);
    if (!data) {
        return {
          defend: [],
          lastChecked: 0,
          mine: room.find(FIND_SOURCES),
          opts: "",
          oversee: [] as string[],
          reserve: [],
          resources: []
        };
    }

    data.mine = _(data.resources)
        .map((id: string) => Game.getObjectById(id))
        .filter(_.identity).value() as Array<Source | Mineral>;

    return data;
}

function getData(room: Room, config?: MiningConfig): MiningManagementDataResult | null {
    let mem = room.memory.__miningData__ as MiningManagementDataResult | undefined;
    if (!mem && !config) {
        return null;
    }

    if (shouldAnalyseRoom(mem, config)) {
        analyseRoom(room);
        room.memory.__miningData__ = generateManagementData(room, config!);
        mem = room.memory.__miningData__ as MiningManagementDataResult;
    }
    return mem ? _.clone(mem) : null;
}

function shouldAnalyseRoom(data?: MiningManagementData, config?: MiningConfig): boolean {
    if (!config) {
        return false;
    }
    return !data || data.lastChecked < Game.time - 10000 || serialiseConfig(config) !== data.opts;
}

function serialiseConfig(c: MiningConfig): string {
    return `${c.maxMinerals}${c.maxSources}${c.takeSk}`;
}

function generateManagementData(room: Room, config: MiningConfig): MiningManagementData {
    const resources = findResources(room, config.takeSk);
    const sortedRooms = _(resources)
        .filter((i: ResourceInfo) => i.destRoomName === room.name)
        .groupBy("roomName")
        .sortBy((ri: ResourceInfo[]) => {
            if (ri[0].roomName === room.name) {
                return 0;
            }
            return ri.length > 1 ? (_.sum(ri, "distance") / ri.length) - 10 : ri[0].distance + 10;
        }).value() as ResourceInfo[][];
    const sources: ResourceInfo[] = [];
    const minerals: ResourceInfo[] = [];
    while ((sources.length < config.maxSources || minerals.length < config.maxMinerals) && sortedRooms.length) {
        const set = sortedRooms.shift()!;
        const required: number = config.maxSources - sources.length;
        if (required) {
            const nodes = _.filter(set, (i: ResourceInfo) => i.resourceType === RESOURCE_ENERGY).slice(0, required);
            _.forEach(nodes, (i: ResourceInfo) => sources.push(i));
        }
        if (minerals.length < config.maxMinerals) {
            const mineral = _.find(set, (i: ResourceInfo) => i.resourceType !== RESOURCE_ENERGY);
            if (mineral) {
                minerals.push(mineral);
            }
        }
    }
    const selectedResources = [...sources, ...minerals];
    const allRooms = _(selectedResources)
        .map<string>("roomName").uniq().value();
    const remoteRooms = _.filter(allRooms, (n: string) => n !== room.name);
    return {
        defend: remoteRooms,
        lastChecked: Game.time,
        opts: serialiseConfig(config),
        oversee: allRooms,
        reserve: remoteRooms,
        resources: _.map(selectedResources, "id")
    };
}
