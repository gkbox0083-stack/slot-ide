/**
 * 統一匯出所有型別定義
 */

// Board
export type { SymbolId, BoardRows, BoardConfig, Board } from './board.js';

// Outcome
export type { GamePhase, Outcome, OutcomeConfig } from './outcome.js';

// Symbol
export type { 
  SymbolCategory, 
  SymbolType, 
  WildConfig, 
  ScatterConfig, 
  SymbolDefinition 
} from './symbol.js';

// Lines
export type { LinePattern, LinesConfig } from './lines.js';

// Visual
export type { VisualConfig, AssetsPatch } from './visual.js';

// Free Spin
export type { 
  FreeSpinMode, 
  FreeSpinConfig, 
  FreeSpinState, 
  FreeSpinResult 
} from './free-spin.js';

// SpinPacket
export type { WinningLine, SettlementMeta, SpinPacket } from './spin-packet.js';
