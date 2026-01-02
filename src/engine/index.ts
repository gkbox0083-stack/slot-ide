/**
 * Engine 模組統一匯出
 */

export { OutcomeManager } from './outcome-manager.js';
export { SymbolManager } from './symbol-manager.js';
export { LinesManager } from './lines-manager.js';
export { PoolBuilder } from './pool-builder.js';
export type { Pool, PoolStatus, BuildResult } from './pool-builder.js';
export { Settlement } from './settlement.js';
export { SpinExecutor } from './spin-executor.js';

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

