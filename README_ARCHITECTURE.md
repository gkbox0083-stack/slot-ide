# slot-ide 架構規格書（README_ARCHITECTURE.md）

> ✅ **MVP 完成** — 本文件定義的所有功能已全數實作完成（2025-01-04）

本文件是專案的「北極星」，定義產品應該長什麼樣子。
所有設計決策衝突，以本文件為最終裁決依據。

---

## 一、產品定位

### 是什麼
- 單頁 Slot IDE 工具
- 內建 Runtime Renderer
- 面向 Slot 遊戲設計師與數學驗證人員

### 不是什麼
- 不是正式遊戲產品
- 不是多視窗應用
- 不是需要後端的系統

---

## 二、技術架構

### 技術棧
- Vite + React + TypeScript
- 單一 SPA（Single Page Application）
- 無後端、無資料庫
- 本地儲存（localStorage）用於設定持久化

### 專案結構

```
slot-ide/
├── AI_GUIDE.md              # AI 指南
├── SYSTEM_PROMPT.md         # 憲法
├── README_ARCHITECTURE.md   # 本文件（北極星）
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx             # 進入點
    ├── App.tsx              # 主應用
    │
    ├── types/               # 型別定義（合約層）
    │   ├── index.ts
    │   ├── spin-packet.ts   # SpinPacket 主合約
    │   ├── outcome.ts       # Outcome 定義
    │   ├── symbol.ts        # Symbol 定義（種類、分數、機率）
    │   ├── board.ts         # Board 定義
    │   ├── lines.ts         # Lines 定義
    │   └── visual.ts        # VisualConfig + AssetsPatch 定義
    │
    ├── engine/              # Math Engine（數學層）
    │   ├── index.ts
    │   ├── outcome-manager.ts
    │   ├── symbol-manager.ts
    │   ├── lines-manager.ts
    │   ├── pool-builder.ts
    │   ├── spin-executor.ts
    │   └── settlement.ts    # best-line 結算
    │
    ├── runtime/             # Runtime Renderer（渲染層）
    │   ├── index.ts
    │   ├── SlotMachine.tsx
    │   ├── Reel.tsx
    │   ├── Symbol.tsx
    │   └── animations.ts
    │
    ├── ide/                 # IDE 介面（UI 層）
    │   ├── index.ts
    │   ├── panels/
    │   │   ├── GameParamsPanel.tsx    # Base Bet, Spins
    │   │   ├── OutcomePanel.tsx       # 倍率區間、權重
    │   │   ├── SymbolPanel.tsx        # Symbol 設定
    │   │   ├── LinesPanel.tsx         # Lines 設定
    │   │   ├── AnimationPanel.tsx     # 動態參數
    │   │   ├── LayoutPanel.tsx        # 盤面視覺
    │   │   ├── AssetPanel.tsx         # 素材上傳
    │   │   └── ControlPanel.tsx       # Build / Spin / Simulation
    │   └── layout/
    │       └── IDELayout.tsx
    │
    ├── analytics/           # 統計分析
    │   ├── index.ts
    │   ├── simulator.ts
    │   ├── charts.tsx
    │   └── csv-export.ts
    │
    ├── store/               # 狀態管理
    │   └── index.ts
    │
    └── utils/               # 工具函式
        ├── index.ts
        └── asset-storage.ts # 素材持久化
```

---

## 三、核心資料合約

### SpinPacket（唯一主幹）

```typescript
interface SpinPacket {
  version: "1";
  board: Board;              // 5x3 盤面
  visual: VisualConfig;      // 動畫參數
  assets?: AssetsPatch;      // 素材覆蓋
  meta?: SettlementMeta;     // 結算資訊
}
```

### Board

```typescript
interface Board {
  reels: SymbolId[][];       // 5 輪，每輪 3 個符號
  cols: 5;
  rows: 3;
}

type SymbolId = string;      // 例如 "H1", "H2", "L1", "L2", "WILD"
```

### Symbol

```typescript
interface SymbolDefinition {
  id: SymbolId;
  name: string;
  category: 'high' | 'low' | 'special';  // 類別
  payouts: {
    match3: number;          // 3 連線分數
    match4: number;          // 4 連線分數
    match5: number;          // 5 連線分數
  };
  appearanceWeight: number;  // 出現機率權重（控制前端出現機率）
}
```

### Lines

```typescript
interface LinesConfig {
  count: number;             // 線數（如 20 條）
  patterns: LinePattern[];   // 每條線的排列方式
}

interface LinePattern {
  id: number;
  positions: [number, number][];  // 5 個位置 [col, row]
}
```

### VisualConfig

