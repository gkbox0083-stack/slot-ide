# slot-ide 架構規格書 V2（README_ARCHITECTURE.md）

> ✅ **MVP 完成** — 本文件定義的所有功能已全數實作完成（2025-01-04）

本文件是專案的「北極星」，定義產品應該長什麼樣子。
所有設計決策衝突，以本文件為最終裁決依據。

---

## 一、產品定位

### 是什麼
- 單頁 Slot IDE 工具
- 內建 Runtime Renderer
- 面向 Slot 遊戲設計師與數學驗證人員
- 支援 Wild/Scatter/Free Spin 等進階機制
- 提供用戶系統與雲端模板管理

### 不是什麼
- 不是正式遊戲產品
- 不是多視窗應用
- 不是需要自建後端的系統（使用 Firebase）

---

## 二、技術架構

### 技術棧
- Vite + React + TypeScript
- 單一 SPA（Single Page Application）
- Firebase（Auth + Firestore + Storage）
- Zustand 狀態管理
- 本地儲存（localStorage）用於訪客模式

### 專案結構

```
slot-ide/
├── AI_GUIDE.md              # AI 指南
├── README_ARCHITECTURE.md   # 本文件（北極星）
├── PRD_SLOT_IDE_V2.md       # 產品需求規格書
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── prompts/                 # Cursor 執行任務文件
│   ├── P0-01_rule_mdc_update.md
│   ├── P1-01_type_definitions.md
│   └── ...
└── src/
    ├── main.tsx             # 進入點
    ├── App.tsx              # 主應用
    │
    ├── types/               # 型別定義（合約層）
    │   ├── index.ts
    │   ├── spin-packet.ts   # SpinPacket v2 主合約
    │   ├── outcome.ts       # Outcome 定義（含 GamePhase）
    │   ├── symbol.ts        # Symbol 定義（含 Wild/Scatter）
    │   ├── board.ts         # Board 定義（支援 5x3/5x4）
    │   ├── lines.ts         # Lines 定義
    │   ├── visual.ts        # VisualConfig + AssetsPatch
    │   ├── free-spin.ts     # Free Spin 型別
    │   ├── template.ts      # 模板型別
    │   └── user.ts          # 用戶型別
    │
    ├── engine/              # Math Engine（數學層）
    │   ├── index.ts
    │   ├── outcome-manager.ts
    │   ├── symbol-manager.ts
    │   ├── lines-manager.ts
    │   ├── pool-builder.ts  # 支援 NG/FG Pool
    │   ├── spin-executor.ts # 支援 Free Spin 流程
    │   ├── settlement.ts    # 支援 Wild 結算
    │   └── rtp-calculator.ts # NG/FG RTP 分開計算
    │
    ├── runtime/             # Runtime Renderer（渲染層）
    │   ├── index.ts
    │   ├── SlotMachine.tsx
    │   ├── Reel.tsx
    │   └── Symbol.tsx
    │
    ├── ide/                 # IDE 介面（UI 層）
    │   ├── index.ts
    │   ├── layout/
    │   │   ├── IDELayout.tsx      # 三欄式主佈局
    │   │   ├── ControlPanel.tsx   # 左側控制面板
    │   │   ├── GameControl.tsx    # 右側遊戲控制
    │   │   └── StatisticsPanel.tsx # 底部統計區
    │   └── panels/
    │       ├── OutcomePanel.tsx   # NG/FG 切換
    │       ├── SymbolPanel.tsx    # Wild/Scatter 設定
    │       ├── LinesPanel.tsx     # 視覺化線路編輯
    │       ├── AnimationPanel.tsx
    │       ├── LayoutPanel.tsx
    │       ├── AssetPanel.tsx
    │       ├── PoolPanel.tsx
    │       ├── BettingPanel.tsx
    │       ├── SimulationPanel.tsx
    │       ├── HistoryPanel.tsx
    │       └── FreeSpinPanel.tsx
    │
    ├── analytics/           # 統計分析
    │   ├── index.ts
    │   ├── simulator.ts     # 支援堆疊/比較模式
    │   ├── charts.tsx
    │   ├── csv-export.ts
    │   └── validation.ts    # 數值驗證工具
    │
    ├── store/               # 狀態管理
    │   ├── index.ts
    │   ├── useGameConfigStore.ts
    │   ├── useUIStore.ts
    │   ├── useAuthStore.ts
    │   ├── useFreeSpinStore.ts
    │   ├── useSimulationStore.ts
    │   └── useTemplateStore.ts
    │
    ├── firebase/            # Firebase 整合
    │   ├── config.ts
    │   ├── auth.ts
    │   ├── firestore.ts
    │   └── storage.ts
    │
    ├── pages/               # 頁面
    │   ├── Dashboard.tsx
    │   └── Editor.tsx
    │
    └── utils/               # 工具函式
        ├── index.ts
        └── asset-storage.ts
```

---

## 三、核心資料合約

### SpinPacket v2（唯一主幹）

