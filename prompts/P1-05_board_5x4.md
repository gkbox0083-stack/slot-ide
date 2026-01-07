# P1-05 Board 5x4 支援

## 目標 (Objective)

擴展盤面系統支援 5x4 尺寸，包括：
- Board 型別支援動態行數
- Pool Builder 支援 5x4 盤面生成
- Settlement 支援 5x4 盤面結算
- 盤面切換邏輯

---

## 範圍 (Scope)

需要修改的檔案：
- `src/engine/pool-builder.ts`
- `src/engine/settlement.ts`（已在 P1-03 處理，需確認相容）
- `src/store/useGameConfigStore.ts`

依賴：
- P1-01（型別定義擴展）

---

## 實作細節 (Implementation Details)

### 1. useGameConfigStore.ts 新增盤面配置

```typescript
import type { BoardConfig, BoardRows } from '../types/board.js';

// 新增 State
interface GameConfigState {
  // ... 現有欄位
  boardConfig: BoardConfig;
}

// 新增 Actions
interface GameConfigActions {
  // ... 現有欄位
  setBoardConfig: (config: BoardConfig) => void;
  setBoardRows: (rows: BoardRows) => void;
}

// 預設值
const defaultBoardConfig: BoardConfig = {
  cols: 5,
  rows: 3,
};

// Store 實作
setBoardConfig: (config) => set({ boardConfig: config }),

setBoardRows: (rows) => set((state) => ({
  boardConfig: { ...state.boardConfig, rows },
  // 切換盤面時清空相關狀態（Pool 會在 P1-06 處理）
})),
```

### 2. pool-builder.ts 支援動態盤面

```typescript
import type { Board, BoardConfig, SymbolId } from '../types/board.js';
import type { SymbolDefinition } from '../types/symbol.js';
import type { Outcome } from '../types/outcome.js';
import type { LinesConfig } from '../types/lines.js';
import type { FreeSpinMode } from '../types/free-spin.js';
import { getSymbolWeight, isWildSymbol, isScatterSymbol } from './symbol-manager.js';

interface PoolBuildContext {
  boardConfig: BoardConfig;
  symbols: SymbolDefinition[];
  linesConfig: LinesConfig;
  baseBet: number;
}

/**
 * 根據權重隨機抽取符號（排除特殊符號）
 */
function drawSymbol(
  symbols: SymbolDefinition[],
  phase: FreeSpinMode,
): SymbolId {
  // 只抽取一般符號（Wild 和 Scatter 由特殊邏輯控制）
  const normalSymbols = symbols.filter(s => !isWildSymbol(s) && !isScatterSymbol(s));
  const totalWeight = normalSymbols.reduce((sum, s) => sum + getSymbolWeight(s, phase), 0);
  
  let random = Math.random() * totalWeight;
  for (const symbol of normalSymbols) {
    random -= getSymbolWeight(symbol, phase);
    if (random <= 0) {
      return symbol.id;
    }
  }
  
  return normalSymbols[normalSymbols.length - 1].id;
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
      reel.push(drawSymbol(symbols, phase));
    }
    reels.push(reel);
  }
  
  return {
    reels,
    cols: boardConfig.cols,
    rows: boardConfig.rows,
  };
}

/**
 * 計算盤面倍率
 */
function calculateBoardMultiplier(
  board: Board,
  symbols: SymbolDefinition[],
  linesConfig: LinesConfig,
  baseBet: number,
): number {
  // 使用 settlement 計算
  // 這裡需要引入 settle 函式，但為了避免循環依賴，
  // 可以提取一個共用的計算函式
  
  let totalPayout = 0;
  
  for (const line of linesConfig.patterns) {
    // 確保線路配置與盤面行數相容
    const validPositions = line.positions.filter(([col, row]) => 
      col < board.cols && row < board.rows
    );
    
    if (validPositions.length < board.cols) {
      continue; // 線路不適用於當前盤面
    }
    
    // 取得線上符號
    const lineSymbols = validPositions.map(([col, row]) => board.reels[col][row]);
    
    // 計算連續相同符號（簡化版，不含 Wild）
    const firstSymbol = lineSymbols[0];
    let count = 1;
    for (let i = 1; i < lineSymbols.length; i++) {
      if (lineSymbols[i] === firstSymbol) {
        count++;
      } else {
        break;
      }
    }
    
    if (count >= 3) {
      const symbolDef = symbols.find(s => s.id === firstSymbol);
      if (symbolDef) {
        const payoutKey = `match${count}` as keyof typeof symbolDef.payouts;
        totalPayout += symbolDef.payouts[payoutKey] || 0;
      }
    }
  }
  
  return totalPayout * baseBet;
}

/**
 * 為單個 Outcome 建立 Pool
 */
export function buildPoolForOutcome(
  outcome: Outcome,
  context: PoolBuildContext,
  phase: FreeSpinMode,
  cap: number = 100,
  maxAttempts: number = 10000,
): Board[] {
  const { boardConfig, symbols, linesConfig, baseBet } = context;
  const pool: Board[] = [];
  let attempts = 0;
  
  while (pool.length < cap && attempts < maxAttempts) {
    attempts++;
    
    const board = generateRandomBoard(boardConfig, symbols, phase);
    const multiplier = calculateBoardMultiplier(board, symbols, linesConfig, baseBet);
    
    // 檢查是否在倍率區間內
    if (multiplier >= outcome.multiplierRange.min && 
        multiplier <= outcome.multiplierRange.max) {
      pool.push(board);
    }
  }
  
  return pool;
}

/**
 * 取得適用於當前盤面的線路配置
 */
export function getCompatibleLines(
  linesConfig: LinesConfig,
  boardConfig: BoardConfig,
): LinesConfig {
  const compatiblePatterns = linesConfig.patterns.filter(pattern => {
    return pattern.positions.every(([col, row]) => 
      col < boardConfig.cols && row < boardConfig.rows
    );
  });
  
  return {
    count: compatiblePatterns.length,
    patterns: compatiblePatterns,
  };
}
```

