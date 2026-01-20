# slot-ide MVP 總結文件

> 本文件為後續完整版專案開發的主要參考文件。

---

## 一、專案概述

### 什麼是 slot-ide MVP？

slot-ide 是一個**單頁 Slot IDE 工具**，讓使用者可以：
1. 設定老虎機數學（Outcome、倍率、權重、盤池）
2. 控制視覺動畫與素材
3. 進行單次 Spin 或大量 Simulation
4. 即時看到「與數學結果完全一致」的動畫盤面
5. 匯出統計結果與 CSV

### MVP 完成狀態

✅ **所有 6 個開發階段已完成**

| 階段 | 名稱 | 完成日期 |
|------|------|----------|
| Phase 0 | 地基文件 | 2025-01-02 |
| Phase 1 | 型別定義與專案初始化 | 2025-01-02 |
| Phase 2 | Math Engine 核心 | 2025-01-02 |
| Phase 3 | Runtime Renderer | 2025-01-03 |
| Phase 4 | IDE 介面串接 | 2025-01-03 |
| Phase 5 | Simulation 與 Analytics | 2025-01-03 |
| Phase 6 | 素材管理系統 | 2025-01-04 |

---

## 二、核心架構總覽

### 模組結構

```
┌─────────────────────────────────────────────────────────────┐
│                         IDE UI                               │
│  ┌─────────┬─────────┬─────────┬─────────┐                  │
│  │ Control │ Outcome │ Symbol  │ Asset   │  ...panels       │
│  │ Panel   │ Panel   │ Panel   │ Panel   │                  │
│  └────┬────┴────┬────┴────┬────┴────┬────┘                  │
│       │         │         │         │                        │
│       └─────────┴────┬────┴─────────┘                        │
│                      │                                       │
│                      ▼                                       │
│            ┌─────────────────┐                               │
│            │     Store       │  React Context + useReducer   │
│            │   (IDEState)    │                               │
│            └────────┬────────┘                               │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌───────────────┐
│ Math Engine  │ │ Runtime  │ │  Analytics    │
│              │ │ Renderer │ │               │
│ • Outcome    │ │          │ │ • Simulator   │
│ • Symbol     │ │ • Slot   │ │ • Statistics  │
│ • Lines      │ │   Machine│ │ • Charts      │
│ • Pool       │ │ • Reel   │ │ • CSV Export  │
│ • Settlement │ │ • Symbol │ │               │
└──────┬───────┘ └────▲─────┘ └───────────────┘
       │              │
       │  SpinPacket  │
       └──────────────┘
```

### 資料流（單向）

```
使用者操作 → IDE UI → Store → Math Engine → SpinPacket → Runtime Renderer
                                    ↓
                              Analytics（統計）
```

### 模組責任邊界

