export const PRODUCTION_AMOUNT = 10000;

export const PRODUCT_LIST =
  ["XUH2O", "XLHO2", "XLH2O", "XKHO2", "XGHO2", "XZHO2", "XZH2O", "G", "XGH2O"] as ResourceConstant[];

export const MINERALS_RAW = ["H", "O", "Z", "U", "K", "L", "X"] as ReadonlyArray<string>;

// tslint:disable:object-literal-sort-keys
export const REAGENT_LIST: { [compound: string]: ResourceConstant[] } = {
  KO: ["K", "O"],
  UH: ["U", "H"],
  UO: ["U", "O"],
  OH: ["O", "H"],
  LO: ["L", "O"],
  LH: ["L", "H"],
  ZO: ["Z", "O"],
  ZH: ["Z", "H"],
  ZK: ["Z", "K"],
  UL: ["U", "L"],
  G: ["ZK", "UL"],
  GH: ["G", "H"],
  GO: ["G", "O"],
  UH2O: ["UH", "OH"],
  UHO2: ["UO", "OH"],
  GH2O: ["GH", "OH"],
  GHO2: ["GO", "OH"],
  LHO2: ["LO", "OH"],
  LH2O: ["LH", "OH"],
  ZHO2: ["ZO", "OH"],
  ZH2O: ["ZH", "OH"],
  KHO2: ["KO", "OH"],
  XUH2O: ["X", "UH2O"],
  XUHO2: ["X", "UHO2"],
  XGH2O: ["X", "GH2O"],
  XGHO2: ["X", "GHO2"],
  XLHO2: ["X", "LHO2"],
  XLH2O: ["X", "LH2O"],
  XZHO2: ["ZHO2", "X"],
  XZH2O: ["ZH2O", "X"],
  XKHO2: ["KHO2", "X"]
};