### 3. 預設線路配置（5x4）

```typescript
const default5x4LinesConfig: LinesConfig = {
  count: 30,
  patterns: [
    // 基礎直線（4 行）
    { id: 1, positions: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
    { id: 2, positions: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]] },
    { id: 3, positions: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]] },
    { id: 4, positions: [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]] },
    // V 形
    { id: 5, positions: [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]] },
    { id: 6, positions: [[0, 3], [1, 2], [2, 1], [3, 2], [4, 3]] },
    // 倒 V 形
    { id: 7, positions: [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]] },
    { id: 8, positions: [[0, 1], [1, 2], [2, 3], [3, 2], [4, 1]] },
    // 階梯形
    { id: 9, positions: [[0, 0], [1, 0], [2, 1], [3, 2], [4, 3]] },
    { id: 10, positions: [[0, 3], [1, 3], [2, 2], [3, 1], [4, 0]] },
    // ... 更多線路配置
    // 可擴展至 30 條
  ],
};
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] BoardConfig 正確儲存在 Store
- [ ] 可以切換 5x3 / 5x4 盤面
- [ ] Pool Builder 可生成 5x4 盤面
- [ ] Settlement 可處理 5x4 盤面
- [ ] 線路配置自動適應盤面尺寸
- [ ] 切換盤面時有彈窗警告（UI 在 Phase 2 實作）
- [ ] `npm run build` 成功

---

## 測試案例

### 案例 1：生成 5x4 盤面
```typescript
const board = generateRandomBoard({ cols: 5, rows: 4 }, symbols, 'ng');
expect(board.rows).toBe(4);
expect(board.reels[0].length).toBe(4);
```

### 案例 2：線路相容性
```typescript
const compatible = getCompatibleLines(lines5x3Config, { cols: 5, rows: 4 });
// 5x3 線路在 5x4 盤面上應該都相容
```

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/engine/pool-builder.ts` 修改片段
2. `src/store/useGameConfigStore.ts` 修改片段
3. 預設 5x4 線路配置
4. 測試案例執行結果

