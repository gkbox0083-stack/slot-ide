# P1-04 Free Spin 機制實作

> **⚠️ 已過時 (DEPRECATED)**
>
> 此任務文件已於 V3 簡化版中標記為過時。
> V3 版本移除了 Free Spin 機制，改為 Scatter 直接賦值模式。
> 保留此文件僅供歷史參考。

---

## 目標 (Objective)

實作完整的 Free Spin 機制，包括：
- Free Spin 狀態管理
- Scatter 觸發邏輯
- Retrigger 功能
- Multiplier 計算
- Free Spin 流程控制

**重要**：
- Scatter 觸發邏輯只能在 `src/engine/spin-executor.ts`
- Free Spin 狀態只能在 `src/store/useFreeSpinStore.ts`

---

## 範圍 (Scope)

需要修改的檔案：
- `src/engine/spin-executor.ts`

需要新增的檔案：
- `src/store/useFreeSpinStore.ts`

依賴：
- P1-01（型別定義擴展）
- P1-02（Symbol 系統擴展）
- P1-03（Settlement Wild 結算）

---

## 實作細節 (Implementation Details)

### 1. useFreeSpinStore.ts 新增

```typescript
import { create } from 'zustand';
import type { FreeSpinMode, FreeSpinState, FreeSpinResult, FreeSpinConfig } from '../types/free-spin.js';
import type { Board } from '../types/board.js';

interface FreeSpinStoreState extends FreeSpinState {
  // 配置
  config: FreeSpinConfig;
  
  // 歷史紀錄
  history: FreeSpinResult[];
}

interface FreeSpinStoreActions {
  // 配置管理
  setConfig: (config: FreeSpinConfig) => void;
  
  // 狀態管理
  triggerFreeSpin: (scatterCount: number, config: FreeSpinConfig) => void;
  consumeSpin: () => void;
  addWin: (win: number) => void;
  retrigger: (additionalSpins: number) => void;
  endFreeSpin: () => number; // 返回累積獎金
  reset: () => void;
  
  // 歷史紀錄
  addHistory: (result: FreeSpinResult) => void;
  clearHistory: () => void;
}

const defaultConfig: FreeSpinConfig = {
  enabled: true,
  triggerCount: 3,
  baseSpinCount: 10,
  enableRetrigger: true,
  retriggerSpinCount: 5,
  enableMultiplier: true,
  multiplierValue: 2,
};

const initialState: FreeSpinStoreState = {
  mode: 'base',
  remainingSpins: 0,
  totalSpins: 0,
  accumulatedWin: 0,
  currentMultiplier: 1,
  triggerCount: 0,
  config: defaultConfig,
  history: [],
};

export const useFreeSpinStore = create<FreeSpinStoreState & FreeSpinStoreActions>()(
  (set, get) => ({
    ...initialState,
    
    setConfig: (config) => set({ config }),
    
    triggerFreeSpin: (scatterCount, config) => {
      const spins = config.baseSpinCount;
      const multiplier = config.enableMultiplier ? config.multiplierValue : 1;
      
      set({
        mode: 'free',
        remainingSpins: spins,
        totalSpins: spins,
        accumulatedWin: 0,
        currentMultiplier: multiplier,
        triggerCount: scatterCount,
        config,
        history: [],
      });
    },
    
    consumeSpin: () => {
      set((state) => ({
        remainingSpins: Math.max(0, state.remainingSpins - 1),
      }));
    },
    
    addWin: (win) => {
      set((state) => ({
        accumulatedWin: state.accumulatedWin + win,
      }));
    },
    
    retrigger: (additionalSpins) => {
      set((state) => ({
        remainingSpins: state.remainingSpins + additionalSpins,
        totalSpins: state.totalSpins + additionalSpins,
      }));
    },
    
    endFreeSpin: () => {
      const { accumulatedWin } = get();
      set({
        mode: 'base',
        remainingSpins: 0,
        totalSpins: 0,
        currentMultiplier: 1,
        triggerCount: 0,
      });
      return accumulatedWin;
    },
    
    reset: () => set(initialState),
    
    addHistory: (result) => {
      set((state) => ({
        history: [...state.history, result],
      }));
    },
    
    clearHistory: () => set({ history: [] }),
  })
);

// Selectors
export const selectFreeSpinMode = (state: FreeSpinStoreState) => state.mode;
export const selectIsInFreeSpin = (state: FreeSpinStoreState) => state.mode === 'free';
export const selectRemainingSpins = (state: FreeSpinStoreState) => state.remainingSpins;
export const selectAccumulatedWin = (state: FreeSpinStoreState) => state.accumulatedWin;
export const selectCurrentMultiplier = (state: FreeSpinStoreState) => state.currentMultiplier;
```

