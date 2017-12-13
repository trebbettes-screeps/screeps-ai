interface Creep {
    getOrigin(): Room;
    getState(): HaulState;
}

declare const enum HaulState {
  Filling = 1,
  Emptying = 2
}

interface CreepMemory {
  state: number;
}
