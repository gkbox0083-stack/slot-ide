# slot-ide 架構規格書 V3（README_ARCHITECTURE.md）

本文件是專案的「北極星」，定義產品應該長什麼樣子。
所有設計決策衝突，以本文件為最終裁決依據。

> **V3 簡化版說明**：經過 P2 階段的重新設計，移除 Free Spin 機制，
> 改為 Scatter 直接賦值模式。移除 NG/FG 分離，改為單一 Outcome 列表。

---

## 一、產品定位

### 是什麼
- 單頁 Slot IDE 工具
- 內建 Runtime Renderer
- 面向 Slot 遊戲設計師與數學驗證人員
- 支援 Wild/Scatter 符號
- 提供用戶系統與雲端模板管理（P3 實作）

### 不是什麼
- 不是正式遊戲產品
- 不是多視窗應用
- 不是需要自建後端的系統（使用 Firebase）

---

## 二、技術架構

### 技術棧
- Vite + React + TypeScript
- 單一 SPA（Single Page Application）
- Firebase（Auth + Firestore + Storage）— P3 實作
- Zustand 狀態管理
- 本地儲存（localStorage）用於訪客模式

### 專案結構

```
slot-ide/
├── AI_GUIDE.md              # AI 指南 V3
├── README_ARCHITECTURE.md   # 本文件（北極星）
├── PRD_SLOT_IDE_V2.md       # 產品需求規格書
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── prompts/                 # 任務文件
│   ├── P1-01_type_definitions.md
│   └── ...
└── src/
    ├── main.tsx             # 進入點
    ├── App.tsx              # 主應用
    │
    ├── types/               # 型別定義（合約層）
    │   ├── index.ts
    │   ├── spin-packet.ts   # SpinPacket v3 主合約
    │   ├── outcome.ts       # Outcome 定義（單一列表）
    │   ├── symbol.ts        # Symbol 定義（含 Wild/Scatter）
    │   ├── board.ts         # Board 定義（支援 5x3/5x4）
    │   ├── lines.ts         # Lines 定義
    │   └── visual.ts        # VisualConfig + AssetsPatch
    │
    ├── engine/              # Math Engine（數學層）
    │   ├── index.ts
    │   ├── outcome-manager.ts
    │   ├── symbol-manager.ts
    │   ├── lines-manager.ts
    │   ├── pool-builder.ts  # 單一 Pool（均勻分布）
    │   ├── spin-executor.ts # 單次 Spin 執行
    │   ├── settlement.ts    # Wild 結算 + Scatter 直接賦值
    │   └── rtp-calculator.ts # RTP 計算（Line + Scatter）
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
    │   │   ├── IDELayoutV2.tsx   # 三欄式主佈局
    │   │   ├── ControlPanelV2.tsx
    │   │   ├── GameControlV2.tsx
    │   │   └── StatisticsPanelV2.tsx
    │   └── panels/
    │       ├── OutcomePanel.tsx   # 單一 Outcome 列表
    │       ├── SymbolPanel.tsx    # Wild/Scatter 設定
    │       ├── LinesPanel.tsx     # 視覺化線路編輯
    │       ├── AnimationPanel.tsx
    │       ├── LayoutPanel.tsx
    │       ├── AssetPanel.tsx
    │       ├── PoolPanel.tsx
    │       ├── BettingPanel.tsx
    │       ├── SimulationPanel.tsx
    │       └── HistoryPanel.tsx
    │
    ├── analytics/           # 統計分析
    │   ├── index.ts
    │   ├── simulator.ts
    │   ├── charts.tsx
    │   └── csv-export.ts
    │
    ├── store/               # 狀態管理
    │   ├── index.ts
    │   ├── useGameConfigStore.ts  # V3 版本
    │   ├── useUIStore.ts
    │   └── useSimulationStore.ts
    │
    ├── firebase/            # Firebase 整合（P3 實作）
    │   ├── config.ts
    │   ├── auth.ts
    │   ├── firestore.ts
    │   └── storage.ts
    │
    └── utils/               # 工具函式
        ├── index.ts
        └── asset-storage.ts
```

---

## 三、核心資料合約

### SpinPacket v3（唯一主幹）

```typescript
interface SpinPacket {
  version: '2' | '3';        // 支援向下相容
  board: Board;              // 5x3 或 5x4 盤面
  visual: VisualConfig;      // 動畫參數
  assets?: AssetsPatch;      // 素材覆蓋
  meta?: SettlementMeta;     // 結算資訊
  isDemo?: boolean;          // 展示模式
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

### Symbol（V3 版本）

```typescript
type SymbolType = 'normal' | 'wild' | 'scatter';
type SymbolCategory = 'high' | 'low';

interface WildConfig {
  canReplaceNormal: boolean;   // 預設 true
  canReplaceSpecial: boolean;  // 預設 false
}

interface ScatterPayoutConfig {
  minCount: number;            // 最少需要幾個（預設 3）
  payoutByCount: {             // 根據數量直接給分（倍率）
    3?: number;
    4?: number;
    5?: number;
    6?: number;                // 支援 5x4 盤面
  };
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
  // 視覺層權重
  appearanceWeight: number;    // 只用於滾動動畫
  // @deprecated 以下欄位保留供向下相容，不影響 Pool 生成
  ngWeight: number;
  fgWeight: number;
  // 特殊符號設定
  wildConfig?: WildConfig;
  scatterPayoutConfig?: ScatterPayoutConfig;
}
```

### Outcome（V3 簡化版）

```typescript
interface Outcome {
  id: string;
  name: string;
  multiplierRange: {
    min: number;
    max: number;
  };
  weight: number;              // 抽中權重
}

