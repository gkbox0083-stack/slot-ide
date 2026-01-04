# slot-ide 專案 AI 指南（Restart Playbook）

> ✅ **MVP 完成** — 本專案已作為最小可行產品完成，可作為後續完整版開發的參考範本。

本文件是為「**下一個 AI**」或「**新專案開發**」所撰寫。
請在開始任何實作前完整閱讀，並將本文件視為專案的最高指導原則之一。

---

## 一、專案目標（North Star）

### 一句話版本
slot-ide 是一個 **單頁 Slot IDE**，讓使用者可以：

1. 設定老虎機數學（Outcome、倍率區間、權重、盤池）
2. 控制視覺動畫與素材
3. 進行單次 Spin 或大量 Simulation
4. 即時看到「與數學結果完全一致」的動畫盤面
5. 匯出統計結果與 CSV

所有行為必須是 **可重現、可理解、IDE 驅動**。

### MVP 完成狀態

| 功能 | 狀態 |
|------|------|
| 數學引擎（Outcome / Symbol / Lines / Pool） | ✅ 完成 |
| 動畫渲染（SlotMachine / Reel / Symbol） | ✅ 完成 |
| IDE 介面（8 個面板 + Tab 切換） | ✅ 完成 |
| 統計分析（Simulation / Charts / CSV） | ✅ 完成 |
| 素材管理（上傳 / 持久化 / 渲染層） | ✅ 完成 |

---

## 二、從本次開發學到的關鍵結論（請牢記）

### ✅ 已驗證可行
- **Pool-based generation（盤池抽樣）是可行且穩定的**
- **Outcome → 盤池 → 抽盤** 的模型能有效降低複雜度
- **單線（best-line）+ 多線累加** 作為核心結算邏輯是正確的
- **React Context + useReducer** 對 MVP 規模已足夠
- **分階段開發** 每個 Phase 完成驗收後再進入下一階段
- **型別先行** Phase 1 先定義所有型別，後續開發更順暢

### ❌ 已證實會造成災難
- **地端雙專案**（IDE + Page2 Runtime 分離）
- **iframe / postMessage** 架構
- **Visual Constraint Layer**（第二套生成世界觀）
- **在未完成產品前導入 Multi-win / Wild / Scatter**
- **「暫時版本」心態** — 所有實作都應該是正式版

---

## 三、三個不可動搖的治理概念

### 1️⃣ README_ARCHITECTURE.md = 北極星
- 定義產品「**應該長什麼樣子**」
- 一切設計衝突，回到此文件裁決

### 2️⃣ SYSTEM_PROMPT.md = 憲法
- 約束 AI 的行為邊界
- 防止 scope creep、平行世界、臨時 hack

### 3️⃣ SpinPacket = 唯一資料主幹
- 任何盤面、動畫、素材、結算
- 都必須經過 **同一份資料合約**

---

## 四、最終產品架構（單一 App、單一真相）

### 核心原則
- **只有一個 Vite + React App**
- **只有一個 Runtime（Renderer）**
- Runtime 永遠不生成盤面，只播放結果
- Math Engine 永遠是結果的唯一來源

### 模組結構

```
┌─────────────────────────────────────────────────────────────┐
│                         IDE UI                               │
│  ┌─────────┬─────────┬─────────┬─────────┐                  │
│  │ Control │ Outcome │ Symbol  │ Asset   │  ...panels       │
│  │ Panel   │ Panel   │ Panel   │ Panel   │                  │
│  └────┬────┴────┬────┴────┬────┴────┬────┘                  │
│       └─────────┴────┬────┴─────────┘                        │
│                      │                                       │
│                      ▼                                       │
│            ┌─────────────────┐                               │
│            │     Store       │  React Context + useReducer   │
│            │   (IDEState)    │                               │
│            └────────┬────────┘                               │
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

---

## 五、唯一資料合約：SpinPacket

```typescript
interface SpinPacket {
  version: "1";
  board: Board;              // 5x3 盤面
  visual: VisualConfig;      // 動畫參數 + 盤面視覺
  assets?: AssetsPatch;      // 素材覆蓋
  meta?: SettlementMeta;     // 結算資訊
}
```

### VisualConfig 包含
- **動態參數**：轉速、時長、停輪間隔、緩停力度、回彈力度
- **盤面視覺**：卷軸間距、圖示縮放、盤面縮放

### AssetsPatch 包含
- symbols（與 symbol 種類數量連動）
- board（盤面底圖）
- frame（盤面框）
- background（背景）
- character（人物）

### 重要規則

- Runtime 只能 render SpinPacket
- Analytics 只能使用 Math Engine 的 spin
- UI 不得直接修改 Runtime 狀態

---

## 六、模組責任切割（避免混亂）

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

## 七、盤池（Pool-based Generation）正式規格

### 為什麼選擇盤池？

- 比即時亂數可控
- 比視覺約束層簡單
- 容易 debug
- 容易限制規模（cap）

### 標準流程

1. 使用者定義 Outcome（倍率區間 + 權重）
2. 為每個 Outcome 建立盤池（最多 N 筆）
3. Spin 時：
   - 先抽 Outcome
   - 再從對應盤池抽一盤
   - 計算 best-line
   - 輸出 SpinResult → SpinPacket

---

## 八、Vibe Coding 正確使用方式（AI 合作守則）

### 必須遵守

- 每次只做一件「完整的事情」
- 每次都要指定：
  - 檔案範圍
  - 不可動的模組
  - 驗收條件
- 小 diff、可回退

### 嚴禁

- 「順便幫我優化」
- 「你覺得怎麼比較好」
- 同時動 Math + Runtime + UI
- 在產品完成前加新玩法

---

## 九、專案完成的定義（Done = Done）

- [x] 單次 Spin → 動畫盤面完全正確
- [x] Simulation → RTP / HitRate / AvgWin 正確
- [x] 動畫參數由 IDE 控制
- [x] 素材上傳立即反映
- [x] CSV 可匯出
- [x] 無第二套生成邏輯

---

## 十、給下一個 AI / 新專案的最後建議

### 如果你要在本專案基礎上修改

1. 先閱讀 README_ARCHITECTURE.md 了解架構
2. 先閱讀 MVP_SUMMARY.md 了解已完成的功能
3. 確認修改範圍不會破壞核心架構
4. 任何變更都需通過 P0_GATE.md 檢查

### 如果你要開發新的完整版專案

1. **型別定義可直接複用** — `src/types/` 的所有型別
2. **演算法可參考實作** — `src/engine/` 的核心邏輯
3. **架構原則必須遵守** — 單一真相、唯一合約、模組責任清晰
4. **避免重蹈覆轍** — 參考第二節的經驗教訓

### 如果你發現自己：

- 想加第二套邏輯
- 想拆成第二個專案
- 想做「暫時版本」

**請立刻停下來，回到本文件。**

---

## 附錄：關鍵檔案參考

| 檔案 | 用途 |
|------|------|
| `MVP_SUMMARY.md` | MVP 總結、新專案參考 |
| `README_ARCHITECTURE.md` | 架構規格書 |
| `PHASES.md` | 開發階段紀錄 |
| `P0_GATE.md` | 品質檢查門檻 |
| `CHECKLIST.md` | 驗收清單 |
