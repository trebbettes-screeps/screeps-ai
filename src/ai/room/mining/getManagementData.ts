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
          oversee: [],
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

function getSortedResources(room: Room, resources: ResourceInfo[]): ResourceInfo[]  {
  return _(resources)
    .filter((i: ResourceInfo) => i.destRoomName === room.name)
    .groupBy("roomName")
    .sortBy((ri: ResourceInfo[]) => {
      if (ri[0].roomName === room.name) {
        return 0;
      }
      return ri.length > 1 ? (_.sum(ri, "distance") / ri.length) - 10 : ri[0].distance + 10;
    })
    .flatten().value() as ResourceInfo[];
}

function generateManagementData(room: Room, config: MiningConfig): MiningManagementData {
  const resources = findResources(room, config.takeSk);
  const sortedResources = getSortedResources(room, resources);
  const byType = _.groupBy(sortedResources, (ri) => ri.resourceType === RESOURCE_ENERGY ? RESOURCE_ENERGY : "other");

  const sources = _.take(byType[RESOURCE_ENERGY], config.maxSources);
  const minerals = _.take(byType[`other`], config.maxMinerals);
  const selectedResources = [...sources, ...minerals];

  const allRooms = _(selectedResources).map((ri) => ri.roomName).uniq().value();
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
