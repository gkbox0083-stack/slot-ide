# P1-06 Pool Builder 擴展（NG/FG）

## 目標 (Objective)

擴展 Pool Builder 支援 NG/FG 分離的盤池系統，包括：
- 分別建立 NG Pool 和 FG Pool
- 使用對應的符號權重（ngWeight / fgWeight）
- Pool 狀態管理
- 盤面切換時清空 Pool

**重要**：Pool Builder 不得使用 appearanceWeight

---

## 範圍 (Scope)

需要修改的檔案：
- `src/engine/pool-builder.ts`
- `src/store/useGameConfigStore.ts`（或新增 usePoolStore.ts）

依賴：
- P1-01（型別定義擴展）
- P1-02（Symbol 系統擴展）
- P1-04（Free Spin 機制）
- P1-05（Board 5x4 支援）

---

## 實作細節 (Implementation Details)

### 1. Pool 型別定義

```typescript
// 可加入 src/types/pool.ts 或直接在 pool-builder.ts

import type { Board } from './board.js';
import type { FreeSpinMode } from './free-spin.js';

/**
 * Pool 鍵值格式：{phase}_{outcomeId}
 * 例如：ng_small, fg_medium
 */
export type PoolKey = `${FreeSpinMode}_${string}`;

/**
 * Pool 狀態
 */
export interface PoolStatus {
  key: PoolKey;
  outcomeId: string;
  phase: FreeSpinMode;
  count: number;
  cap: number;
  isComplete: boolean;
}

/**
 * Pool 建立結果
 */
export interface PoolBuildResult {
  pools: Map<PoolKey, Board[]>;
  status: PoolStatus[];
  success: boolean;
  errors: string[];
}
```

### 2. pool-builder.ts 完整擴展

