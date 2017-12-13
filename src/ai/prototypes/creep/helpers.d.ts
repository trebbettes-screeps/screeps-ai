interface Creep {
    getOrigin(): Room;
    getState(): HaulState;
}

declare const enum HaulState {
  Filling,
  Emptying
}