```typescript
interface VisualConfig {
  // 動態參數（Animation）
  animation: {
    spinSpeed: number;        // 滾輪轉速
    spinDuration: number;     // 旋轉時長（ms）
    reelStopDelay: number;    // 停輪間隔（ms）
    easeStrength: number;     // 緩停力度（0-1）
    bounceStrength: number;   // 回彈力度（0-1）
  };
  
  // 盤面視覺（Layout）
  layout: {
    reelGap: number;          // 卷軸間距（px）
    symbolScale: number;      // 圖示縮放（0.5-2）
    boardScale: number;       // 盤面縮放（0.5-2）
  };
}
```

### AssetsPatch

```typescript
interface AssetsPatch {
  symbols?: Record<SymbolId, string>;  // symbol -> 圖片 URL（與 symbol 種類數量連動）
  board?: string;                       // 盤面底圖
  frame?: string;                       // 盤面框
  background?: string;                  // 背景圖
  character?: string;                   // 人物圖
}
```

### SettlementMeta

```typescript
interface SettlementMeta {
  outcomeId: string;
  win: number;
  multiplier: number;
  bestLine?: {
    lineIndex: number;
    positions: [number, number][];      // [col, row]
    symbol: SymbolId;
    count: number;
  };
}
```

---

## 四、Outcome 與盤池規格

### Outcome 定義

```typescript
interface Outcome {
  id: string;
  name: string;
  multiplierRange: {
    min: number;
    max: number;
  };
  weight: number;            // 抽中權重
}
```

### Pool 結構

```typescript
interface Pool {
  outcomeId: string;
  boards: Board[];           // 預生成的盤面
  cap: number;               // 盤池上限
}
```

### 盤池生成流程

1. 使用者定義 Outcomes
2. 點擊 Build Pools
3. 為每個 Outcome 生成符合倍率區間的盤面
4. 存入對應 Pool（最多 cap 筆）

### Spin 流程

1. 根據權重抽取 Outcome
2. 從對應 Pool 隨機抽取一個 Board
3. 計算 best-line 結算
4. 組裝 SpinPacket
5. 傳給 Runtime Renderer

---

## 五、模組責任邊界

| 模組 | 可以做 | 不可以做 |
|------|--------|----------|
| **Math Engine** | 產生盤面、結算、管理盤池 | 處理動畫、修改 UI |
| **Runtime Renderer** | 播放動畫、渲染盤面 | 生成盤面、計算結果 |
| **IDE UI** | 收集參數、觸發動作、顯示結果 | 直接修改 Engine 或 Renderer 內部狀態 |
| **Analytics** | 批次呼叫 Engine、統計、匯出 | 自己實作 spin 邏輯 |
| **Utils** | 純函式、localStorage 操作 | 依賴 React、修改 Store |

---

## 六、資料流（單向）

```
┌─────────────┐
│   IDE UI    │  使用者操作
└──────┬──────┘
       │ 參數
       ▼
┌─────────────┐
│ Math Engine │  產生結果
└──────┬──────┘
       │ SpinPacket
       ▼
┌─────────────┐
│  Runtime    │  播放動畫
│  Renderer   │
└─────────────┘
```

---

## 七、Best-Line 結算規則

### 線定義
- 固定 20 條線（或可配置）
- 每條線由 5 個位置組成
- 從左到右連續相同符號

### 結算邏輯
1. 遍歷所有線
2. 計算每條線的連續符號數
3. 查表得到倍率
4. 選擇最佳獲利線作為 bestLine

---

## 八、IDE 功能清單

### 數學模擬器（原 PAGE1）

**遊戲參數**
- [x] Base Bet 設定
- [x] Spins Demo 次數

**數學參數**
- [x] Outcome 編輯（倍率區間、權重）
- [x] Symbol 設定（種類、分數、類別、出現機率）
- [x] Lines 設定（線數、排列方式）
- [x] Build Pools 按鈕
- [x] Spin 按鈕

**統計顯示**
- [x] 輸贏分折線圖
- [x] 離散圖
- [x] RTP / Hit Rate / Avg Win / Total Spins / Total Win
- [x] CSV 匯出

### 視覺預覽器（原 PAGE2）

**動態參數**
- [x] 滾輪轉速調整
- [x] 旋轉時長調整
- [x] 停輪間隔調整
- [x] 緩停力度調整
- [x] 回彈力度調整

**盤面視覺**
- [x] 卷軸間距調整
- [x] 圖示縮放調整
- [x] 盤面縮放調整

**素材上傳**
- [x] 圖示上傳（與 symbol 種類連動）
- [x] 盤面底圖上傳
- [x] 盤面框上傳
- [x] 背景上傳
- [x] 人物上傳

### 共用顯示
- [x] Runtime 盤面預覽
- [x] 中獎線高亮

---

## 九、禁止事項（紅線）

