export function getResourceInfo(resource: Source | Mineral): ResourceInfo | null {
    return Memory.__resources__[resource.id] || null;
}
