# Code Review Issues Report

**審查日期**: 2026-01-14
**審查範圍**: slot-ide 專案完整程式碼
**審查版本**: main branch (commit: 53b762d)

---

## 高優先級問題

### H-01 [src/store/useGameConfigStore.ts:263] 使用已棄用的 `substr()` 方法
- **問題描述**: 使用已棄用的 `String.prototype.substr()` 方法生成 ID
- **影響**: `substr()` 已被標記為 deprecated，未來可能從標準中移除
- **程式碼位置**:
  ```typescript
  const generateId = () => `outcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  ```
- **建議修正方式**: 改用 `substring()` 或 `slice()` 方法

### H-02 [src/store/useSimulationStore.ts:40] 未使用的函式參數
- **問題描述**: `startSimulation` 函式的 `_count` 參數宣告了但從未使用
- **影響**: 程式碼可讀性降低，可能表示實作不完整
- **程式碼位置**:
  ```typescript
  startSimulation: (_count) => {
    const { mode, results } = get();
    // _count 從未被使用
  ```
- **建議修正方式**: 移除未使用的參數或實作相關功能

### H-03 [根目錄] 存在垃圾檔案 `nul`
- **問題描述**: Git 追蹤了一個 Windows 系統產生的 `nul` 檔案
- **影響**: 這是 Windows 特殊裝置名稱，不應該被追蹤，可能導致跨平台問題
- **建議修正方式**: 從 Git 追蹤中移除並加入 `.gitignore`

### H-04 [src/ide/panels/SymbolPanel.tsx:134] React 狀態更新邏輯問題
- **問題描述**: 在 render 函式內直接呼叫 `setEditedSymbol`，違反 React 規則
- **影響**: 可能導致無限重渲染或不可預期的行為
- **程式碼位置**:
  ```typescript
  if (!isEditing && editedSymbol.id !== symbol.id) {
    setEditedSymbol(symbol);  // 在 render 中直接呼叫 setState
  }
  ```
- **建議修正方式**: 使用 `useEffect` 來同步 props 到 state

### H-05 [src/ide/panels/OutcomePanel.tsx:459] RTP 計算顯示錯誤
- **問題描述**: 理論 RTP 計算後乘以 100 兩次，導致顯示值錯誤
- **影響**: UI 顯示的 RTP 值會是實際值的 100 倍
- **程式碼位置**:
  ```typescript
  // theoreticalRTP 已經是倍率形式 (例如 0.95)
  // 這裡又乘以 100，導致顯示 9500% 而不是 95%
  理論 RTP: <span className="text-yellow-400 font-mono">{(theoreticalRTP * 100).toFixed(2)}%</span>
  ```
- **建議修正方式**: 檢查計算邏輯，移除多餘的 `* 100`

---

## 中優先級問題

### M-01 [src/ide/layout/IDELayoutV2.tsx:117-121] 生產環境中的 console.log
- **問題描述**: 程式碼中包含開發用的 `console.log` 語句
- **影響**: 生產環境中會產生不必要的日誌輸出
- **程式碼位置**:
  ```typescript
  onSpinComplete={() => {
    console.log('Spin complete');
  }}
  onSkip={() => {
    console.log('Spin skipped');
  }}
  ```
- **建議修正方式**: 移除或使用環境變數控制日誌輸出

### M-02 [src/ide/panels/SymbolPanel.tsx:28, OutcomePanel.tsx:37] 使用瀏覽器原生 `confirm()`
- **問題描述**: 使用全域 `confirm()` 函式進行確認對話框
- **影響**: UI 不一致，無法自訂樣式，阻塞主執行緒
- **程式碼位置**:
  ```typescript
  if (confirm('確定要重置所有符號設定嗎？此動作無法復原。')) {
  ```
- **建議修正方式**: 使用自訂的確認對話框元件

### M-03 [src/ide/layout/GameControlBar.tsx] 潛在的競態條件
- **問題描述**: `handleSpin` 函式中多次讀取 store 狀態，可能在異步操作間產生不一致
- **影響**: 在快速操作下可能導致餘額或狀態計算錯誤
- **程式碼位置**:
  ```typescript
  const currentBalance = useGameConfigStore.getState().balance;
  setBalance(currentBalance - baseBet);
  // ... 異步操作 ...
  const currentBalance = useGameConfigStore.getState().balance;  // 可能已被其他操作修改
  ```
- **建議修正方式**: 使用 atomic 更新或在單一事務中處理所有狀態變更

### M-04 [全域] 缺少 React Error Boundary
- **問題描述**: 應用程式沒有設置 Error Boundary 來捕獲 React 元件錯誤
- **影響**: 任何元件錯誤都會導致整個應用崩潰
- **建議修正方式**: 在 App.tsx 中加入 Error Boundary 元件

### M-05 [src/engine/score-distribution.ts:163] 未使用的函式參數
- **問題描述**: `calculateActualPoolRTP` 的 `_pools` 參數以底線命名但未使用
- **影響**: 表示可能有未完成的實作
- **程式碼位置**:
  ```typescript
  export function calculateActualPoolRTP(
    _pools: { outcomeId: string; outcomeName: string; generated: number }[],
  ```
- **建議修正方式**: 實作使用該參數的邏輯或移除參數

### M-06 [src/store/useUIStore.ts:72-76, 80-84] DOM 操作重複程式碼
- **問題描述**: `toggleDarkMode` 和 `setDarkMode` 有相同的 DOM 操作邏輯
- **影響**: 程式碼重複，維護困難
- **程式碼位置**:
  ```typescript
  // 相同的邏輯重複兩次
  if (newDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  ```
- **建議修正方式**: 抽取成共用函式

---

## 低優先級問題

### L-01 [多檔案] Import 路徑副檔名不一致
- **問題描述**: 部分檔案使用 `.js` 副檔名，部分沒有
- **影響**: 程式碼風格不一致
- **範例**:
  ```typescript
  // 有些使用 .js
  import { xxx } from './xxx.js';
  // 有些沒有
  import { yyy } from './yyy';
  ```
- **建議修正方式**: 統一使用或不使用副檔名

### L-02 [多檔案] 魔術數字 (Magic Numbers)
- **問題描述**: 程式碼中有多處硬編碼的數值常數
- **影響**: 難以理解數值含義，維護困難
- **範例**:
  - `GameControlBar.tsx:87`: `setTimeout(resolve, 500)`
  - `GameControlBar.tsx:262`: `if (batchStats.fgSpins > count * 100) break`
  - `pool-builder.ts:95`: `const maxAttempts = targetCap * 100`
- **建議修正方式**: 將魔術數字抽取為具名常數

### L-03 [src/analytics/simulator.ts:47] 未重置的 abort 標記
- **問題描述**: `aborted` 標記在 `runAsync` 開始時重置，但同步版 `run` 不檢查此標記
- **影響**: 如果在同步執行時呼叫 `abort()`，不會產生效果
- **建議修正方式**: 在同步版本中也加入中止檢查

### L-04 [多檔案] 註解語言混用
- **問題描述**: 程式碼註解混用中文和英文
- **影響**: 風格不統一，對非中文使用者不友善
- **建議修正方式**: 統一註解語言

### L-05 [src/wizard/] Wizard 相關檔案可能未使用
- **問題描述**: Wizard 相關元件存在但在主要佈局中未見使用
- **影響**: 可能是死代碼，增加維護負擔
- **建議修正方式**: 確認是否為計畫中功能，若不需要則移除

### L-06 [src/types/spin-packet.ts] 版本號硬編碼
- **問題描述**: SpinPacket 的版本號 "2" 直接硬編碼在型別中
- **影響**: 未來版本升級時可能需要大量修改
- **程式碼位置**:
  ```typescript
  export interface SpinPacket {
    version: "2";  // 硬編碼
  ```
- **建議修正方式**: 考慮使用常數或型別聯集

### L-07 [src/ide/panels/] 表單元件缺少 id 和 htmlFor 關聯
- **問題描述**: 多數 input 元素沒有 id，label 沒有 htmlFor 屬性
- **影響**: 無障礙性 (Accessibility) 不足
- **建議修正方式**: 為表單元素添加適當的 id 和 htmlFor 關聯

### L-08 [src/store/useGameConfigStore.ts:106-107] 重複的 JSDoc 註解
- **問題描述**: `defaultSymbols` 有兩行相同的 JSDoc 註解
- **影響**: 程式碼品質問題
- **程式碼位置**:
  ```typescript
  /**
   * 預設符號列表（V2 擴展）
   */
  /**
   * 預設符號列表（V2 擴展）
   */
  export const defaultSymbols: SymbolDefinition[] = [
  ```
- **建議修正方式**: 移除重複的註解

---

## 統計摘要

| 類別 | 數量 |
|------|------|
| 總問題數 | 19 |
| 高優先級 | 5 |
| 中優先級 | 6 |
| 低優先級 | 8 |

---

## 備註

1. 本次審查主要關注程式碼品質、潛在 Bug 和最佳實踐
2. 專案整體架構設計良好，遵循單向資料流原則
3. 型別定義完整，TypeScript 使用規範
4. 建議優先處理高優先級問題，特別是 H-04 和 H-05 可能影響功能正確性