```typescript
import type { Board, BoardConfig, SymbolId } from '../types/board.js';
import type { SymbolDefinition } from '../types/symbol.js';
import type { Outcome, OutcomeConfig } from '../types/outcome.js';
import type { LinesConfig } from '../types/lines.js';
import type { FreeSpinMode } from '../types/free-spin.js';
import { getSymbolWeight, isWildSymbol, isScatterSymbol } from './symbol-manager.js';

export type PoolKey = `${FreeSpinMode}_${string}`;

export interface PoolStatus {
  key: PoolKey;
  outcomeId: string;
  phase: FreeSpinMode;
  count: number;
  cap: number;
  isComplete: boolean;
}

export interface PoolBuildContext {
  boardConfig: BoardConfig;
  symbols: SymbolDefinition[];
  outcomeConfig: OutcomeConfig;
  linesConfig: LinesConfig;
  baseBet: number;
}

export interface PoolBuildOptions {
  cap?: number;
  maxAttempts?: number;
}

const DEFAULT_CAP = 100;
const DEFAULT_MAX_ATTEMPTS = 10000;

/**
 * 根據權重隨機抽取符號
 * 注意：只使用 ngWeight 或 fgWeight，不使用 appearanceWeight
 */
function drawSymbolByPhase(
  symbols: SymbolDefinition[],
  phase: FreeSpinMode,
): SymbolId {
  // 只抽取一般符號
  const normalSymbols = symbols.filter(s => !isWildSymbol(s) && !isScatterSymbol(s));
  
  // 使用對應階段的權重
  const totalWeight = normalSymbols.reduce((sum, s) => {
    const weight = phase === 'base' ? s.ngWeight : s.fgWeight;
    return sum + weight;
  }, 0);
  
  let random = Math.random() * totalWeight;
  for (const symbol of normalSymbols) {
    const weight = phase === 'base' ? symbol.ngWeight : symbol.fgWeight;
    random -= weight;
    if (random <= 0) {
      return symbol.id;
    }
  }
  
  return normalSymbols[normalSymbols.length - 1].id;
}

/**
 * 可能放置 Wild 或 Scatter 的位置
 */
function maybeAddSpecialSymbols(
  board: Board,
  symbols: SymbolDefinition[],
  phase: FreeSpinMode,
): Board {
  const wildSymbols = symbols.filter(isWildSymbol);
  const scatterSymbols = symbols.filter(isScatterSymbol);
  
  const newReels = board.reels.map(reel => [...reel]);
  
  // 根據權重決定是否放置 Wild
  for (const wild of wildSymbols) {
    const weight = phase === 'base' ? wild.ngWeight : wild.fgWeight;
    const probability = weight / 100; // 轉換為機率
    
    for (let col = 0; col < board.cols; col++) {
      for (let row = 0; row < board.rows; row++) {
        if (Math.random() < probability) {
          newReels[col][row] = wild.id;
        }
      }
    }
  }
  
  // 根據權重決定是否放置 Scatter
  for (const scatter of scatterSymbols) {
    const weight = phase === 'base' ? scatter.ngWeight : scatter.fgWeight;
    const probability = weight / 100;
    
    for (let col = 0; col < board.cols; col++) {
      for (let row = 0; row < board.rows; row++) {
        if (Math.random() < probability && newReels[col][row] !== 'WILD') {
          newReels[col][row] = scatter.id;
        }
      }
    }
  }
  
  return {
    ...board,
    reels: newReels,
  };
}

/**
 * 生成隨機盤面
 */
function generateRandomBoard(
  boardConfig: BoardConfig,
  symbols: SymbolDefinition[],
  phase: FreeSpinMode,
): Board {
  const reels: SymbolId[][] = [];
  
  for (let col = 0; col < boardConfig.cols; col++) {
    const reel: SymbolId[] = [];
    for (let row = 0; row < boardConfig.rows; row++) {
      reel.push(drawSymbolByPhase(symbols, phase));
    }
    reels.push(reel);
  }
  
  const board: Board = {
    reels,
    cols: boardConfig.cols,
    rows: boardConfig.rows,
  };
  
  // 可能添加特殊符號
  return maybeAddSpecialSymbols(board, symbols, phase);
}

/**
 * 計算盤面總獎金（簡化版）
 */
function calculateBoardPayout(
  board: Board,
  symbols: SymbolDefinition[],
  linesConfig: LinesConfig,
  baseBet: number,
): number {
  let totalPayout = 0;
  
  for (const line of linesConfig.patterns) {
    // 確保線路與盤面相容
    if (!line.positions.every(([col, row]) => col < board.cols && row < board.rows)) {
      continue;
    }
    
    const lineSymbols = line.positions.map(([col, row]) => board.reels[col][row]);
    
    // 找出目標符號（第一個非 Wild）
    let targetId: SymbolId | null = null;
    for (const id of lineSymbols) {
      const def = symbols.find(s => s.id === id);
      if (def && !isWildSymbol(def)) {
        targetId = id;
        break;
      }
    }
    
    if (!targetId) continue;
    
    // 計算連續數（含 Wild）
    let count = 0;
    for (const id of lineSymbols) {
      const def = symbols.find(s => s.id === id);
      if (!def) break;
      
      if (id === targetId || isWildSymbol(def)) {
        count++;
      } else {
        break;
      }
    }
    
    if (count >= 3) {
      const targetDef = symbols.find(s => s.id === targetId);
      if (targetDef) {
        const payoutKey = `match${count}` as keyof typeof targetDef.payouts;
        totalPayout += (targetDef.payouts[payoutKey] || 0) * baseBet;
      }
    }
  }
  
  return totalPayout;
}

/**
 * 為單個 Outcome 建立 Pool
 */
function buildPoolForOutcome(
  outcome: Outcome,
  context: PoolBuildContext,
  phase: FreeSpinMode,
  options: PoolBuildOptions = {},
): { boards: Board[]; attempts: number } {
  const { boardConfig, symbols, linesConfig, baseBet } = context;
  const cap = options.cap ?? DEFAULT_CAP;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  
  const boards: Board[] = [];
  let attempts = 0;
  
  while (boards.length < cap && attempts < maxAttempts) {
    attempts++;
    
    const board = generateRandomBoard(boardConfig, symbols, phase);
    const payout = calculateBoardPayout(board, symbols, linesConfig, baseBet);
    const multiplier = payout / baseBet;
    
    // 檢查是否在倍率區間內
    if (multiplier >= outcome.multiplierRange.min && 
        multiplier <= outcome.multiplierRange.max) {
      boards.push(board);
    }
  }
  
  return { boards, attempts };
}

/**
 * 建立所有 Pool（NG + FG）
 */
export function buildAllPools(
  context: PoolBuildContext,
  options: PoolBuildOptions = {},
): { pools: Map<PoolKey, Board[]>; status: PoolStatus[] } {
  const pools = new Map<PoolKey, Board[]>();
  const status: PoolStatus[] = [];
  const cap = options.cap ?? DEFAULT_CAP;
  
  // 建立 NG Pools
  for (const outcome of context.outcomeConfig.ngOutcomes) {
    const key: PoolKey = `base_${outcome.id}`;
    const result = buildPoolForOutcome(outcome, context, 'base', options);
    
    pools.set(key, result.boards);
    status.push({
      key,
      outcomeId: outcome.id,
      phase: 'base',
      count: result.boards.length,
      cap,
      isComplete: result.boards.length >= cap,
    });
  }
  
  // 建立 FG Pools
  for (const outcome of context.outcomeConfig.fgOutcomes) {
    const key: PoolKey = `free_${outcome.id}`;
    const result = buildPoolForOutcome(outcome, context, 'free', options);
    
    pools.set(key, result.boards);
    status.push({
      key,
      outcomeId: outcome.id,
      phase: 'free',
      count: result.boards.length,
      cap,
      isComplete: result.boards.length >= cap,
    });
  }
  
  return { pools, status };
}

/**
 * 從 Pool 抽取盤面
 */
export function drawFromPool(
  pools: Map<PoolKey, Board[]>,
  outcomeId: string,
  phase: FreeSpinMode,
): Board | null {
  const key: PoolKey = `${phase}_${outcomeId}`;
  const pool = pools.get(key);
  
  if (!pool || pool.length === 0) {
    return null;
  }
  
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * 清空所有 Pool
 */
export function clearAllPools(): Map<PoolKey, Board[]> {
  return new Map();
}
```