// V3: 單一列表，不再區分 NG/FG
type OutcomeConfig = Outcome[];
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
    backgroundTransform?: { offsetX: number; offsetY: number; scale: number };
    boardContainerTransform?: { offsetX: number; offsetY: number; scale: number };
    characterTransform?: { offsetX: number; offsetY: number; scale: number };
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

### SettlementMeta（V3 版本）

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
  phase: 'base';               // V3: 固定為 'base'
  win: number;                 // 連線 + Scatter 總分
  multiplier: number;          // V3: 固定為 1
  winningLines: WinningLine[];
  bestLine?: WinningLine;
  scatterCount: number;
  scatterPayout?: number;      // V3 新增：Scatter 直接得分
  triggeredFreeSpin: boolean;  // V3: 永遠為 false
}
```

---

## 四、雙層機率模型

### 核心概念

```
┌─────────────────────────────────────────────────────────────┐
│  雙層機率模型（V3 版本）                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  【數學層】→ 影響 RTP                                        │
│  ├─ Outcome 權重：直接決定抽中哪個倍率區間                    │
│  ├─ Pool 生成：均勻分布（不使用符號權重）                     │
│  └─ Scatter 賦值表：根據數量直接給分                         │
│                                                             │
│  【視覺層】→ 不影響 RTP                                      │
│  └─ Symbol appearanceWeight：只影響滾動動畫中的符號分布       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 關鍵原則

- Pool Builder 使用**均勻分布**，不使用 ngWeight/fgWeight
- `appearanceWeight` 只用於 Runtime 滾動動畫
- RTP 計算 = Line RTP + Scatter RTP

---

## 五、RTP 計算公式（V3 版本）

### 理論 RTP

```
總 RTP = Line RTP + Scatter RTP

Line RTP = Σ(Outcome 權重 × 平均倍率) × 100%

Scatter RTP = Σ(P(count) × payout[count]) × 100%
其中 P(count) = 二項分布機率，基於均勻分布
```

---

## 六、模組責任邊界

| 模組 | 可以做 | 不可以做 |
|------|--------|----------|
| **Math Engine** | 產生盤面（均勻分布）、結算、管理盤池、Wild 替代邏輯、Scatter 直接賦值 | 處理動畫、修改 UI |
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
│ Math Engine │  產生結果（含 Wild 結算、Scatter 直接賦值）
└──────┬──────┘
       │ SpinPacket v3
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

## 九、Scatter 直接賦值規則（V3 新增）

### 結算邏輯

1. 計算盤面上 Scatter 符號的數量
2. 如果數量 >= `scatterPayoutConfig.minCount`
3. 根據數量從 `payoutByCount` 查表取得倍率
4. 最終得分 = 倍率 × baseBet

### 與 Free Spin 的差異

| 項目 | V2 Free Spin | V3 直接賦值 |
|------|--------------|-------------|
| 機制 | 觸發額外遊戲回合 | 直接給分 |
| 複雜度 | 高（需要狀態機） | 低（單次結算） |
| RTP 計算 | 需要計算預期價值 | 直接套用賠率表 |

---

## 十、禁止事項（紅線）

1. **禁止雙專案** — 只能有一個 Vite App
2. **禁止 iframe** — 無跨視窗通訊
3. **禁止第二套 RNG** — Runtime 不得有亂數
4. **禁止第二套合約** — SpinPacket 是唯一介面
5. **禁止第二套 Wild 邏輯** — 只能在 settlement.ts
6. **禁止暫時方案** — 不做「之後再改」的設計
7. **禁止符號權重影響 Pool** — Pool 生成必須使用均勻分布
8. **禁止重新加入 Free Spin** — V3 已移除此機制

---

## 十一、版本紀錄

| 版本 | 日期 | 說明 |
|------|------|------|
| 1.0 | 2025-01-02 | 初始版本，完整架構定義 |
| 2.0 | 2026-01-07 | V2 版本，新增 Wild/Scatter/Free Spin、NG/FG 分離、Firebase |
| 3.0 | 2026-01-20 | V3 簡化版，移除 Free Spin、移除 NG/FG 分離、Scatter 改為直接賦值 |

---

## 附錄：Store 規格（V3 版本）

### useGameConfigStore

```typescript
interface GameConfigState {
  gameName: string;
  baseBet: number;
  balance: number;
  boardConfig: BoardConfig;
  symbols: SymbolDefinition[];
  outcomes: Outcome[];          // V3: 單一列表
  linesConfig: LinesConfig;
  visualConfig: VisualConfig;
  assets: AssetsPatch;
  currentSpinPacket: SpinPacket | null;
  pools: Map<string, Board[]>;
  isPoolsBuilt: boolean;
}
```

### useSimulationStore

```typescript
interface SimulationState {
  isRunning: boolean;
  progress: number;
  results: SimulationResult[];
}
```

### useAuthStore（P3 實作）

```typescript
interface AuthState {
  user: User | null;
  status: 'loading' | 'authenticated' | 'guest';
  error: string | null;
}
```

### useTemplateStore（P3 實作）

```typescript
interface TemplateState {
  templates: Template[];
  currentTemplateId: string | null;
  isLoading: boolean;
  isSaving: boolean;
}
```
