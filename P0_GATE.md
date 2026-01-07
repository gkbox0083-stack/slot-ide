# slot-ide P0 Gate V2（不可變條件檢查）

本文件定義每次 commit 前必須通過的檢查項目。
**任何一項失敗，禁止進入下一步。**

---

## 什麼是 P0 Gate？

P0 = Priority 0 = 最高優先級
Gate = 關卡

這是一道「不可繞過的門」，確保每次變更都不會破壞核心架構。

---

## P0 檢查清單（每次 commit 前執行）

### 🔴 架構不可變條件（Invariants）

- [ ] **單一專案** — 只有一個 Vite + React App
- [ ] **無 iframe** — 沒有使用 iframe
- [ ] **無 postMessage** — 沒有跨視窗通訊
- [ ] **單一 RNG** — 只有 Math Engine 有亂數邏輯
- [ ] **單一合約** — SpinPacket v2 是唯一資料介面
- [ ] **Runtime 無邏輯** — Runtime 不生成盤面、不結算

### 🟠 V2 新增不可變條件

- [ ] **Wild 結算唯一** — Wild 替代邏輯只在 `src/engine/settlement.ts`
- [ ] **Free Spin 狀態唯一** — Free Spin 狀態機只在 `src/store/useFreeSpinStore.ts`
- [ ] **NG/FG Pool 分離** — NG Pool 和 FG Pool 不混用
- [ ] **雙層機率分離** — Pool Builder 不使用 appearanceWeight
- [ ] **Scatter 觸發唯一** — Scatter 觸發邏輯只在 `src/engine/spin-executor.ts`

### 🟡 程式碼品質

- [ ] **無 any** — TypeScript 沒有 any 型別
- [ ] **無 console.log** — 正式程式碼無遺留 log（測試用除外）
- [ ] **無 TODO hack** — 沒有「之後再修」的註解
- [ ] **可編譯** — `npm run build` 成功

### 🟢 功能回歸（Regression）

- [ ] **型別完整** — 所有 types/ 檔案可 import
- [ ] **資料流正確** — Math → SpinPacket v2 → Runtime
- [ ] **既有功能正常** — 之前完成的功能沒壞
- [ ] **Wild 結算正確** — Wild 正確替代一般符號
- [ ] **Free Spin 正確** — Free Spin 觸發、執行、結束流程正確
- [ ] **RTP 計算正確** — NG RTP + FG RTP = 總 RTP

### 🔵 Firebase 相關（Phase 3 後適用）

- [ ] **安全規則** — 用戶只能存取自己的模板
- [ ] **訪客限制** — 訪客無法儲存/匯出

---

## 如何使用

### 開發時
1. 完成 Cursor 實作
2. 執行 Acceptance Checklist（見 CHECKLIST.md）
3. 執行 P0 Gate 檢查
4. 全部通過 → commit
5. 任一失敗 → 修復後重新檢查

### 指令參考
```bash
# 編譯檢查
npm run build

# 型別檢查
npx tsc --noEmit

# 搜尋遺留 any
grep -r ": any" src/

# 搜尋遺留 TODO
grep -r "TODO" src/

# 搜尋 Wild 邏輯位置（應只在 settlement.ts）
grep -r "wild" src/ --include="*.ts" --include="*.tsx"

# 搜尋 Free Spin 狀態（應只在 useFreeSpinStore.ts 和 spin-executor.ts）
grep -r "freeSpin\|freeSpinState" src/ --include="*.ts" --include="*.tsx"
```

---

## P0 Gate 失敗怎麼辦？

| 失敗項目 | 處理方式 |
|----------|----------|
| 架構不可變條件 | **立即回退**，這是紅線 |
| V2 新增不可變條件 | **立即回退**，這是紅線 |
| 程式碼品質 | 修復後重新檢查 |
| 功能回歸 | 找出破壞點，修復後重新檢查 |
| Firebase 相關 | 修復安全規則或邏輯 |

---

## 給 AI 的提醒

如果你（AI）發現自己的實作會導致 P0 Gate 失敗：

1. **停止實作**
2. **回報問題**
3. **等待人類決策**

不可為了「完成任務」而繞過 P0 Gate。

---

## 特別注意事項

### Wild 結算位置檢查

Wild 替代邏輯只允許出現在以下位置：
- `src/engine/settlement.ts`

如果在其他檔案發現 Wild 替代邏輯，P0 Gate 失敗。

### Free Spin 狀態位置檢查

Free Spin 狀態管理只允許出現在以下位置：
- `src/store/useFreeSpinStore.ts`（狀態）
- `src/engine/spin-executor.ts`（觸發判定）

如果在其他檔案發現 Free Spin 狀態修改邏輯，P0 Gate 失敗。

### NG/FG Pool 分離檢查

- NG Pool 和 FG Pool 必須分開儲存
- 不得在 NG 模式使用 FG Pool，反之亦然
- Pool Builder 必須根據 `phase` 參數區分

### 雙層機率模型檢查

- `appearanceWeight` 只能在 Runtime 滾動動畫中使用
- Pool Builder 只能使用 `ngWeight` 和 `fgWeight`
- 如果 Pool Builder 使用 `appearanceWeight`，P0 Gate 失敗
