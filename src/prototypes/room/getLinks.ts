Room.prototype.getLinks = function getLinks(): GetLinkResult {
    if (!this._links) {
        const links = this.getStructures(STRUCTURE_LINK);
        const storeLinks = this.storage ? this.storage.pos.findInRange(links, 2) : [];
        const upgradeContainer = this.getUpgradeContainer();
        const inboundLinks = upgradeContainer instanceof StructureLink ? [upgradeContainer] : [];
        const outboundLinks = _.filter(links, (l: StructureLink) => !_.contains([...inboundLinks, ...storeLinks], l));
        this._links = {
            inboundLinks,
            outboundLinks,
            storeLinks
        } as GetLinkResult;
    }
    return this._links;
};
