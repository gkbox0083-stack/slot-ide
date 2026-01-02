import type { Board } from './board.js';
import type { SymbolId } from './board.js';
import type { VisualConfig } from './visual.js';
import type { AssetsPatch } from './visual.js';

/**
 * SettlementMeta 結算資訊
 * 包含 Outcome ID、獲勝金額、倍率與最佳線條
 */
export interface SettlementMeta {
  outcomeId: string;
  win: number;
  multiplier: number;
  bestLine?: {
    lineIndex: number;
    positions: [number, number][];  // [col, row]
    symbol: SymbolId;
    count: number;
  };
}

/**
 * SpinPacket 主合約
 * 一次 Spin 的完整資料包，是 Math Engine 與 Runtime 的唯一介面
 */
export interface SpinPacket {
  version: "1";
  board: Board;              // 5x3 盤面
  visual: VisualConfig;      // 動畫參數
  assets?: AssetsPatch;     // 素材覆蓋
  meta?: SettlementMeta;    // 結算資訊
}

