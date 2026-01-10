# P2-11 FS 觸發符號價值計算優化

> [!NOTE]
> 此議題暫時擱置，待 P2-10 Free Spin 控制整合完成後再處理。

## 問題背景

### 當前行為

Pool Builder 根據盤面的「連線得分」篩選盤面，但觸發符號 (如 Scatter) 的 payouts 往往較低或為 0，導致：
- 觸發符號越多 → 可形成連線的符號越少 → 盤面分數越低
- 分數不在目標 Outcome 範圍 → 盤面被丟棄
- 即使符號權重很高，符合分數範圍的盤面中觸發符號仍然很少

### 實際案例

測試設定：
- 符號：L4 (weight:45)、觸發符號 (weight:3000)
- Outcome：55 NG (倍率 1x-3x)

結果：
- 雖然觸發符號權重佔 98.5%，但建出的盤面中觸發符號很少
- 因為觸發符號多的盤面分數低，被篩掉了

---

## 建議修復

### 設計思路

**觸發符號的價值 = 本身得分 + 觸發 Free Spin 的預期總分**

當盤面包含足夠數量的觸發符號時，該盤面的「價值」應計入：
1. 連線得分（現有）
2. 該符號觸發 Free Spin 的預期收益

### 預期收益計算

```
觸發符號價值 = 符號數量 × 單次預期價值
單次預期價值 = (Free Spin 次數 × 平均單次 FG 收益) ÷ 觸發所需數量
```

或簡化版：
```
if (count >= triggerCount) {
  bonus = baseSpinCount × avgFGMultiplier;
  boardScore += bonus;
}
```

---

## 影響範圍

### 需要修改的檔案

1. **`src/engine/pool-builder.ts`**
   - `calculateBoardScore()` 函式需要加入觸發符號價值計算
   - 需要存取該符號的 `fsTriggerConfig` 和 FG Outcomes 的平均倍率

2. **`src/engine/rtp-calculator.ts`**（可選）
   - 新增 `calculateAvgFGMultiplier()` 函式供 Pool Builder 使用

---

## 實作方案

### 方案 A：簡化固定值

```typescript
// pool-builder.ts
private calculateBoardScore(board: Board): number {
  let totalScore = /* 現有連線分數計算 */;
  
  // 新增觸發符號價值
  const triggerSymbol = symbols.find(s => s.fsTriggerConfig?.enabled);
  if (!triggerSymbol) return totalScore;

  const count = this.countSymbol(board, triggerSymbol.id);
  const config = triggerSymbol.fsTriggerConfig;
  
  if (count >= config.triggerCount) {
    // 預設 Free Spin 價值 = 次數 × 平均倍率（例如 10 × 5 = 50）
    const freeSpinValue = config.freeSpinCount * 5; // 暫定平均倍率 5x
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
