# P2-09 Free Spin 觸發修復

> **⚠️ 已過時 (DEPRECATED)**
>
> 此任務文件已於 V3 簡化版中標記為過時。
> V3 版本移除了 Free Spin 機制，改為 Scatter 直接賦值模式。
> 保留此文件僅供歷史參考。

---

## 目標 (Objective)

修復 Free Spin 觸發邏輯，使 Scatter 數量達到門檻時正確觸發 Free Spin 模式，包括：
- 觸發 Free Spin（Base Game → Free Game）
- Retrigger 處理
- 次數消耗與結束判斷
- 歷史紀錄記錄

---

## 範圍 (Scope)

需要修改的檔案：
- `src/ide/layout/GameControlBar.tsx`

依賴：
- P1-04（Free Spin 機制）
- P2-08（Free Spin Panel）

---

## 問題根因

結算引擎 (`settlement.ts`) 正確計算 Scatter 數量並設置 `meta.triggeredFreeSpin = true`，
但 UI 層 (`GameControlBar.tsx`) 的 `handleSpin` 函式沒有處理這個結果。

```
當前流程：
spinExecutor.spin() → packet.meta.triggeredFreeSpin = true → ❌ 無後續處理

預期流程：
spinExecutor.spin() → packet.meta.triggeredFreeSpin = true
  → ✅ 呼叫 useFreeSpinStore.triggerFreeSpin()
  → mode 切換為 'free'
  → 後續 spin 使用 FG Pool
```

---

## Investigation v1 - 2026-01-10

### 嘗試的修復

在 `handleSpin` 中加入 Free Spin 觸發處理邏輯：
- 檢測 `packet.meta.triggeredFreeSpin`
- 呼叫 `freeSpinState.triggerFreeSpin()`

### 結果

❌ 修復無效，Free Spin 仍未被觸發

### 可能原因

經調查，問題可能出在以下環節之一：

1. **Pool 建立時可能未包含 Scatter 符號**
   - `pool-builder.ts` 使用 `drawSymbol()` 生成盤面
   - `drawSymbol()` 使用 `appearanceWeight`（Scatter=3，相對較低）
   - 即使調高 `ngWeight` 到 3000，如果用戶沒有同時調高 `appearanceWeight`，Scatter 出現機率仍然很低

2. **UI 層與引擎的 symbols 可能不同步**
   - PoolPanel 在 Build Pools 時會呼叫 `symbolManager.setSymbols(symbols)`
   - 但如果用戶修改權重後沒有重新 Build Pools，引擎仍使用舊的權重

3. **settlement 的 Scatter 計數可能有問題**
   - 需要驗證 `countScatters()` 是否正確識別 Scatter 符號

### 下一步調查方向

新增 console.log 或 debug 斷點確認：
1. 盤面上是否有 Scatter 符號
2. `packet.meta.scatterCount` 的值
3. `packet.meta.triggeredFreeSpin` 的值

---

## Investigation v2 - 2026-01-10 (已確認)

### Debug 結果

```
=== P2-09 Debug ===
Board: SCATTER,L4,L4 | L4,SCATTER,SCATTER | L4,L4,L4 | SCATTER,L4,L4 | L4,L4,L4
Scatter Count: 4
Triggered Free Spin: true  ← 結算邏輯正確！
```

### 確認的問題

**Settlement 正確回傳 `triggeredFreeSpin: true`，但 UI 層沒有處理**。

原始修復方向正確，之前測試失敗是因為測試條件不對（Pool 中 Scatter 數量不足）。

### 待修復

在 `GameControlBar.tsx` 的 `handleSpin` 中加入：
1. 檢測 `packet.meta.triggeredFreeSpin` 並觸發 Free Spin
2. 處理 Retrigger
3. 消耗次數、記錄歷史、結束判斷

---

## 實作細節 (Implementation Details)

### GameControlBar.tsx 修改

在 `handleSpin` 函式中，於 `setCurrentSpinPacket(packet)` 之後加入：

```typescript
// 處理 Free Spin 觸發（Base Game → Free Game）
if (packet.meta?.triggeredFreeSpin && !isInFreeSpin) {
  const scatterCount = packet.meta.scatterCount || 0;
  const config = useGameConfigStore.getState().freeSpinConfig;
  freeSpinState.triggerFreeSpin(scatterCount, config);
}

// 處理 Retrigger（Free Game 中再次觸發）
if (packet.meta?.triggeredFreeSpin && isInFreeSpin) {
  const config = useGameConfigStore.getState().freeSpinConfig;
  if (config.enableRetrigger) {
    freeSpinState.retrigger(config.retriggerSpinCount);
  }
}

// Free Spin 模式下消耗次數並記錄歷史
if (isInFreeSpin) {
  freeSpinState.consumeSpin();
  freeSpinState.addWin(winAmount);
  
  // 記錄歷史
  freeSpinState.addHistory({
    spinIndex: freeSpinState.totalSpins - freeSpinState.remainingSpins + 1,
    board: packet.board,
    win: winAmount,
    multipliedWin: winAmount,  // 已在 settlement 中乘過
    isRetrigger: packet.meta?.triggeredFreeSpin || false,
  });
  
  // 檢查是否結束
  if (freeSpinState.remainingSpins <= 1) {
    freeSpinState.endFreeSpin();
  }
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] Scatter ≥ triggerCount 時正確觸發 Free Spin
- [ ] 進入 Free Spin 後底部控制欄顯示 `🎰 FS: X/N` 提示
- [ ] Free Spin 期間不扣除 Balance（Bet）
- [ ] Free Spin 獲勝即時加到 Balance
- [ ] Free Spin Panel 正確顯示剩餘次數
- [ ] Free Spin Panel 正確顯示累積獎金
- [ ] Free Spin Panel 正確顯示本輪歷史
- [ ] Retrigger 正確增加次數
- [ ] Free Spin 結束後正確回到 Base Game
- [ ] `npm run build` 成功

---

## 測試步驟

1. 啟動開發伺服器 `npm run dev`
2. 開啟 `http://localhost:5173`
3. **右側面板** → Free Spin Tab → 確認狀態「✅ 已啟用」
4. **右側面板** → 符號設定 → SCATTER 的 ngWeight 調高（例如 3000）
5. Pool 面板 → Build Pools
6. 重複點擊 SPIN 直到觸發 Free Spin
7. 驗證上述驗收條件

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/ide/layout/GameControlBar.tsx` 修改片段
2. 手動測試結果截圖（如適用）

