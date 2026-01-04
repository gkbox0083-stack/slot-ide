# slot-ide 開發階段規劃（Development Phases）

本文件定義專案的分階段開發計畫。
每個階段都有明確的範圍、交付物與驗收條件。

---

## Phase 0：地基文件 ✅

### 目標
建立專案基礎文件與資料夾結構

### 交付物
- [x] AI_GUIDE.md
- [x] SYSTEM_PROMPT.md
- [x] README_ARCHITECTURE.md
- [x] EXECUTION_PROMPT.md
- [x] .cursorrules
- [x] PHASES.md（本文件）

### 驗收條件
- 所有文件已建立
- 資料夾結構符合 README_ARCHITECTURE.md

---

## Phase 1：型別定義與專案初始化 ✅

### 目標
建立 Vite + React 專案骨架與核心型別定義

### 範圍
```
slot-ide/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    └── types/
        ├── index.ts
        ├── spin-packet.ts
        ├── outcome.ts
        ├── symbol.ts
        ├── board.ts
        ├── lines.ts
        └── visual.ts
```

### 交付物
- [x] Vite + React + TypeScript 專案可啟動
- [x] SpinPacket 型別定義完成
- [x] Board 型別定義完成
- [x] Outcome 型別定義完成
- [x] SymbolDefinition 型別定義完成（種類、分數、出現機率）
- [x] LinesConfig 型別定義完成（線數、排列方式）
- [x] VisualConfig 型別定義完成（動態參數 + 盤面視覺）
- [x] AssetsPatch 型別定義完成（5 種素材）

### 驗收條件
- [x] `npm run dev` 可啟動
- [x] 型別可被 import 且無編譯錯誤
- [x] 無 `any` 型別

---

## Phase 2：Math Engine 核心 ✅

### 目標
實作數學引擎核心功能

### 範圍
```
src/engine/
├── index.ts
├── outcome-manager.ts
├── symbol-manager.ts
├── lines-manager.ts
├── pool-builder.ts
├── spin-executor.ts
└── settlement.ts
```

### 交付物
- [x] Outcome 管理（CRUD）
- [x] Symbol 管理（CRUD + 權重抽樣）
- [x] Lines 管理（20 條線配置）
- [x] Pool 建立邏輯（含 cap 限制）
- [x] Spin 執行（抽 Outcome → 抽 Board → 結算）
- [x] Best-line 結算（支援多線累加）

### 驗收條件
- [x] 用 console 驗證 spin 結果正確
- [x] 多次 spin 的 RTP 趨近預期值
- [x] 無第二套 RNG 或結算邏輯

---

## Phase 3：Runtime Renderer ✅

### 目標
實作只讀的動畫渲染器

### 範圍
```
src/runtime/
├── index.ts
├── SlotMachine.tsx
├── Reel.tsx
└── Symbol.tsx
```

### 交付物
- [x] SlotMachine 元件接收 SpinPacket
- [x] Reel 動畫播放（spinning → stopping → stopped）
- [x] 最終停輪與 board 完全一致
- [x] 動畫參數由 VisualConfig 控制
- [x] 中獎線高亮與循環顯示

### 驗收條件
- [x] 用 SpinPacket 測試動畫正確
- [x] Runtime 不含任何 RNG
- [x] Runtime 不修改 SpinPacket

---

## Phase 4：IDE 介面串接 🔄

### 目標
將 Math Engine 與 Runtime 串接到正式 IDE UI

### 範圍
```
src/ide/
├── index.ts
├── panels/
│   ├── GameParamsPanel.tsx    # Base Bet 設定
│   ├── OutcomePanel.tsx       # Outcome CRUD
│   ├── SymbolPanel.tsx        # Symbol 編輯
│   ├── LinesPanel.tsx         # Lines 設定
│   ├── AnimationPanel.tsx     # 動畫參數
│   ├── LayoutPanel.tsx        # 盤面視覺
│   └── ControlPanel.tsx       # Build / Spin / Simulation
└── layout/
    └── IDELayout.tsx

src/store/
└── index.ts
```

### 子任務分解
| Prompt | 目標 | 狀態 |
|--------|------|------|
| 4-1 | IDE 佈局骨架 + Store 基礎 | ⏳ 待開始 |
| 4-2 | ControlPanel 實作 | ⏳ 待開始 |
| 4-3 | OutcomePanel 實作 | ⏳ 待開始 |
| 4-4 | SymbolPanel 實作 | ⏳ 待開始 |
| 4-5 | AnimationPanel + LayoutPanel | ⏳ 待開始 |
| 4-6 | 整合驗證 | ⏳ 待開始 |

### 交付物
- [ ] IDE 佈局（左側 Runtime + 右側面板）
- [ ] Tab 切換（數學 / 視覺 / 控制）
- [ ] GameParamsPanel（Base Bet 設定）
- [ ] OutcomePanel（Outcome CRUD）
- [ ] SymbolPanel（Symbol 編輯）
- [ ] LinesPanel（Lines 設定）
- [ ] AnimationPanel（5 個動畫參數）
- [ ] LayoutPanel（3 個盤面視覺參數）
- [ ] ControlPanel（Build Pools / Spin）
- [ ] Store 狀態管理

### 驗收條件
- [ ] 點擊 Spin → 動畫正確播放
- [ ] 調整動畫參數 → 即時反映
- [ ] 調整數學參數 → 重新 Build Pools 後生效
- [ ] 資料流符合 Math → SpinPacket → Runtime

---

## Phase 5：Simulation 與 Analytics

### 目標
實作批次模擬與統計分析

### 範圍
```
src/analytics/
├── index.ts
├── simulator.ts
├── charts.tsx
└── csv-export.ts
```

### 交付物
- [ ] N 次 Spin 批次執行
- [ ] RTP / HitRate / AvgWin 計算
- [ ] 圖表顯示（折線圖、離散圖）
- [ ] CSV 匯出

### 驗收條件
- Simulation 使用 Math Engine 的 spin（非另起邏輯）
- 統計數據正確
- CSV 可下載

---

## Phase 6：素材與完善

### 目標
完成素材上傳與最終打磨

### 範圍
```
src/ide/panels/AssetPanel.tsx
src/runtime/Symbol.tsx
```

### 交付物
- [ ] Symbol 圖片上傳（與 Symbol 種類連動）
- [ ] 盤面底圖 / 框架 / 背景 / 人物上傳
- [ ] 素材即時反映到 Runtime

### 驗收條件
- 上傳素材後立即顯示
- 素材儲存於 localStorage
- 完整產品可獨立運作

---

## 階段總覽

| Phase | 名稱 | 狀態 |
|-------|------|------|
| 0 | 地基文件 | ✅ 完成 |
| 1 | 型別定義與專案初始化 | ✅ 完成 |
| 2 | Math Engine 核心 | ✅ 完成 |
| 3 | Runtime Renderer | ✅ 完成 |
| 4 | IDE 介面串接 | 🔄 進行中 |
| 5 | Simulation 與 Analytics | ⏳ 待開始 |
| 6 | 素材與完善 | ⏳ 待開始 |

---

## 注意事項

- 每個 Phase 完成後，需經過驗收再進入下一階段
- 不可跨階段開發（例如 Phase 2 未完成就做 Phase 4）
- 遇到架構疑問，回到 README_ARCHITECTURE.md 查閱