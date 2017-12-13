interface Room {
    __structures__: {[type: string]: Structure[]};
    getStructures<T extends Structure = Structure>(types: string | string[]): T[];
    getType(): RoomTypes;
    isMine(): boolean;
    getLinks(): GetLinkResult;
}

interface RoomConstructor {
    getType(roomName: string): RoomTypes;
}

interface GetLinkResult {
    inboundLinks: ReadonlyArray<StructureLink>;
    outboundLinks: ReadonlyArray<StructureLink>;
    storeLinks: ReadonlyArray<StructureLink>;
}
