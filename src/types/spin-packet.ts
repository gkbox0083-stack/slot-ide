import type { Board } from './board.js';
import type { SymbolId } from './board.js';
import type { VisualConfig, AssetsPatch } from './visual.js';

/**
 * 遊戲模式（V3 簡化版）
 * 保留類型以維持向下相容，但實際上只使用 'base'
 */
export type GameMode = 'base';

/**
 * WinningLine 中獎線資訊
 */
export interface WinningLine {
  lineIndex: number;
  positions: [number, number][];  // [col, row]
  symbol: SymbolId;
  count: number;
  payout: number;  // 這條線的分數
  hasWild: boolean;
  wildPositions?: [number, number][];
}

/**
 * SettlementMeta 結算資訊（V3 簡化版）
 * 包含 Outcome ID、獲勝金額、倍率與所有中獎線
 */
export interface SettlementMeta {
  outcomeId: string;
  phase: GameMode;               // V3: 固定為 'base'
  win: number;                   // 所有中獎線 + Scatter 的總分
  multiplier: number;            // V3: 固定為 1
  winningLines: WinningLine[];   // 所有中獎線
  bestLine?: WinningLine;        // 最高分那條線
  scatterCount: number;          // Scatter 數量
  scatterPayout?: number;        // V3 新增：Scatter 直接得分
  triggeredFreeSpin: boolean;    // V3: 永遠為 false
}

/**
 * SpinPacket v3 主合約（簡化版）
 * 一次 Spin 的完整資料包，是 Math Engine 與 Runtime 的唯一介面
 */
export interface SpinPacket {
  version: '2' | '3';            // 支援 v2/v3
  board: Board;                  // 5x3 或 5x4 盤面
  visual: VisualConfig;          // 動畫參數
  assets?: AssetsPatch;          // 素材覆蓋
  meta?: SettlementMeta;         // 結算資訊
  isDemo?: boolean;              // 展示模式：true 時不觸發 spin 動畫
}