```typescript
interface SpinPacket {
  version: "2";
  board: Board;              // 5x3 或 5x4 盤面
  visual: VisualConfig;      // 動畫參數
  assets?: AssetsPatch;      // 素材覆蓋
  meta?: SettlementMeta;     // 結算資訊
  freeSpinState?: FreeSpinState; // Free Spin 狀態
}
```

### Board（支援動態尺寸）

```typescript
type BoardRows = 3 | 4;

interface BoardConfig {
  cols: 5;
  rows: BoardRows;
}

interface Board {
  reels: SymbolId[][];       // 5 輪，每輪 3 或 4 個符號
  cols: 5;
  rows: BoardRows;
}

type SymbolId = string;      // 例如 "H1", "H2", "WILD", "SCATTER"
```

### Symbol（擴展版）

```typescript
type SymbolType = 'normal' | 'wild' | 'scatter';
type SymbolCategory = 'high' | 'low';

interface WildConfig {
  canReplaceNormal: boolean;   // 預設 true
  canReplaceSpecial: boolean;  // 預設 false
}

interface ScatterConfig {
  triggerCount: number;        // 觸發所需數量（預設 3）
  freeSpinCount: number;       // 給予的 Free Spin 次數
  enableRetrigger: boolean;    // 是否支援 Retrigger
  enableMultiplier: boolean;   // 是否啟用 Multiplier
  multiplierValue: number;     // Multiplier 倍率
}

interface SymbolDefinition {
  id: SymbolId;
  name: string;
  type: SymbolType;
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
  wildConfig?: WildConfig;
  scatterConfig?: ScatterConfig;
}
```

### Outcome（支援 NG/FG）

```typescript
type GamePhase = 'ng' | 'fg';

interface Outcome {
  id: string;
  name: string;
  phase: GamePhase;
  multiplierRange: {
    min: number;
    max: number;
  };
  weight: number;
}

interface OutcomeConfig {
  ngOutcomes: Outcome[];
  fgOutcomes: Outcome[];
}
```

### Lines

```typescript
interface LinesConfig {
  count: number;             // 線數（最多 50 條）
  patterns: LinePattern[];
}

interface LinePattern {
  id: number;
  positions: [number, number][];  // 5 個位置 [col, row]
}
```

### VisualConfig

```typescript
interface VisualConfig {
  animation: {
    spinSpeed: number;
    spinDuration: number;
    reelStopDelay: number;
    easeStrength: number;
    bounceStrength: number;
  };
  layout: {
    reelGap: number;
    symbolScale: number;
    boardScale: number;
  };
}
```

### AssetsPatch

```typescript
interface AssetsPatch {
  symbols?: Record<SymbolId, string>;
  board?: string;
  frame?: string;
  background?: string;
  character?: string;
}
```

### SettlementMeta（擴展版）

```typescript
interface WinningLine {
  lineIndex: number;
  positions: [number, number][];
  symbol: SymbolId;
  count: number;
  payout: number;
  hasWild: boolean;
  wildPositions?: [number, number][];
}

interface SettlementMeta {
  outcomeId: string;
  phase: 'ng' | 'fg';
  win: number;
  multiplier: number;
  winningLines: WinningLine[];
  bestLine?: WinningLine;
  scatterCount: number;
  triggeredFreeSpin: boolean;
}
```

### FreeSpinState

```typescript
type FreeSpinMode = 'base' | 'free';

interface FreeSpinConfig {
  enabled: boolean;
  triggerCount: number;
  baseSpinCount: number;
  enableRetrigger: boolean;
  retriggerSpinCount: number;
  enableMultiplier: boolean;
  multiplierValue: number;
}

interface FreeSpinState {
  mode: FreeSpinMode;
  remainingSpins: number;
  totalSpins: number;
  accumulatedWin: number;
  currentMultiplier: number;
  triggerCount: number;
}
```

---

## 四、雙層機率模型

### 核心概念

```
┌─────────────────────────────────────────────────────────────┐
│  雙層機率模型                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  【數學層】→ 影響 RTP                                        │
│  ├─ Outcome 權重：決定抽中哪個倍率區間                        │
│  ├─ Symbol ngWeight/fgWeight：Pool 生成時使用                │
│  └─ Pool 生成：基於 Outcome 倍率區間生成盤面                  │
│                                                             │
│  【視覺層】→ 不影響 RTP                                      │
│  └─ Symbol appearanceWeight：只影響滾動動畫中的符號分布       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 關鍵原則

- Pool Builder 只根據 Outcome 倍率區間和 Symbol Payouts 生成盤面
- `appearanceWeight` 只用於 Runtime 滾動動畫
- RTP 計算只看數學層

---

## 五、RTP 計算公式

### 業界標準公式

```
總 RTP = NG RTP + FG RTP 貢獻

FG RTP 貢獻 = P(觸發FG) × E[FG 總獎金] / Bet

其中：
- P(觸發FG) = Scatter >= N 的機率
- E[FG 總獎金] = 預期 Free Spin 次數 × 平均每次 FG 獎金 × Multiplier