### 3. Store 整合

```typescript
// 在 useGameConfigStore.ts 新增

interface GameConfigState {
  // ... 現有欄位
  pools: Map<PoolKey, Board[]>;
  poolStatus: PoolStatus[];
  isPoolsBuilt: boolean;
}

interface GameConfigActions {
  // ... 現有欄位
  buildPools: () => void;
  clearPools: () => void;
}

// 實作
buildPools: () => {
  const state = get();
  const context: PoolBuildContext = {
    boardConfig: state.boardConfig,
    symbols: state.symbols,
    outcomeConfig: state.outcomeConfig,
    linesConfig: state.linesConfig,
    baseBet: state.baseBet,
  };
  
  const { pools, status } = buildAllPools(context);
  
  set({
    pools,
    poolStatus: status,
    isPoolsBuilt: true,
  });
},

clearPools: () => {
  set({
    pools: new Map(),
    poolStatus: [],
    isPoolsBuilt: false,
  });
},
```

---

## P0 Gate 檢查

確保以下條件：
- [ ] `drawSymbolByPhase` 只使用 `ngWeight` 和 `fgWeight`
- [ ] 不存在對 `appearanceWeight` 的使用
- [ ] NG Pool 和 FG Pool 分開儲存
- [ ] 不存在 NG/FG Pool 混用的情況

檢查指令：
```bash
# 確認不使用 appearanceWeight
grep -n "appearanceWeight" src/engine/pool-builder.ts
# 應該沒有結果或只有註解
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] NG Pool 和 FG Pool 分開建立
- [ ] NG Pool 使用 ngWeight
- [ ] FG Pool 使用 fgWeight
- [ ] Pool Builder 不使用 appearanceWeight（P0 Gate）
- [ ] PoolStatus 正確回報建立狀態
- [ ] drawFromPool 可正確抽取盤面
- [ ] 盤面切換時 clearPools 正確執行
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/engine/pool-builder.ts` 完整程式碼
2. Store 整合程式碼片段
3. P0 Gate 檢查結果
4. 測試案例執行結果

