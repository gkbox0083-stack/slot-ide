# slot-ide 驗收清單（Acceptance Checklist）

本文件提供每個 Phase 的驗收清單，完成後逐項打勾。
**所有項目通過後，才能進入 P0 Gate。**

---

## 使用方式

1. 複製對應 Phase 的清單
2. 逐項驗證並打勾
3. 全部通過 → 進入 P0 Gate
4. 有失敗 → 修復後重新驗證

---

## Phase 1：型別定義與專案初始化

### 專案骨架
- [ ] `npm install` 成功
- [ ] `npm run dev` 可啟動
- [ ] 瀏覽器顯示 "slot-ide"

### 型別定義
- [ ] `src/types/index.ts` 存在且可 export 所有型別
- [ ] `SpinPacket` 包含 version / board / visual / assets / meta
- [ ] `Board` 包含 reels / cols / rows
- [ ] `Outcome` 包含 id / name / multiplierRange / weight
- [ ] `SymbolDefinition` 包含 id / name / category / payouts / appearanceWeight
- [ ] `LinesConfig` 包含 count / patterns
- [ ] `VisualConfig.animation` 包含 5 個參數
- [ ] `VisualConfig.layout` 包含 3 個參數
- [ ] `AssetsPatch` 包含 5 種素材欄位

### 品質檢查
- [ ] 無 `any` 型別
- [ ] `npx tsc --noEmit` 無錯誤

---

## Phase 2：Math Engine 核心

### Outcome Manager
- [ ] 可新增 Outcome
- [ ] 可修改 Outcome
- [ ] 可刪除 Outcome
- [ ] Outcome 結構符合型別定義

### Symbol Manager
- [ ] 可新增 Symbol
- [ ] 可修改 Symbol（分數、機率）
- [ ] 可刪除 Symbol

### Lines Manager
- [ ] 可設定線數
- [ ] 可定義線的排列方式

### Pool Builder
- [ ] 可為每個 Outcome 生成盤池
- [ ] 盤池有 cap 限制
- [ ] 生成的盤面倍率落在指定區間

### Spin Executor
- [ ] 可執行單次 Spin
- [ ] Spin 結果包含完整 SpinPacket

### Settlement
- [ ] Best-line 結算邏輯正確
- [ ] 結算結果包含 lineIndex / positions / symbol / count

### 數據驗證
- [ ] 1000 次 spin，RTP 趨近預期值（±5%）
- [ ] HitRate 趨近預期值

---

## Phase 3：Runtime Renderer

### 元件結構
- [ ] `SlotMachine` 元件存在
- [ ] `Reel` 元件存在
- [ ] `Symbol` 元件存在

### 動畫功能
- [ ] 接收 SpinPacket 後可播放動畫
- [ ] 動畫速度由 `visual.animation.spinSpeed` 控制
- [ ] 動畫時長由 `visual.animation.spinDuration` 控制
- [ ] 停輪間隔由 `visual.animation.reelStopDelay` 控制
- [ ] 緩停效果由 `visual.animation.easeStrength` 控制
- [ ] 回彈效果由 `visual.animation.bounceStrength` 控制

### 視覺功能
- [ ] 卷軸間距由 `visual.layout.reelGap` 控制
- [ ] 圖示縮放由 `visual.layout.symbolScale` 控制
- [ ] 盤面縮放由 `visual.layout.boardScale` 控制

### 核心驗證
- [ ] 最終停輪與 `board` 完全一致
- [ ] Runtime 不含任何 RNG
- [ ] Runtime 不修改 SpinPacket

---

## Phase 4：IDE 介面串接

### 佈局
- [ ] 左側顯示 Runtime
- [ ] 右側顯示控制面板
- [ ] 面板可切換（數學 / 視覺 / 素材）

### 數學面板
- [ ] GameParamsPanel 可設定 Base Bet
- [ ] OutcomePanel 可編輯 Outcome
- [ ] SymbolPanel 可編輯 Symbol
- [ ] LinesPanel 可編輯 Lines

### 視覺面板
- [ ] AnimationPanel 可調整 5 個動態參數
- [ ] LayoutPanel 可調整 3 個盤面視覺參數

### 控制面板
- [ ] Build Pools 按鈕可用
- [ ] Spin 按鈕可用
- [ ] Simulation 次數可設定

### 串接驗證
- [ ] 點擊 Spin → Runtime 播放正確動畫
- [ ] 調整動畫參數 → 即時反映
- [ ] 資料流：Math → SpinPacket → Runtime

---

## Phase 5：Simulation 與 Analytics

### Simulator
- [ ] 可執行 N 次批次 Spin
- [ ] 使用 Math Engine 的 spin（非另起邏輯）

### 統計計算
- [ ] RTP 計算正確
- [ ] Hit Rate 計算正確
- [ ] Avg Win 計算正確
- [ ] Total Spins 計算正確
- [ ] Total Win 計算正確

### 圖表顯示
- [ ] 輸贏分折線圖可顯示
- [ ] 離散圖可顯示

### 匯出
- [ ] CSV 可下載
- [ ] CSV 內容正確

---

## Phase 6：素材與完善

### 素材上傳
- [ ] Symbol 圖片可上傳（數量與 Symbol 種類連動）
- [ ] 盤面底圖可上傳
- [ ] 盤面框可上傳
- [ ] 背景可上傳
- [ ] 人物可上傳

### 素材反映
- [ ] 上傳後立即顯示於 Runtime
- [ ] 素材儲存於 localStorage

### 最終驗證
- [ ] 完整產品可獨立運作
- [ ] 無第二套生成邏輯
- [ ] 符合 README_ARCHITECTURE.md 所有規格

---

## 通用檢查（每個 Phase 結束時）

- [ ] 只修改了指定範圍的檔案
- [ ] diff 最小化
- [ ] 無新增 `any` 型別
- [ ] 無新增 TODO hack
- [ ] `npm run build` 成功