1. **禁止雙專案** — 只能有一個 Vite App
2. **禁止 iframe** — 無跨視窗通訊
3. **禁止第二套 RNG** — Runtime 不得有亂數
4. **禁止第二套合約** — SpinPacket 是唯一介面
5. **禁止暫時方案** — 不做「之後再改」的設計
6. **禁止提前加功能** — Wild / Scatter / Multi-win 待核心完成後再議

---

## 十、版本紀錄

| 版本 | 日期 | 說明 |
|------|------|------|
| 1.0 | 2025-01-02 | 初始版本，完整架構定義 |
| 1.1 | 2025-01-04 | MVP 完成，所有功能已實作 |

# Store 規格補充（README_ARCHITECTURE 附錄）

本文件補充 `src/store/index.ts` 的具體規格。

---

## 狀態結構

```typescript
/**
 * IDE 全域狀態
 */
interface IDEState {
  // === 盤池狀態 ===
  isPoolsBuilt: boolean;
  poolStatus: PoolStatus[];
  
  // === Spin 狀態 ===
  currentSpinPacket: SpinPacket | null;
  isSpinning: boolean;
  
  // === UI 狀態 ===
  activeTab: 'math' | 'visual' | 'control';
  
  // === 遊戲參數 ===
  baseBet: number;
  simulationCount: number;
  
  // === 視覺參數 ===
  visualConfig: VisualConfig;
  
  // === 素材 ===
  assets: AssetsPatch;
}
```

---

## 狀態更新規則

### 1. 盤池相關
- `buildPools()` 後更新 `isPoolsBuilt` 和 `poolStatus`
- 任何數學參數改變後，需重新 `buildPools()`

### 2. Spin 相關
- `spin()` 後更新 `currentSpinPacket`
- 動畫開始時設定 `isSpinning = true`
- 動畫完成時設定 `isSpinning = false`

### 3. 視覺參數
- `visualConfig` 改變後立即反映到下次 Spin
- 不需要重新 `buildPools()`

### 4. 素材
- `assets` 改變後立即反映到 Runtime
- 儲存到 localStorage

---

## 狀態與模組的關係

```
┌─────────────────────────────────────────────────────┐
│                     Store                           │
│  (IDEState)                                         │
└─────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  IDE Panels │      │ Math Engine │      │   Runtime   │
│  (讀+寫)     │      │  (讀)        │      │  (讀)        │
└─────────────┘      └─────────────┘      └─────────────┘
```

### 讀寫權限
- **IDE Panels**：可讀取和更新 Store
- **Math Engine**：只讀取 Store（透過參數傳入）
- **Runtime**：只讀取 Store（透過 props 傳入）

---

## 初始值

```typescript
const initialState: IDEState = {
  // 盤池狀態
  isPoolsBuilt: false,
  poolStatus: [],
  
  // Spin 狀態
  currentSpinPacket: null,
  isSpinning: false,
  
  // UI 狀態
  activeTab: 'control',
  
  // 遊戲參數
  baseBet: 1,
  simulationCount: 100,
  
  // 視覺參數
  visualConfig: {
    animation: {
      spinSpeed: 20,
      spinDuration: 2000,
      reelStopDelay: 200,
      easeStrength: 0.5,
      bounceStrength: 0.3,
    },
    layout: {
      reelGap: 10,
      symbolScale: 1,
      boardScale: 1,
    },
  },
  
  // 素材
  assets: {},
};
```

---

## 實作方式

Phase 4 採用 **React Context + useReducer** 實作，不引入外部狀態管理庫。

```typescript
// src/store/index.ts

import { createContext, useContext, useReducer } from 'react';

// Action Types
type IDEAction =
  | { type: 'SET_POOLS_BUILT'; payload: { status: PoolStatus[] } }
  | { type: 'SET_SPIN_PACKET'; payload: SpinPacket }
  | { type: 'SET_SPINNING'; payload: boolean }
  | { type: 'SET_ACTIVE_TAB'; payload: 'math' | 'visual' | 'control' }
  | { type: 'SET_BASE_BET'; payload: number }
  | { type: 'SET_SIMULATION_COUNT'; payload: number }
  | { type: 'SET_VISUAL_CONFIG'; payload: VisualConfig }
  | { type: 'SET_ASSETS'; payload: AssetsPatch };

// Reducer
function ideReducer(state: IDEState, action: IDEAction): IDEState {
  // ...
}

// Context
export const IDEContext = createContext<{
  state: IDEState;
  dispatch: React.Dispatch<IDEAction>;
} | null>(null);

// Hook
export function useIDE() {
  const context = useContext(IDEContext);
  if (!context) {
    throw new Error('useIDE must be used within IDEProvider');
  }
  return context;
}
```