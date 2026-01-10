/**
 * Engine 模組統一匯出
 */

export { OutcomeManager } from './outcome-manager.js';
export { SymbolManager } from './symbol-manager.js';
export { LinesManager } from './lines-manager.js';
export { PoolBuilder } from './pool-builder.js';
export type { Pool, PoolStatus, BuildResult } from './pool-builder.js';
export { Settlement, countScatters } from './settlement.js';
export { SpinExecutor } from './spin-executor.js';

// 匯出 Symbol 系統輔助函式（V2）
export {
  isWildSymbol,
  isScatterSymbol,
  isNormalSymbol,
  getWildSymbols,
  getScatterSymbols,
  getNormalSymbols,
  canWildReplace,
  getSymbolWeight,
  createDefaultWildSymbol,
  createDefaultScatterSymbol,
} from './symbol-manager.js';

// 匯出 RTP Calculator（V2）
export {
  calculateTheoreticalNGRTP,
  calculateTheoreticalFGRTP,
  calculateFSTriggerProbability,
  calculateExpectedFreeSpins,
  calculateTheoreticalRTPBreakdown,
  calculateActualRTPFromStats,
  calculateAdditionalStats,
  formatRTPBreakdown,
} from './rtp-calculator.js';
export type { RTPBreakdown, SimulationStats } from './rtp-calculator.js';

// 匯出 singleton 實例
import { OutcomeManager } from './outcome-manager.js';
import { SymbolManager } from './symbol-manager.js';
import { LinesManager } from './lines-manager.js';
import { PoolBuilder } from './pool-builder.js';
import { Settlement } from './settlement.js';
import { SpinExecutor } from './spin-executor.js';

export const outcomeManager = new OutcomeManager();
export const symbolManager = new SymbolManager();
export const linesManager = new LinesManager();
export const poolBuilder = new PoolBuilder(outcomeManager, symbolManager, linesManager);
export const settlement = new Settlement(symbolManager, linesManager);
export const spinExecutor = new SpinExecutor(outcomeManager, poolBuilder, settlement);

