# slot-ide P0 Gate（不可變條件檢查）

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
- [ ] **單一合約** — SpinPacket 是唯一資料介面
- [ ] **Runtime 無邏輯** — Runtime 不生成盤面、不結算

### 🟡 程式碼品質

- [ ] **無 any** — TypeScript 沒有 any 型別
- [ ] **無 console.log** — 正式程式碼無遺留 log（測試用除外）
- [ ] **無 TODO hack** — 沒有「之後再修」的註解
- [ ] **可編譯** — `npm run build` 成功

### 🟢 功能回歸（Regression）

- [ ] **型別完整** — 所有 types/ 檔案可 import
- [ ] **資料流正確** — Math → SpinPacket → Runtime
- [ ] **既有功能正常** — 之前完成的功能沒壞

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
```

---

## P0 Gate 失敗怎麼辦？

| 失敗項目 | 處理方式 |
|----------|----------|
| 架構不可變條件 | **立即回退**，這是紅線 |
| 程式碼品質 | 修復後重新檢查 |
| 功能回歸 | 找出破壞點，修復後重新檢查 |

---

## 給 AI 的提醒

如果你（AI）發現自己的實作會導致 P0 Gate 失敗：

1. **停止實作**
2. **回報問題**
3. **等待人類決策**

不可為了「完成任務」而繞過 P0 Gate。