### 2. spin-executor.ts 擴展

```typescript
import type { Board } from '../types/board.js';
import type { SymbolDefinition } from '../types/symbol.js';
import type { Outcome, OutcomeConfig } from '../types/outcome.js';
import type { LinesConfig } from '../types/lines.js';
import type { VisualConfig } from '../types/visual.js';
import type { SpinPacket, SettlementMeta } from '../types/spin-packet.js';
import type { FreeSpinMode, FreeSpinConfig, FreeSpinState } from '../types/free-spin.js';
import { settle, countScatters } from './settlement.js';
import { getScatterSymbols } from './symbol-manager.js';

interface SpinContext {
  symbols: SymbolDefinition[];
  outcomeConfig: OutcomeConfig;
  linesConfig: LinesConfig;
  visualConfig: VisualConfig;
  baseBet: number;
  freeSpinConfig: FreeSpinConfig;
}

interface SpinResult {
  packet: SpinPacket;
  triggeredFreeSpin: boolean;
  isRetrigger: boolean;
}

/**
 * 根據遊戲階段取得對應的 Outcomes
 */
function getOutcomesByPhase(
  outcomeConfig: OutcomeConfig, 
  phase: FreeSpinMode
): Outcome[] {
  return phase === 'base' ? outcomeConfig.ngOutcomes : outcomeConfig.fgOutcomes;
}

/**
 * 根據權重抽取 Outcome
 */
function drawOutcome(outcomes: Outcome[]): Outcome {
  const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const outcome of outcomes) {
    random -= outcome.weight;
    if (random <= 0) {
      return outcome;
    }
  }
  
  return outcomes[outcomes.length - 1];
}

/**
 * 從 Pool 抽取盤面
 * 注意：這裡需要與 pool-builder 整合
 */
function drawBoardFromPool(
  outcomeId: string,
  phase: FreeSpinMode,
  pools: Map<string, Board[]>
): Board | null {
  const poolKey = `${phase}_${outcomeId}`;
  const pool = pools.get(poolKey);
  
  if (!pool || pool.length === 0) {
    return null;
  }
  
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * 檢查是否觸發 Free Spin
 */
function checkFreeSpinTrigger(
  board: Board,
  symbols: SymbolDefinition[],
  config: FreeSpinConfig,
  currentPhase: FreeSpinMode
): { triggered: boolean; scatterCount: number } {
  if (!config.enabled) {
    return { triggered: false, scatterCount: 0 };
  }
  
  const scatterCount = countScatters(board, symbols);
  
  // Base Game 觸發 Free Spin
  if (currentPhase === 'base' && scatterCount >= config.triggerCount) {
    return { triggered: true, scatterCount };
  }
  
  // Free Game 中檢查 Retrigger
  if (currentPhase === 'free' && config.enableRetrigger && scatterCount >= config.triggerCount) {
    return { triggered: true, scatterCount };
  }
  
  return { triggered: false, scatterCount };
}

/**
 * 執行單次 Spin（V2 支援 Free Spin）
 */
export function executeSpin(
  context: SpinContext,
  pools: Map<string, Board[]>,
  freeSpinState: FreeSpinState
): SpinResult {
  const { 
    symbols, 
    outcomeConfig, 
    linesConfig, 
    visualConfig, 
    baseBet, 
    freeSpinConfig 
  } = context;
  
  const phase: FreeSpinMode = freeSpinState.mode;
  const multiplier = freeSpinState.currentMultiplier;
  
  // 1. 取得對應階段的 Outcomes
  const outcomes = getOutcomesByPhase(outcomeConfig, phase);
  
  // 2. 抽取 Outcome
  const outcome = drawOutcome(outcomes);
  
  // 3. 從 Pool 抽取盤面
  const board = drawBoardFromPool(outcome.id, phase, pools);
  
  if (!board) {
    throw new Error(`Pool not found for ${phase}_${outcome.id}`);
  }
  
  // 4. 結算（含 Wild 替代）
  const settlement = settle(board, symbols, linesConfig, baseBet, phase, multiplier);
  settlement.outcomeId = outcome.id;
  
  // 5. 檢查 Free Spin 觸發
  const { triggered, scatterCount } = checkFreeSpinTrigger(
    board, 
    symbols, 
    freeSpinConfig, 
    phase
  );
  
  const isRetrigger = phase === 'free' && triggered;
  
  // 6. 組裝 SpinPacket
  const packet: SpinPacket = {
    version: "2",
    board,
    visual: visualConfig,
    meta: {
      ...settlement,
      scatterCount,
      triggeredFreeSpin: triggered && phase === 'base',
    },
    freeSpinState: phase === 'free' ? freeSpinState : undefined,
  };
  
  return {
    packet,
    triggeredFreeSpin: triggered && phase === 'base',
    isRetrigger,
  };
}

/**
 * 取得 Free Spin 觸發後的初始狀態
 */
export function initializeFreeSpinState(
  scatterCount: number,
  config: FreeSpinConfig
): FreeSpinState {
  return {
    mode: 'free',
    remainingSpins: config.baseSpinCount,
    totalSpins: config.baseSpinCount,
    accumulatedWin: 0,
    currentMultiplier: config.enableMultiplier ? config.multiplierValue : 1,
    triggerCount: scatterCount,
  };
}

/**
 * 取得 Base Game 狀態
 */
export function getBaseGameState(): FreeSpinState {
  return {
    mode: 'base',
    remainingSpins: 0,
    totalSpins: 0,
    accumulatedWin: 0,
    currentMultiplier: 1,
    triggerCount: 0,
  };
}
```

