Room.prototype.getStructures = function getStructures(types: string | string[]): Structure[] {
  this.__structures__ = this.__structures__ || _.groupBy(this.find(FIND_STRUCTURES), "structureType");
  if (typeof(types) === "string") {
      return this.__structures__[types] || [];
  }
  let result: Structure[] = [];
  for (const type of types) {
      if (this.__structures__[type]) {
          result = [...result, ... this.__structures__[type]];
      }
  }
  return result;
};
