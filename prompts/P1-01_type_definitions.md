# P1-01 型別定義擴展

## 目標 (Objective)

擴展 `src/types/` 下的型別定義，支援 V2 新功能：
- Wild/Scatter 符號
- Free Spin 機制
- NG/FG 分離
- 5x3/5x4 盤面
- SpinPacket v2

---

## 範圍 (Scope)

需要修改的檔案：
- `src/types/symbol.ts`
- `src/types/outcome.ts`
- `src/types/board.ts`
- `src/types/spin-packet.ts`
- `src/types/index.ts`

需要新增的檔案：
- `src/types/free-spin.ts`

---

## 實作細節 (Implementation Details)

### 1. symbol.ts 擴展

**原本**：
```typescript
export type SymbolCategory = 'high' | 'low' | 'special';

export interface SymbolDefinition {
  id: SymbolId;
  name: string;
  category: SymbolCategory;
  payouts: {
    match3: number;
    match4: number;
    match5: number;
  };
  appearanceWeight: number;
}
```

**修正後**：
```typescript
import type { SymbolId } from './board.js';

/**
 * Symbol 類別（僅 normal 類型使用）
 */
export type SymbolCategory = 'high' | 'low';

/**
 * Symbol 類型
 */
export type SymbolType = 'normal' | 'wild' | 'scatter';

/**
 * Wild 設定
 */
export interface WildConfig {
  canReplaceNormal: boolean;   // 是否可替代一般符號（預設 true）
  canReplaceSpecial: boolean;  // 是否可替代特殊符號（預設 false）
}

/**
 * Scatter 設定
 */
export interface ScatterConfig {
  triggerCount: number;        // 觸發所需數量（預設 3）
  freeSpinCount: number;       // 給予的 Free Spin 次數
  enableRetrigger: boolean;    // 是否支援 Retrigger
  enableMultiplier: boolean;   // 是否啟用 Multiplier
  multiplierValue: number;     // Multiplier 倍率（預設 2）
}

/**
 * Symbol 定義（V2 擴展版）
 */
export interface SymbolDefinition {
  id: SymbolId;
  name: string;
  type: SymbolType;            // 新增：符號類型
  category: SymbolCategory;    // 僅 normal 類型有效
  payouts: {
    match3: number;
    match4: number;
    match5: number;
  };
  // 雙層機率模型
  appearanceWeight: number;    // 視覺層：滾動動畫用
  ngWeight: number;            // 數學層：NG Pool 生成用
  fgWeight: number;            // 數學層：FG Pool 生成用
  // 特殊符號設定
  wildConfig?: WildConfig;     // 僅 wild 類型有效
  scatterConfig?: ScatterConfig; // 僅 scatter 類型有效
}
```

### 2. outcome.ts 擴展

**原本**：
```typescript
export interface Outcome {
  id: string;
  name: string;
  multiplierRange: {
    min: number;
    max: number;
  };
  weight: number;
}
```

**修正後**：
```typescript
/**
 * 遊戲階段
 */
export type GamePhase = 'ng' | 'fg';

/**
 * Outcome 定義（V2 擴展版）
 */
export interface Outcome {
  id: string;
  name: string;
  phase: GamePhase;           // 新增：所屬遊戲階段
  multiplierRange: {
    min: number;
    max: number;
  };
  weight: number;
}

/**
 * Outcome 配置（NG/FG 分離）
 */
export interface OutcomeConfig {
  ngOutcomes: Outcome[];      // Base Game Outcomes
  fgOutcomes: Outcome[];      // Free Game Outcomes
}
```

### 3. board.ts 擴展

**原本**：
```typescript
export type SymbolId = string;

export interface Board {
  reels: SymbolId[][];
  cols: 5;
  rows: 3;
}
```

**修正後**：
```typescript
export type SymbolId = string;

/**
 * 盤面行數（支援 3 或 4）
 */
export type BoardRows = 3 | 4;

/**
 * 盤面配置
 */
export interface BoardConfig {
  cols: 5;
  rows: BoardRows;
}

/**
 * Board 定義（V2 支援動態尺寸）
 */
export interface Board {
  reels: SymbolId[][];        // 5 列，每列 3 或 4 個符號
  cols: 5;
  rows: BoardRows;
}
```