---

## Free Spin 流程圖

```
┌─────────────────────────────────────────────────────────────┐
│                      Free Spin 流程                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Base Game]                                                │
│      │                                                      │
│      ▼                                                      │
│  ┌─────────┐     Scatter >= N      ┌──────────────┐        │
│  │  Spin   │ ─────────────────────→│ Trigger FS   │        │
│  │  (NG)   │                       │ Set spins=10 │        │
│  └─────────┘                       │ Set mult=2x  │        │
│      │                             └──────┬───────┘        │
│      │ No trigger                         │                │
│      ▼                                    ▼                │
│  [Continue]                       ┌──────────────┐         │
│                                   │  Free Game   │         │
│                                   │    Loop      │◄────┐   │
│                                   └──────┬───────┘     │   │
│                                          │             │   │
│                                          ▼             │   │
│                                   ┌──────────────┐     │   │
│                                   │  Spin (FG)   │     │   │
│                                   │  × Multiplier│     │   │
│                                   └──────┬───────┘     │   │
│                                          │             │   │
│                                          ▼             │   │
│                                   ┌──────────────┐     │   │
│                                   │ Check        │     │   │
│                                   │ Retrigger    │     │   │
│                                   └──────┬───────┘     │   │
│                                          │             │   │
│                          ┌───────────────┼───────────┐ │   │
│                          │ Yes           │ No        │ │   │
│                          ▼               ▼           │ │   │
│                   ┌────────────┐  ┌────────────┐     │ │   │
│                   │ Add spins  │  │ Consume    │     │ │   │
│                   │ +5         │  │ spin       │     │ │   │
│                   └─────┬──────┘  └─────┬──────┘     │ │   │
│                         │               │            │ │   │
│                         └───────┬───────┘            │ │   │
│                                 │                    │ │   │
│                                 ▼                    │ │   │
│                          ┌────────────┐              │ │   │
│                          │ remaining  │──── >0 ─────┘ │   │
│                          │ spins?     │               │   │
│                          └─────┬──────┘               │   │
│                                │ =0                   │   │
│                                ▼                      │   │
│                         ┌────────────┐                │   │
│                         │ End FS     │                │   │
│                         │ Return win │                │   │
│                         └─────┬──────┘                │   │
│                               │                       │   │
│                               ▼                       │   │
│                         [Back to Base Game]           │   │
│                                                       │   │
└───────────────────────────────────────────────────────────┘
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] useFreeSpinStore 正確管理 Free Spin 狀態
- [ ] Scatter >= triggerCount 時正確觸發 Free Spin
- [ ] Free Spin 次數正確扣減
- [ ] Retrigger 正確增加次數
- [ ] Multiplier 正確應用到獎金
- [ ] Free Spin 結束後正確返回 Base Game
- [ ] Free Spin 狀態只在 useFreeSpinStore.ts 管理（P0 Gate）
- [ ] Scatter 觸發邏輯只在 spin-executor.ts（P0 Gate）
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/store/useFreeSpinStore.ts` 完整程式碼
2. `src/engine/spin-executor.ts` 完整程式碼
3. 測試案例執行結果
4. P0 Gate 檢查結果

