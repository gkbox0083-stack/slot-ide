/**
 * Symbol ID 型別
 * 例如 "H1", "H2", "L1", "L2", "WILD", "SCATTER"
 */
export type SymbolId = string;

/**
 * 盤面行數（支援 3 或 4）
 */
export type BoardRows = 3 | 4;

/**
 * 盤面配置
 */
export interface BoardConfig {
  cols: 5;
  rows: BoardRows;
}

/**
 * Board 盤面定義（V2 支援動態尺寸）
 * 支援 5x3 或 5x4 盤面
 */
export interface Board {
  reels: SymbolId[][];  // 5 輪，每輪 3 或 4 個符號
  cols: 5;
  rows: BoardRows;
}
