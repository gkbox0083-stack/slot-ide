import type { Board } from './board.js';
import type { SymbolId } from './board.js';
import type { VisualConfig, AssetsPatch } from './visual.js';
import type { FreeSpinMode, FreeSpinState } from './free-spin.js';

/**
 * WinningLine 中獎線資訊（V2 擴展）
 */
export interface WinningLine {
  lineIndex: number;
  positions: [number, number][];  // [col, row]
  symbol: SymbolId;
  count: number;
  payout: number;  // 這條線的分數
  hasWild: boolean;              // 新增：是否包含 Wild
  wildPositions?: [number, number][]; // 新增：Wild 位置
}

/**
 * SettlementMeta 結算資訊（V2 擴展）
 * 包含 Outcome ID、獲勝金額、倍率與所有中獎線
 */
export interface SettlementMeta {
  outcomeId: string;
  phase: FreeSpinMode;           // 新增：遊戲階段
  win: number;  // 所有中獎線的總分
  multiplier: number;  // 此階段 multiplier
  winningLines: WinningLine[];  // 所有中獎線
  bestLine?: WinningLine;  // 最高分那條線
  scatterCount: number;          // 新增：Scatter 數量
  triggeredFreeSpin: boolean;    // 新增：是否觸發 Free Spin
}

/**
 * SpinPacket v2 主合約
 * 一次 Spin 的完整資料包，是 Math Engine 與 Runtime 的唯一介面
 */
export interface SpinPacket {
  version: "2";                  // 版本升級
  board: Board;                  // 5x3 或 5x4 盤面
  visual: VisualConfig;          // 動畫參數
  assets?: AssetsPatch;          // 素材覆蓋
  meta?: SettlementMeta;         // 結算資訊
  freeSpinState?: FreeSpinState; // 新增：Free Spin 狀態
}