預期 Free Spin 次數（含 Retrigger）：
= 初始次數 / (1 - 初始次數 × P(Retrigger))
```

---

## 六、模組責任邊界

| 模組 | 可以做 | 不可以做 |
|------|--------|----------|
| **Math Engine** | 產生盤面、結算、管理盤池、Wild 替代邏輯、Free Spin 觸發 | 處理動畫、修改 UI |
| **Runtime Renderer** | 播放動畫、渲染盤面、使用 appearanceWeight 顯示滾動符號 | 生成盤面、計算結果、有 RNG |
| **IDE UI** | 收集參數、觸發動作、顯示結果 | 直接修改 Engine 或 Renderer 內部狀態 |
| **Analytics** | 批次呼叫 Engine、統計、匯出 | 自己實作 spin 邏輯 |
| **Firebase** | 用戶認證、模板 CRUD、素材儲存 | 遊戲邏輯 |
| **Utils** | 純函式、localStorage 操作 | 依賴 React、修改 Store |

---

## 七、資料流（單向）

```
┌─────────────┐
│   IDE UI    │  使用者操作
└──────┬──────┘
       │ 參數
       ▼
┌─────────────┐
│ Math Engine │  產生結果（含 Wild 結算、Free Spin 判定）
└──────┬──────┘
       │ SpinPacket v2
       ▼
┌─────────────┐
│  Runtime    │  播放動畫
│  Renderer   │
└─────────────┘
```

---

## 八、Wild 結算規則

### 結算邏輯

1. 遍歷所有線
2. 對於每條線，從左到右檢查連續符號
3. 如果位置是 Wild 且 `canReplaceNormal = true`，視為與目標符號相同
4. Wild 不計算 Wild 自身的 payout（僅作為替代）
5. 選擇最佳組合（Wild 可組成多種組合時，選最高分）

### 程式碼位置

- 唯一位置：`src/engine/settlement.ts`

---

## 九、Free Spin 流程

```
┌─────────────┐     觸發條件達成      ┌─────────────┐
│  BASE GAME  │ ─────────────────→ │  FREE GAME  │
│    (NG)     │                     │    (FG)     │
└─────────────┘ ←───────────────── └─────────────┘
                  Free Spin 用完
```

### 詳細流程

1. [NG] 玩家按 SPIN
2. [NG] 抽取 NG Outcome → 從 NG Pool 取盤面
3. [NG] 結算（檢查是否有 Scatter 觸發）
4. [NG] 如果 Scatter >= triggerCount：切換到 FG 模式
5. [FG] 自動執行 Free Spin
6. [FG] 抽取 FG Outcome → 從 FG Pool 取盤面
7. [FG] 結算（獎金 × Multiplier）
8. [FG] 檢查 Retrigger
9. [FG] 剩餘次數 > 0 → 回到步驟 5
10. [FG] 剩餘次數 = 0 → 返回 NG 模式

---

## 十、禁止事項（紅線）

1. **禁止雙專案** — 只能有一個 Vite App
2. **禁止 iframe** — 無跨視窗通訊
3. **禁止第二套 RNG** — Runtime 不得有亂數
4. **禁止第二套合約** — SpinPacket 是唯一介面
5. **禁止第二套 Wild 邏輯** — 只能在 settlement.ts
6. **禁止 NG/FG Pool 混用** — 必須分開
7. **禁止暫時方案** — 不做「之後再改」的設計

---

## 十一、版本紀錄

| 版本 | 日期 | 說明 |
|------|------|------|
| 1.0 | 2025-01-02 | 初始版本，完整架構定義 |
| 1.1 | 2025-01-04 | MVP 完成，所有功能已實作 |
| 2.0 | 2026-01-07 | V2 版本，新增 Wild/Scatter/Free Spin、NG/FG 分離、Firebase |

---

## 附錄：Store 規格

### useGameConfigStore

```typescript
interface GameConfigState {
  gameName: string;
  baseBet: number;
  boardConfig: BoardConfig;
  symbols: SymbolDefinition[];
  outcomeConfig: OutcomeConfig;
  linesConfig: LinesConfig;
  visualConfig: VisualConfig;
  freeSpinConfig: FreeSpinConfig;
  assets: AssetsPatch;
  currentSpinPacket: SpinPacket | null;
}
```

### useFreeSpinStore

```typescript
interface FreeSpinStoreState {
  mode: FreeSpinMode;
  remainingSpins: number;
  totalSpins: number;
  accumulatedWin: number;
  currentMultiplier: number;
  history: FreeSpinResult[];
}
```

### useAuthStore

```typescript
interface AuthState {
  user: User | null;
  status: 'loading' | 'authenticated' | 'guest';
  error: string | null;
}
```

### useSimulationStore

```typescript
interface SimulationState {
  isRunning: boolean;
  progress: number;
  mode: 'stack' | 'compare';
  results: SimulationResult[];
  compareResults: SimulationResult[][];
}
```

### useTemplateStore

```typescript
interface TemplateState {
  templates: Template[];
  currentTemplateId: string | null;
  isLoading: boolean;
  isSaving: boolean;
}
```
