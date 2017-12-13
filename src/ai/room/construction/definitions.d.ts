interface LayoutMap {
  [structureName: string]: RoomPosition[];
}

interface PosInfo {
  pos: RoomPosition;
  range: number;
  valid: boolean;
}

interface XYPos {
  x: number;
  y: number;
}
