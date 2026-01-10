# P2-11 Scatter 價值計算優化

> [!NOTE]
> 此議題暫時擱置，待 P2-10 Free Spin 控制整合完成後再處理。

## 問題背景

### 當前行為

Pool Builder 根據盤面的「連線得分」篩選盤面，但 Scatter 的 payouts = 0，導致：
- Scatter 越多 → 可形成連線的符號越少 → 盤面分數越低
- 分數不在目標 Outcome 範圍 → 盤面被丟棄
- 即使 Scatter 權重很高，符合分數範圍的盤面中 Scatter 仍然很少

### 實際案例

測試設定：
- 符號：L4 (weight:45)、SCATTER (weight:3000)
- Outcome：55 NG (倍率 1x-3x)

結果：
- 雖然 Scatter 權重佔 98.5%，但建出的盤面中 Scatter 很少
- 因為 Scatter 多的盤面分數低，被篩掉了

---

## 建議修復

### 設計思路

**Scatter 的價值 = 本身得分 + 觸發 Free Spin 的預期總分**

當盤面包含 ≥3 個 Scatter 時，該盤面的「價值」應計入：
1. 連線得分（現有）
2. Scatter 觸發 Free Spin 的預期收益

### 預期收益計算

```
Scatter 價值 = Scatter 數量 × 單次 Scatter 預期價值

單次 Scatter 預期價值 = (Free Spin 次數 × 平均單次 FG 收益) ÷ 觸發所需 Scatter 數
```

或簡化版：
```
if (scatterCount >= triggerCount) {
  bonus = freeSpinConfig.baseSpinCount × avgFGMultiplier;
  boardScore += bonus;
}
```

---

## 影響範圍

### 需要修改的檔案

1. **`src/engine/pool-builder.ts`**
   - `calculateBoardScore()` 函式需要加入 Scatter 價值計算
   - 需要存取 `FreeSpinConfig` 和 FG Outcomes 的平均倍率

2. **`src/engine/rtp-calculator.ts`**（可選）
   - 新增 `calculateAvgFGMultiplier()` 函式供 Pool Builder 使用

---

## 實作方案

### 方案 A：簡化固定值

```typescript
// pool-builder.ts
private calculateBoardScore(board: Board): number {
  let totalScore = /* 現有連線分數計算 */;
  
  // 新增 Scatter 價值
  const scatterCount = this.countScatters(board);
  const freeSpinConfig = /* 從外部傳入 */;
  
  if (scatterCount >= freeSpinConfig.triggerCount) {
    // 預設 Free Spin 價值 = 次數 × 平均倍率（例如 10 × 5 = 50）
    const freeSpinValue = freeSpinConfig.baseSpinCount * 5; // 暫定平均倍率 5x
    totalScore += freeSpinValue;
  }
  
  return totalScore;
}
```

### 方案 B：動態計算

```typescript
// 從 FG Outcomes 計算平均倍率
const avgFGMultiplier = calculateTheoreticalFGRTP(fgOutcomes); // 使用現有函式
const freeSpinValue = freeSpinConfig.baseSpinCount * avgFGMultiplier;
```

---

## 驗收條件

- [ ] Pool Builder 在計算盤面分數時包含 Scatter 觸發價值
- [ ] 高 Scatter 權重時，能正確建出含多個 Scatter 的盤面
- [ ] RTP 計算結果與預期一致
- [ ] `npm run build` 成功

---

## 風險評估

> [!WARNING]
> 此修改會改變 Pool 建立邏輯，可能影響 RTP 計算準確性。
> 建議實作後進行大量 Simulation 驗證 RTP 是否符合預期。

---

## 相關 Issue

- P2-09 Free Spin 觸發修復（已完成）
- P2-10 Free Spin 控制整合（進行中）
- P1-06 Pool Builder NG/FG 分離
