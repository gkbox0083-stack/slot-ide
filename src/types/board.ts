/**
 * Symbol ID 型別
 * 例如 "H1", "H2", "L1", "L2", "WILD"
 */
export type SymbolId = string;

/**
 * Board 盤面定義
 * 固定 5x3 盤面（5 輪，每輪 3 個符號）
 */
export interface Board {
  reels: SymbolId[][];  // 5 輪，每輪 3 個符號
  cols: 5;
  rows: 3;
}