### 4. free-spin.ts 新增

```typescript
import type { Board } from './board.js';

/**
 * Free Spin 模式
 */
export type FreeSpinMode = 'base' | 'free';

/**
 * Free Spin 配置
 */
export interface FreeSpinConfig {
  enabled: boolean;            // 是否啟用 Free Spin 功能
  triggerCount: number;        // Scatter 觸發數量
  baseSpinCount: number;       // 基礎 Free Spin 次數
  enableRetrigger: boolean;    // 是否支援 Retrigger
  retriggerSpinCount: number;  // Retrigger 給予的額外次數
  enableMultiplier: boolean;   // 是否啟用 Multiplier
  multiplierValue: number;     // Multiplier 倍率
}

/**
 * Free Spin 狀態
 */
export interface FreeSpinState {
  mode: FreeSpinMode;
  remainingSpins: number;
  totalSpins: number;
  accumulatedWin: number;
  currentMultiplier: number;
  triggerCount: number;        // 本輪觸發的 Scatter 數量
}

/**
 * Free Spin 單次結果
 */
export interface FreeSpinResult {
  spinIndex: number;
  board: Board;
  win: number;
  multipliedWin: number;
  isRetrigger: boolean;
}
```

### 5. spin-packet.ts 擴展

**原本**：
```typescript
export interface SpinPacket {
  version: "1";
  board: Board;
  visual: VisualConfig;
  assets?: AssetsPatch;
  meta?: SettlementMeta;
}
```

**修正後**：
```typescript
import type { Board } from './board.js';
import type { SymbolId } from './board.js';
import type { VisualConfig, AssetsPatch } from './visual.js';
import type { FreeSpinMode, FreeSpinState } from './free-spin.js';

/**
 * WinningLine 中獎線資訊（V2 擴展）
 */
export interface WinningLine {
  lineIndex: number;
  positions: [number, number][];
  symbol: SymbolId;
  count: number;
  payout: number;
  hasWild: boolean;           // 新增：是否包含 Wild
  wildPositions?: [number, number][]; // 新增：Wild 位置
}

/**
 * SettlementMeta 結算資訊（V2 擴展）
 */
export interface SettlementMeta {
  outcomeId: string;
  phase: FreeSpinMode;        // 新增：遊戲階段
  win: number;
  multiplier: number;
  winningLines: WinningLine[];
  bestLine?: WinningLine;
  scatterCount: number;       // 新增：Scatter 數量
  triggeredFreeSpin: boolean; // 新增：是否觸發 Free Spin
}

/**
 * SpinPacket v2 主合約
 */
export interface SpinPacket {
  version: "2";               // 版本升級
  board: Board;
  visual: VisualConfig;
  assets?: AssetsPatch;
  meta?: SettlementMeta;
  freeSpinState?: FreeSpinState; // 新增：Free Spin 狀態
}
```

### 6. index.ts 更新

```typescript
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
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] `src/types/symbol.ts` 包含 SymbolType, WildConfig, ScatterConfig
- [ ] `src/types/symbol.ts` 包含 ngWeight, fgWeight 欄位
- [ ] `src/types/outcome.ts` 包含 GamePhase 和 OutcomeConfig
- [ ] `src/types/board.ts` 支援 BoardRows (3 | 4)
- [ ] `src/types/free-spin.ts` 新增並包含所有 Free Spin 型別
- [ ] `src/types/spin-packet.ts` 版本升級至 "2"
- [ ] `src/types/index.ts` 正確匯出所有新型別
- [ ] `npx tsc --noEmit` 無錯誤
- [ ] 無 `any` 型別

---

## 輸出格式 (Output Format)

完成後提供：
1. 所有修改檔案的完整程式碼
2. 編譯測試結果
3. 型別匯出測試結果