| 模組 | 責任 | 禁止事項 |
|------|------|----------|
| **types/** | 定義所有型別合約 | 不可有任何邏輯 |
| **engine/** | 產生盤面、結算、管理盤池 | 不可處理 UI、動畫 |
| **runtime/** | 播放動畫、渲染盤面 | 不可有 RNG、不可生成盤面 |
| **ide/** | 收集參數、觸發動作、顯示結果 | 不可直接修改 Engine 或 Renderer 狀態 |
| **analytics/** | 批次呼叫 Engine、統計、匯出 | 不可自己實作 spin 邏輯 |
| **store/** | 全域狀態管理 | 不可包含業務邏輯 |
| **utils/** | 純函式、localStorage 操作 | 不可依賴 React |

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
  reels: SymbolId[][];  // 5 輪，每輪 3 個符號
  cols: 5;
  rows: 3;
}

type SymbolId = string;  // 例如 "H1", "H2", "L1", "WILD"
```

### SymbolDefinition

```typescript
interface SymbolDefinition {
  id: SymbolId;
  name: string;
  category: 'high' | 'low' | 'special';
  payouts: {
    match3: number;
    match4: number;
    match5: number;
  };
  appearanceWeight: number;
}
```

### Outcome

```typescript
interface Outcome {
  id: string;
  name: string;
  multiplierRange: { min: number; max: number; };
  weight: number;
}
```

### VisualConfig

```typescript
interface VisualConfig {
  animation: {
    spinSpeed: number;        // 滾輪轉速
    spinDuration: number;     // 旋轉時長（ms）
    reelStopDelay: number;    // 停輪間隔（ms）
    easeStrength: number;     // 緩停力度（0-1）
    bounceStrength: number;   // 回彈力度（0-1）
  };
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
  symbols?: Record<SymbolId, string>;  // symbol -> base64 data URL
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
  winningLines: WinningLine[];
  bestLine?: WinningLine;
}

interface WinningLine {
  lineIndex: number;
  positions: [number, number][];
  symbol: SymbolId;
  count: number;
  payout: number;
}
```

---

## 四、核心演算法

### 盤池生成流程（Pool-based Generation）

```
1. 使用者定義 Outcomes（倍率區間 + 權重）
2. 為每個 Outcome 建立盤池：
   a. 隨機生成盤面
   b. 計算盤面倍率（best-line 結算）
   c. 若倍率落在該 Outcome 區間，加入盤池
   d. 重複直到達到 cap 上限
3. 盤池完成
```

### Spin 流程

```
1. 根據 Outcome 權重隨機抽取一個 Outcome
2. 從該 Outcome 的盤池中隨機抽取一個 Board
3. 執行 best-line 結算
4. 組裝 SpinPacket（board + visual + assets + meta）
5. 傳給 Runtime Renderer 播放動畫
```

### Best-line 結算邏輯

```
1. 遍歷所有 20 條線
2. 對每條線：
   a. 從左到右檢查連續相同符號數
   b. 查表得到該符號的分數
   c. 記錄中獎線資訊
3. 累加所有中獎線的分數
4. 找出最高分的線作為 bestLine
```

---

## 五、Store 狀態結構

```typescript
interface IDEState {
  // 盤池狀態
  isPoolsBuilt: boolean;
  poolStatus: PoolStatus[];
  
  // Spin 狀態
  currentSpinPacket: SpinPacket | null;
  isSpinning: boolean;
  
  // UI 狀態
  activeTab: 'math' | 'visual' | 'control' | 'assets';
  
  // 遊戲參數
  baseBet: number;
  simulationCount: number;
  
  // Simulation 狀態
  simulationConfig: { count: number; };
  simulationResult: SimulationResult | null;
  isSimulating: boolean;
  simulationProgress: number;
  
  // 視覺參數
  visualConfig: VisualConfig;
  
  // 素材
  assets: AssetsPatch;
}
```

### Action Types

```typescript
type IDEAction =
  | { type: 'SET_POOLS_BUILT'; payload: { status: PoolStatus[] } }
  | { type: 'SET_SPIN_PACKET'; payload: SpinPacket | null }
  | { type: 'SET_SPINNING'; payload: boolean }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'SET_BASE_BET'; payload: number }
  | { type: 'SET_SIMULATION_COUNT'; payload: number }
  | { type: 'SET_SIMULATION_RESULT'; payload: SimulationResult | null }
  | { type: 'SET_IS_SIMULATING'; payload: boolean }
  | { type: 'SET_SIMULATION_PROGRESS'; payload: number }
  | { type: 'RESET_SIMULATION' }
  | { type: 'SET_VISUAL_CONFIG'; payload: VisualConfig }
  | { type: 'SET_ASSETS'; payload: AssetsPatch }
  | { type: 'SET_SYMBOL_IMAGE'; symbolId: string; dataUrl: string }
  | { type: 'REMOVE_SYMBOL_IMAGE'; symbolId: string }
  | { type: 'SET_OTHER_ASSET'; key: AssetKey; dataUrl: string }
  | { type: 'REMOVE_OTHER_ASSET'; key: AssetKey }
  | { type: 'CLEAR_ALL_ASSETS' }
  | { type: 'LOAD_ASSETS'; assets: AssetsPatch };
```

---

## 六、經驗教訓（重要！）

### ✅ 已驗證可行的做法

1. **Pool-based generation** — 盤池抽樣是可行且穩定的
2. **單一資料合約** — SpinPacket 作為唯一介面，降低複雜度
3. **單線結算 + 多線累加** — best-line 作為核心結算邏輯是正確的
4. **分階段開發** — 每個 Phase 完成驗收後再進入下一階段
5. **React Context + useReducer** — 對 MVP 規模已足夠

### ❌ 已證實會造成問題的做法

1. **雙專案架構** — IDE + Runtime 分離會造成同步地獄
2. **iframe / postMessage** — 跨視窗通訊增加不必要的複雜度
3. **Visual Constraint Layer** — 第二套生成世界觀會造成混亂
4. **提前導入進階功能** — Wild / Scatter / Multi-win 應待核心完成後再議
5. **「暫時版本」心態** — 所有實作都應該是正式版

### 🔑 關鍵原則

1. **Runtime 永遠不生成盤面** — 只負責渲染 SpinPacket
2. **Math Engine 是唯一真相來源** — 所有結果都從這裡產生
3. **每次只做一件事** — 避免同時修改多個模組
4. **小 diff、可回退** — 每次提交都應該是可回退的

---

## 七、後續完整版開發建議

### 架構擴展方向

1. **前後端分離**
   - Math Engine → 後端 API
   - Runtime + IDE → 前端
   - SpinPacket 作為 API 回應格式

2. **資料庫整合**
   - Outcome / Symbol / Lines 設定存入資料庫
   - 盤池可考慮預先生成並快取
   - 素材改用雲端儲存（S3 等）

3. **狀態管理升級**
   - 若規模增大，考慮 Zustand / Redux Toolkit
   - Server State 可考慮 React Query / SWR

### 功能擴展方向

1. **進階符號**
   - Wild（萬用符號）
   - Scatter（散落符號）
   - Bonus（觸發特殊遊戲）

2. **進階玩法**
   - Free Spin（免費轉動）
   - Multiplier（倍率）
   - Progressive Jackpot

3. **UI/UX 增強**
   - 響應式設計
   - 主題切換
   - 多語言支援

4. **進階統計**
   - 歷史紀錄
   - 趨勢分析
   - A/B 測試支援

### 技術升級建議

| 層面 | MVP 做法 | 完整版建議 |
|------|----------|------------|
| 狀態管理 | React Context | Zustand / Redux Toolkit |
| API | 無 | REST / GraphQL |
| 資料庫 | localStorage | PostgreSQL / MongoDB |
| 素材儲存 | base64 in localStorage | 雲端儲存（S3） |
| 驗證 | 無 | JWT / OAuth |
| 部署 | 靜態檔案 | Docker / K8s |

---

## 八、檔案清單參考

### 型別定義（可直接複用）

- `src/types/board.ts` — Board 型別
- `src/types/outcome.ts` — Outcome 型別
- `src/types/symbol.ts` — Symbol 型別
- `src/types/lines.ts` — Lines 型別
- `src/types/visual.ts` — VisualConfig + AssetsPatch
- `src/types/spin-packet.ts` — SpinPacket 主合約

### 核心邏輯（可參考實作）

- `src/engine/outcome-manager.ts` — Outcome CRUD + 抽樣
- `src/engine/symbol-manager.ts` — Symbol CRUD + 抽樣
- `src/engine/lines-manager.ts` — Lines 配置
- `src/engine/pool-builder.ts` — 盤池生成
- `src/engine/settlement.ts` — Best-line 結算
- `src/engine/spin-executor.ts` — Spin 執行

### Runtime 元件（可參考動畫實作）

- `src/runtime/SlotMachine.tsx` — 主元件
- `src/runtime/Reel.tsx` — 單輪動畫
- `src/runtime/Symbol.tsx` — 符號渲染

### 統計分析（可參考統計邏輯）

- `src/analytics/simulator.ts` — 批次模擬
- `src/analytics/statistics.ts` — 統計計算
- `src/analytics/charts.tsx` — 圖表元件
- `src/analytics/csv-export.ts` — CSV 匯出

---

## 九、快速啟動新專案

```bash
# 1. 複製本專案作為參考
git clone <this-repo> slot-ide-reference

# 2. 建立新專案
npm create vite@latest slot-ide-v2 -- --template react-ts

# 3. 複製型別定義
cp -r slot-ide-reference/src/types slot-ide-v2/src/

# 4. 參考架構文件開始開發
# - README_ARCHITECTURE.md
# - AI_GUIDE.md
# - MVP_SUMMARY.md（本文件）
```

---

## 十、聯絡與維護

- **專案狀態**: MVP 完成（2025-01-04）
- **用途**: 作為後續完整版開發的參考範本
- **維護**: 本專案不再進行功能開發，僅作為參考

