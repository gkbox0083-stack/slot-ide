/**
 * 統一匯出所有型別定義（V3 簡化版）
 */

// Board
export type { SymbolId, BoardRows, BoardConfig, Board } from './board.js';

// Outcome（V3 簡化版）
export type { Outcome, OutcomeConfig } from './outcome.js';

// Symbol（V3 簡化版）
export type {
  SymbolCategory,
  SymbolType,
  WildConfig,
  ScatterPayoutConfig,
  SymbolDefinition
} from './symbol.js';

// Lines
export type { LinePattern, LinesConfig } from './lines.js';

// Visual
export type { VisualConfig, AssetsPatch } from './visual.js';

// SpinPacket（V3 簡化版）
export type { GameMode, WinningLine, SettlementMeta, SpinPacket } from './spin-packet.js';
