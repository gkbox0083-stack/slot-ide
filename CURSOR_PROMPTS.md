# slot-ide Cursor Prompt 範本

本文件提供標準化的 Cursor prompt 格式。
每次給 Cursor 任務時，請使用此格式以確保一致性與可控性。

---

## 標準 Prompt 結構

```
## 目標
[一句話描述這次要完成什麼]

## 必讀文件
- AI_GUIDE.md
- SYSTEM_PROMPT.md
- README_ARCHITECTURE.md

## 範圍
[列出可以新增或修改的檔案]

## 禁區
[列出不可修改的檔案或模組]

## 驗收條件
[列出怎樣算完成]

## 參考
[指向特定文件的特定章節]
```

---

## Phase 1 Prompt 範例

### Prompt 1-1：建立 Vite 專案

```
## 目標
初始化 Vite + React + TypeScript 專案

## 必讀文件
- AI_GUIDE.md
- SYSTEM_PROMPT.md
- README_ARCHITECTURE.md

## 範圍
- package.json（新建）
- vite.config.ts（新建）
- tsconfig.json（新建）
- index.html（新建）
- src/main.tsx（新建）
- src/App.tsx（新建）

## 禁區
- 不可建立任何其他檔案
- 不可安裝非必要套件

## 驗收條件
- npm install 成功
- npm run dev 可啟動
- 頁面顯示 "slot-ide"

## 參考
README_ARCHITECTURE.md 第二節「技術架構」
```

---

### Prompt 1-2：建立型別定義

```
## 目標
建立 SpinPacket 與相關型別定義

## 必讀文件
- AI_GUIDE.md
- SYSTEM_PROMPT.md
- README_ARCHITECTURE.md

## 範圍
- src/types/index.ts（新建）
- src/types/spin-packet.ts（新建）
- src/types/outcome.ts（新建）
- src/types/symbol.ts（新建）
- src/types/board.ts（新建）
- src/types/lines.ts（新建）
- src/types/visual.ts（新建）

## 禁區
- 不可修改 src/App.tsx
- 不可新增其他資料夾

## 驗收條件
- 所有型別可被 import
- 無 any 型別
- 型別結構符合 README_ARCHITECTURE.md 第三節
- VisualConfig 包含 animation（5 參數）+ layout（3 參數）
- AssetsPatch 包含 5 種素材
- SymbolDefinition 包含 payouts + appearanceWeight
- LinesConfig 包含 count + patterns

## 參考
README_ARCHITECTURE.md 第三節「核心資料合約」
```

---

## Phase 2 Prompt 範例

### Prompt 2-1：建立 Outcome Manager

```
## 目標
實作 Outcome 管理模組

## 必讀文件
- AI_GUIDE.md
- SYSTEM_PROMPT.md
- README_ARCHITECTURE.md

## 範圍
- src/engine/index.ts（新建）
- src/engine/outcome-manager.ts（新建）

## 禁區
- 不可修改 src/types/
- 不可新增 runtime 相關檔案

## 驗收條件
- 可新增、修改、刪除 Outcome
- Outcome 結構符合型別定義
- 匯出 outcomeManager 實例

## 參考
README_ARCHITECTURE.md 第四節「Outcome 與盤池規格」
```

---

### Prompt 2-2：建立 Pool Builder

```
## 目標
實作盤池生成模組

## 必讀文件
- AI_GUIDE.md
- SYSTEM_PROMPT.md
- README_ARCHITECTURE.md

## 範圍
- src/engine/pool-builder.ts（新建）

## 禁區
- 不可修改 src/types/
- 不可修改 src/engine/outcome-manager.ts

## 驗收條件
- 可為每個 Outcome 生成符合倍率區間的盤面
- 盤池有 cap 限制
- 生成邏輯使用單一 RNG

## 參考
README_ARCHITECTURE.md 第四節「盤池生成流程」
```

---

## Prompt 撰寫原則

### DO
- 目標明確（一句話）
- 範圍具體（列出檔案）
- 禁區清楚（防止越界）
- 驗收可測（可驗證）

### DON'T
- 「幫我把 Math Engine 做完」（太大）
- 「你覺得怎麼做比較好」（讓 AI 自己決定）
- 「順便優化一下 XXX」（scope creep）
- 不指定範圍（可能動到不該動的）

---

## 驗收流程

1. Cursor 完成任務
2. 檢查 diff（是否只動了指定範圍）
3. 執行驗收條件
4. 通過 → 進入下一個 Prompt
5. 不通過 → 回退並重新下 Prompt