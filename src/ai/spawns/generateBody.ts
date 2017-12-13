export function generateBody(room: Room, segment: BodyPartConstant[], opts: GenerateOptions = {}): BodyPartConstant[] {
    const numberOfSegments = segmentsRequired(room, segment, opts);
    const segments = new Array(numberOfSegments).fill(segment);
    if (opts.additionalSegment) {
        segments.push(opts.additionalSegment);
    }
    const sortOrder: {[part: string]: number} =
        opts.sortOrder || {[TOUGH]: 1, other: 3, [HEAL]: 4, [MOVE]: opts.moveShield ? 2 : 5};

    return _.sortBy(_.flatten(segments), (part: string) => sortOrder[part] || sortOrder.other || 99);
}

function segmentsRequired(room: Room, segment: BodyPartConstant[], opts: GenerateOptions): number {

    return Math.min(maxSegmentsByCost(room, segment, opts), maxSegmentsBySize(segment, opts));
}

function maxSegmentsByCost(room: Room, segment: BodyPartConstant[], opts: GenerateOptions) {
    let maxCost = opts.maxCost && opts.maxCost <= room.energyCapacityAvailable ?
        opts.maxCost : room.energyCapacityAvailable;

    maxCost = opts.additionalSegment ? maxCost - _.sum(opts.additionalSegment, getPartCost) : maxCost;

    return Math.floor(maxCost / _.sum(segment, getPartCost));
}

function maxSegmentsBySize(segment: string[], opts: GenerateOptions): number {
    let maxSize = opts.maxSize && opts.maxSize <= MAX_CREEP_SIZE ? opts.maxSize : MAX_CREEP_SIZE;
    maxSize = opts.additionalSegment ? maxSize - opts.additionalSegment.length : maxSize;

    return Math.floor((maxSize && maxSize <= 50 ? maxSize : MAX_CREEP_SIZE) / segment.length);
}

function getPartCost(type: BodyPartConstant): number {

    return BODYPART_COST[type];
}
