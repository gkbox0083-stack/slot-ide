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

## Phase 1：型別定義與專案初始化

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
- [ ] Vite + React + TypeScript 專案可啟動
- [ ] SpinPacket 型別定義完成
- [ ] Board 型別定義完成
- [ ] Outcome 型別定義完成
- [ ] SymbolDefinition 型別定義完成（種類、分數、出現機率）
- [ ] LinesConfig 型別定義完成（線數、排列方式）
- [ ] VisualConfig 型別定義完成（動態參數 + 盤面視覺）
- [ ] AssetsPatch 型別定義完成（5 種素材）

### 驗收條件
- `npm run dev` 可啟動
- 型別可被 import 且無編譯錯誤
- 無 `any` 型別

---

## Phase 2：Math Engine 核心

### 目標
實作數學引擎核心功能

### 範圍
```
src/engine/
├── index.ts
├── outcome-manager.ts
├── pool-builder.ts
├── spin-executor.ts
└── settlement.ts
```

### 交付物
- [ ] Outcome 管理（CRUD）
- [ ] Pool 建立邏輯
- [ ] Spin 執行（抽 Outcome → 抽 Board → 結算）
- [ ] Best-line 結算

### 驗收條件
- 用 console 驗證 spin 結果正確
- 多次 spin 的 RTP 趨近預期值
- 無第二套 RNG 或結算邏輯

---

## Phase 3：Runtime Renderer

### 目標
實作只讀的動畫渲染器

### 範圍
```
src/runtime/
├── index.ts
├── SlotMachine.tsx
├── Reel.tsx
├── Symbol.tsx
└── animations.ts
```

### 交付物
- [ ] SlotMachine 元件接收 SpinPacket
- [ ] Reel 動畫播放
- [ ] 最終停輪與 board 完全一致
- [ ] 動畫參數由 VisualConfig 控制

### 驗收條件
- 用假 SpinPacket 測試動畫正確
- Runtime 不含任何 RNG
- Runtime 不修改 SpinPacket

---

## Phase 4：IDE 介面串接

### 目標
將 Math Engine 與 Runtime 串接到 UI

### 範圍
```
src/ide/
├── index.ts
├── panels/
│   ├── OutcomePanel.tsx
│   ├── VisualPanel.tsx
│   ├── AssetPanel.tsx
│   └── ControlPanel.tsx
└── layout/
    └── IDELayout.tsx

src/store/
└── index.ts
```

### 交付物
- [ ] IDE 佈局（左側 Runtime + 右側面板）
- [ ] Outcome 編輯面板
- [ ] Build Pools / Spin 按鈕
- [ ] 動畫參數調整面板

### 驗收條件
- 點擊 Spin → 動畫正確播放
- 調整動畫參數 → 即時反映
- 資料流符合 Math → SpinPacket → Runtime

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
- [ ] 圖表顯示
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
- [ ] Symbol 圖片上傳
- [ ] 背景 / 框架上傳
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
| 1 | 型別定義與專案初始化 | ⏳ 待開始 |
| 2 | Math Engine 核心 | ⏳ 待開始 |
| 3 | Runtime Renderer | ⏳ 待開始 |
| 4 | IDE 介面串接 | ⏳ 待開始 |
| 5 | Simulation 與 Analytics | ⏳ 待開始 |
| 6 | 素材與完善 | ⏳ 待開始 |

---

## 注意事項

- 每個 Phase 完成後，需經過驗收再進入下一階段
- 不可跨階段開發（例如 Phase 2 未完成就做 Phase 4）
- 遇到架構疑問，回到 README_ARCHITECTURE.md 查閱