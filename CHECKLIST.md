# slot-ide 驗收清單（Acceptance Checklist）

> ✅ **MVP 完成** — 所有驗收項目已通過（2025-01-04）

本文件記錄每個 Phase 的驗收清單，可作為後續專案的參考。

---

## Phase 1：型別定義與專案初始化 ✅

### 專案骨架
- [x] `npm install` 成功
- [x] `npm run dev` 可啟動
- [x] 瀏覽器顯示 "slot-ide"

### 型別定義
- [x] `src/types/index.ts` 存在且可 export 所有型別
- [x] `SpinPacket` 包含 version / board / visual / assets / meta
- [x] `Board` 包含 reels / cols / rows
- [x] `Outcome` 包含 id / name / multiplierRange / weight
- [x] `SymbolDefinition` 包含 id / name / category / payouts / appearanceWeight
- [x] `LinesConfig` 包含 count / patterns
- [x] `VisualConfig.animation` 包含 5 個參數
- [x] `VisualConfig.layout` 包含 3 個參數
- [x] `AssetsPatch` 包含 5 種素材欄位

### 品質檢查
- [x] 無 `any` 型別
- [x] `npx tsc --noEmit` 無錯誤

---

## Phase 2：Math Engine 核心 ✅

### Outcome Manager
- [x] 可新增 Outcome
- [x] 可修改 Outcome
- [x] 可刪除 Outcome
- [x] Outcome 結構符合型別定義

### Symbol Manager
- [x] 可新增 Symbol
- [x] 可修改 Symbol（分數、機率）
- [x] 可刪除 Symbol

### Lines Manager
- [x] 可設定線數
- [x] 可定義線的排列方式

### Pool Builder
- [x] 可為每個 Outcome 生成盤池
- [x] 盤池有 cap 限制
- [x] 生成的盤面倍率落在指定區間

### Spin Executor
- [x] 可執行單次 Spin
- [x] Spin 結果包含完整 SpinPacket

### Settlement
- [x] Best-line 結算邏輯正確
- [x] 結算結果包含 lineIndex / positions / symbol / count

### 數據驗證
- [x] 1000 次 spin，RTP 趨近預期值（±5%）
- [x] HitRate 趨近預期值

---

## Phase 3：Runtime Renderer ✅

### 元件結構
- [x] `SlotMachine` 元件存在
- [x] `Reel` 元件存在
- [x] `Symbol` 元件存在

### 動畫功能
- [x] 接收 SpinPacket 後可播放動畫
- [x] 動畫速度由 `visual.animation.spinSpeed` 控制
- [x] 動畫時長由 `visual.animation.spinDuration` 控制
- [x] 停輪間隔由 `visual.animation.reelStopDelay` 控制
- [x] 緩停效果由 `visual.animation.easeStrength` 控制
- [x] 回彈效果由 `visual.animation.bounceStrength` 控制

### 視覺功能
- [x] 卷軸間距由 `visual.layout.reelGap` 控制
- [x] 圖示縮放由 `visual.layout.symbolScale` 控制
- [x] 盤面縮放由 `visual.layout.boardScale` 控制

### 核心驗證
- [x] 最終停輪與 `board` 完全一致
- [x] Runtime 不含任何 RNG（僅視覺用假符號除外）
- [x] Runtime 不修改 SpinPacket

---

## Phase 4：IDE 介面串接 ✅

### 佈局
- [x] 左側顯示 Runtime
- [x] 右側顯示控制面板
- [x] 面板可切換（數學 / 視覺 / 控制 / 素材）

### 數學面板
- [x] GameParamsPanel 可設定 Base Bet
- [x] OutcomePanel 可編輯 Outcome
- [x] SymbolPanel 可編輯 Symbol
- [x] LinesPanel 可編輯 Lines

### 視覺面板
- [x] AnimationPanel 可調整 5 個動態參數
- [x] LayoutPanel 可調整 3 個盤面視覺參數

### 控制面板
- [x] Build Pools 按鈕可用
- [x] Spin 按鈕可用
- [x] Simulation 次數可設定

### 串接驗證
- [x] 點擊 Spin → Runtime 播放正確動畫
- [x] 調整動畫參數 → 即時反映
- [x] 資料流：Math → SpinPacket → Runtime

---

## Phase 5：Simulation 與 Analytics ✅

### Simulator
- [x] 可執行 N 次批次 Spin
- [x] 使用 Math Engine 的 spin（非另起邏輯）
- [x] 支援進度回報
- [x] 支援中止功能

### 統計計算
- [x] RTP 計算正確
- [x] Hit Rate 計算正確
- [x] Avg Win 計算正確
- [x] Total Spins 計算正確
- [x] Total Win 計算正確
- [x] Max / Min Win 計算正確
- [x] Outcome 分佈計算正確

### 圖表顯示
- [x] 輸贏分折線圖可顯示
- [x] 離散圖可顯示

### 匯出
- [x] CSV 可下載
- [x] 詳細報表正確
- [x] 摘要報表正確
- [x] 完整報表正確

---

## Phase 6：素材管理系統 ✅

### 素材儲存工具
- [x] saveAssets 可儲存素材
- [x] loadAssets 可讀取素材
- [x] clearAssets 可清除素材
- [x] fileToDataUrl 可轉換檔案
- [x] saveSymbolImage / removeSymbolImage 可用
- [x] saveOtherAsset / removeOtherAsset 可用

### 素材上傳
- [x] Symbol 圖片可上傳（數量與 Symbol 種類連動）
- [x] 盤面底圖可上傳
- [x] 盤面框可上傳
- [x] 背景可上傳
- [x] 人物可上傳

### 素材反映
- [x] 上傳後立即顯示於 Runtime
- [x] 素材儲存於 localStorage
- [x] 頁面重新整理後素材仍在
- [x] 可清除單一素材
- [x] 可清除所有素材

### 渲染層
- [x] 背景層正確顯示（z-index: 0）
- [x] 盤面底圖層正確顯示（z-index: 1）
- [x] Reels 層正確顯示（z-index: 2）
- [x] 盤面框層正確顯示（z-index: 3）
- [x] 人物層正確顯示（z-index: 4）
- [x] 中獎線層正確顯示（z-index: 5）

### 最終驗證
- [x] 完整產品可獨立運作
- [x] 無第二套生成邏輯
- [x] 符合 README_ARCHITECTURE.md 所有規格

---

## 通用檢查（P0 Gate）✅

### 架構不可變條件
- [x] 只有一個 Vite + React App
- [x] 無 iframe
- [x] 無 postMessage
- [x] 只有 Math Engine 有亂數邏輯
- [x] SpinPacket 是唯一資料介面
- [x] Runtime 不生成盤面、不結算

### 程式碼品質
- [x] 無 `any` 型別
- [x] 無遺留 TODO hack
- [x] `npm run build` 成功

### 功能回歸
- [x] 所有 types/ 檔案可 import
- [x] 資料流正確（Math → SpinPacket → Runtime）
- [x] 既有功能正常

---

## 驗收完成總結

| Phase | 項目數 | 通過數 | 狀態 |
|-------|--------|--------|------|
| Phase 1 | 14 | 14 | ✅ |
| Phase 2 | 14 | 14 | ✅ |
| Phase 3 | 13 | 13 | ✅ |
| Phase 4 | 14 | 14 | ✅ |
| Phase 5 | 15 | 15 | ✅ |
| Phase 6 | 22 | 22 | ✅ |
| P0 Gate | 12 | 12 | ✅ |

**總計: 104 項 / 104 項通過**
