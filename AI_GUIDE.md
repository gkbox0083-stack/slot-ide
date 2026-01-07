# slot-ide 專案 AI 指南 V2（Restart Playbook）

本文件是為「**下一個 AI**」所撰寫。
請在開始任何實作前完整閱讀，並將本文件視為專案的最高指導原則之一。

---

## 一、專案目標（North Star）

### 一句話版本
slot-ide 是一個 **單頁 Slot IDE**，讓使用者可以：

1. 設定老虎機數學（Outcome、倍率區間、權重、盤池）
2. 設定特殊符號（Wild、Scatter）與 Free Spin 機制
3. 控制視覺動畫與素材
4. 進行單次 Spin 或大量 Simulation
5. 即時看到「與數學結果完全一致」的動畫盤面
6. 登入後可儲存模板到雲端
7. 匯出統計結果與 CSV

所有行為必須是 **可重現、可理解、IDE 驅動**。

---

## 二、V2 新增功能概覽

| 功能 | 說明 |
|------|------|
| Wild 符號 | 替代一般符號（不可替代特殊符號） |
| Scatter 符號 | 觸發 Free Spin |
| Free Spin 機制 | 獨立 FG Outcomes、Retrigger、Multiplier |
| 5x3/5x4 盤面 | 動態盤面尺寸切換 |
| NG/FG 分離 | 獨立的 Outcomes 與 Pool |
| 雙層機率模型 | 數學層 vs 視覺層分離 |
| Firebase 用戶系統 | Google OAuth 登入 |
| 模板管理 | 雲端儲存與讀取 |
| Dashboard | 用戶模板列表 |
| Auto Spin | 持續 Spin 直到取消 |
| Simulation 堆疊/比較 | 累加模擬結果 |

---

## 三、從前一次經驗學到的關鍵結論（請牢記）

### ✅ 已驗證可行
- **Pool-based generation（盤池抽樣）是可行且穩定的**
- Outcome → 盤池 → 抽盤 的模型能有效降低複雜度
- 單線（best-line）作為核心結算邏輯是正確的著地選擇
- **雙層機率模型** 可解決 Outcome 與 Symbol 權重矛盾

### ❌ 已證實會造成災難
- 地端雙專案（IDE + Page2 Runtime 分離）
- iframe / postMessage 架構
- Visual Constraint Layer（第二套生成世界觀）
- 在 settlement.ts 以外實作 Wild 邏輯
- NG/FG Pool 混用

---

## 四、三個不可動搖的治理概念

### 1️⃣ README_ARCHITECTURE.md = 北極星
- 定義產品「**應該長什麼樣子**」
- 一切設計衝突，回到此文件裁決

### 2️⃣ .cursor/rules/rule.mdc = 憲法
- 約束 AI 的行為邊界
- 防止 scope creep、平行世界、臨時 hack

### 3️⃣ SpinPacket v2 = 唯一資料主幹
- 任何盤面、動畫、素材、結算、Free Spin 狀態
- 都必須經過 **同一份資料合約**

---

## 五、最終產品架構（單一 App、單一真相）

### 核心原則
- **只有一個 Vite + React App**
- **只有一個 Runtime（Renderer）**
- Runtime 永遠不生成盤面，只播放結果
- Math Engine 永遠是結果的唯一來源
- Wild 結算邏輯只在 settlement.ts
- Free Spin 狀態機只在 useFreeSpinStore.ts

---

## 六、唯一資料合約：SpinPacket v2

```ts
SpinPacket = {
  version: "2",
  board: Board,              // 5x3 或 5x4
  visual: VisualConfig,      // 動畫參數 + 盤面視覺
  assets?: AssetsPatch,      // 素材（symbol / 盤面 / 框 / 背景 / 人物）
  meta?: SettlementMeta,     // outcomeId / win / bestLine / scatterCount
  freeSpinState?: FreeSpinState // Free Spin 狀態
}
```

### 重要規則

- Runtime 只能 render SpinPacket
- Analytics 只能使用 Math Engine 的 spin
- UI 不得直接修改 Runtime 狀態
- Free Spin 狀態只能由 useFreeSpinStore 管理

---

## 七、模組責任切割（避免混亂）

### Math Engine
- 決定結果
- 產生盤面
- 結算 best-line（含 Wild 替代）
- 建立盤池（NG Pool + FG Pool）
- 判定 Scatter 觸發

### Runtime Renderer
- 只負責動畫與顯示
- 不得有 RNG
- 不得補邏輯
- 滾動時使用 appearanceWeight

### IDE UI
- 讓使用者調參數
- 觸發 Build / Spin / Simulation / Auto Spin
- 顯示結果
- 管理 Tab 切換

### Analytics
- 重複使用 Math Engine
- 統計、圖表、CSV
- 堆疊/比較模式
- 不得另起一套邏輯

### Firebase
- 用戶認證（Google OAuth）
- 模板 CRUD（Firestore）
- 素材儲存（Storage）

---

## 八、盤池（Pool-based Generation）正式規格

### 為什麼選擇盤池？

- 比即時亂數可控
- 比視覺約束層簡單
- 容易 debug
- 容易限制規模（cap）

### 標準流程

1. 使用者定義 NG Outcomes 和 FG Outcomes
2. 為每個 Outcome 分別建立 NG Pool 和 FG Pool（最多 N 筆）
3. Spin 時：
   - [NG] 先抽 NG Outcome → 從 NG Pool 抽一盤 → 計算 best-line（含 Wild）
   - [NG] 如果 Scatter >= N，觸發 Free Spin
   - [FG] 抽 FG Outcome → 從 FG Pool 抽一盤 → 計算 best-line × Multiplier
4. 輸出 SpinPacket v2

---

## 九、雙層機率模型

### 數學層（影響 RTP）
- Outcome 權重
- Symbol ngWeight / fgWeight
- Pool 生成

### 視覺層（不影響 RTP）
- Symbol appearanceWeight
- 只用於 Runtime 滾動動畫

### 關鍵原則
- Pool Builder 不使用 appearanceWeight
- 兩層分離，避免矛盾

---

## 十、Vibe Coding 正確使用方式（AI 合作守則）

### 必須遵守

- 每次只做一件「完整的事情」
- 每次都要指定：
  - 檔案範圍
  - 不可動的模組
  - 驗收條件
- 小 diff、可回退
- 參考 prompts/ 資料夾中的任務文件

### 嚴禁

- 「順便幫我優化」
- 「你覺得怎麼比較好」
- 同時動 Math + Runtime + UI
- 在 settlement.ts 以外寫 Wild 邏輯
- 混用 NG/FG Pool

---

## 十一、專案完成的定義（Done = Done）

- 單次 Spin → 動畫盤面完全正確
- Wild 符號正確替代一般符號
- Scatter 符號正確觸發 Free Spin
- Free Spin 機制完整運作（Retrigger、Multiplier）
- NG/FG RTP 分開計算且合併正確
- Simulation → RTP / HitRate / AvgWin 正確
- 動畫參數由 IDE 控制
- 素材上傳立即反映
- 用戶可登入並儲存模板
- CSV 可匯出
- 無第二套生成邏輯

---

## 十二、給下一個 AI 的最後一句話

如果你發現自己：

- 想加第二套邏輯
- 想拆成第二個專案
- 想做「暫時版本」
- 想在 settlement.ts 以外寫 Wild 邏輯
- 想混用 NG/FG Pool

請立刻停下來，回到本文件。

---

## 十三、任務文件

所有開發任務的詳細規格位於 `prompts/` 資料夾。
執行任務前，請先閱讀對應的任務文件。
