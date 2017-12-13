interface MiningConfig {
    takeSk?: boolean;
    maxSources: number;
    maxMinerals: number;
}

interface MiningManagementDataResult extends MiningManagementData {
    mine: Array<Source | Mineral>;
}

interface MiningManagementData {
    oversee: string[];
    reserve: string[];
    defend: string[];
    resources: string[];
    lastChecked: number;
    opts: string;
}
