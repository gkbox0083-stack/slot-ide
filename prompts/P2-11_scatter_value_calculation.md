# P2-11 統一盤面價值計算（含 Free Spin 預期價值）

> **⚠️ 已過時 (DEPRECATED)**
>
> 此任務文件已於 V3 簡化版中標記為過時。
> V3 版本移除了 Free Spin 機制，此計算方式已被回滾。
> Scatter 現採用直接賦值模式（ScatterPayoutConfig）。
> 保留此文件僅供歷史參考。

---

## 問題背景

### 產品目標

設計師需要「快速驗證想法的工具」，而目前的 Pool Builder 無法正確處理觸發 Free Spin 的盤面價值。

### 當前問題

Pool Builder 計算盤面分數時，只計算連線得分，**忽略了 Scatter 觸發 Free Spin 的預期價值**，導致：

1. **高 Scatter 權重時**：難以建出含多個 Scatter 的盤面（因為連線分數低，被篩掉）
2. **盤面價值歸類錯誤**：觸發 FS 的盤面本應是「高價值」，卻被歸類為「低分」Outcome

### 實際案例

測試設定：
- 符號：L4 (ngWeight: 45)、Scatter (ngWeight: 3000, fsTriggerConfig.enabled: true)
- Outcome：大獎 (倍率 50x-100x)

結果：
- 雖然 Scatter 權重佔 98.5%，但無法建出符合「大獎」Outcome 的盤面
- 因為 3 Scatter + 0 連線 = 分數 0，被篩掉

---

## 業界標準做法

### PAR Sheet 盤面價值公式

根據市場研究，商用老虎機使用統一的盤面價值計算公式：

```
Board Value = Σ(Line Wins) + Σ(Scatter Pays) + E[Bonus Value]
```

### RTP 貢獻分布

| 組成 | 典型 RTP 貢獻 |
|------|---------------|
| Base game line wins | 55-70% |
| Scatter direct pays | 2-5% |
| **Free Spins/Bonus features** | **25-40%** |

### Free Spin 預期價值公式

```
E[FSValue] = expectedSpins × avgFGWinPerSpin × multiplier
```

考慮 Retrigger 時：
```
expectedSpins = freeSpinCount / (1 - freeSpinCount × retriggerProbability)
```

---

## 解決方案

### 前提條件

> [!IMPORTANT]
> **FG Outcomes 必須先於 NG Pool 建池前設定完成**
> 
> 因為 NG 盤面分數計算需要參考 FG Outcomes 的平均倍率來估算 FS 預期價值。
> 如果 FG Outcomes 為空，將使用預設值（5x）作為 fallback。

### 設計假設

> [!NOTE]
> **Scatter 觸發不受位置限制**
> 
> 本方案假設 Scatter 符號在盤面任意位置皆可計入觸發數量。
> 如需位置約束（如僅 Reel 2/3/4），需擴展 `fsTriggerConfig` 增加 `validReels` 屬性。

### 設計原則

> [!IMPORTANT]
> **單一計算標準**
> 
> Pool Builder 與 RTP Calculator 必須使用**相同的計算邏輯**，確保盤面分數與理論 RTP 一致。
> 透過引用 `rtp-calculator.ts` 的共用函式實現。

在 Pool Builder 建池時，採用業界標準公式計算完整盤面價值：

```typescript
// 僅 NG Pool 建池時計算 FS 預期價值
BoardValue = LineWins + (triggersFS && phase === 'ng' ? E[FSValue] : 0)
```

### NG/FG 分離說明

> [!NOTE]
> **NG Pool 建池**：計算連線分數 + FS 預期價值（如觸發）
> 
> **FG Pool 建池**：僅計算連線分數（Retrigger 價值已在 NG 公式中處理）

### 核心邏輯

當 NG 盤面包含 >= `triggerCount` 的觸發符號時：
1. 計算連線得分（現有邏輯）
2. **加上 Free Spin 預期價值**（新增）
3. 將總價值與 Outcome 倍率區間比對

---

## Proposed Changes

### Engine Layer

#### [MODIFY] [pool-builder.ts](file:///d:/Projects/slot-ide/src/engine/pool-builder.ts)

新增 import：

```typescript
import { 
  calculateFSTriggerProbability, 
  calculateExpectedFreeSpins 
} from './rtp-calculator.js';
```

修改 `calculateBoardScore()` 函式，新增 `phase` 參數：

```typescript
/**
 * 計算盤面分數（所有中獎線的總分 + FS 預期價值）
 * 遍歷所有線，累加所有中獎線的 payout
 * 如果是 NG 盤面且觸發 FS，加上 Free Spin 的預期價值
 * @param board 盤面
 * @param phase 遊戲階段（ng 或 fg）
 */
private calculateBoardScore(board: Board, phase: 'ng' | 'fg' = 'ng'): number {
  const patterns = this.linesManager.getAllPatterns();
  let totalScore = 0;

  // 1. 計算連線得分
  for (const pattern of patterns) {
    const lineResult = this.calculateLineMatch(board, pattern.positions);
    if (lineResult) {
      const payout = this.symbolManager.getPayout(lineResult.symbol, lineResult.count);
      totalScore += payout;
    }
  }

  // 2. 僅 NG 盤面計算 Free Spin 觸發價值
  if (phase === 'ng') {
    totalScore += this.calculateFSExpectedValue(board);
  }

  return totalScore;
}

/**
 * 計算 Free Spin 預期價值
 * 與 rtp-calculator.ts 使用相同的計算邏輯，確保單一真相來源
 */
private calculateFSExpectedValue(board: Board): number {
  const symbols = this.symbolManager.getAll();
  const triggerSymbol = symbols.find(s => s.fsTriggerConfig?.enabled);

  if (!triggerSymbol?.fsTriggerConfig) {
    return 0;
  }

  const config = triggerSymbol.fsTriggerConfig;
  const count = this.countSymbol(board, triggerSymbol.id);

  if (count < config.triggerCount) {
    return 0;
  }

  // 從 FG Outcomes 計算平均倍率
  const avgFgMultiplier = this.getAvgFgMultiplier();

  // 計算 Multiplier
  const multiplier = config.enableMultiplier ? config.multiplierValue : 1;

  // 計算預期 Spin 次數（與 rtp-calculator.ts 相同邏輯）
  const expectedSpins = this.calculateExpectedSpins(config);

  return expectedSpins * avgFgMultiplier * multiplier;
}

/**
 * 計算預期 Spin 次數（含 Retrigger）
 * 使用與 rtp-calculator.ts 相同的二項分布計算
 */
private calculateExpectedSpins(config: FreeSpinTriggerConfig): number {
  if (!config.enableRetrigger) {
    return config.freeSpinCount;
  }

  // 計算 FG 中的 Retrigger 機率（使用 rtp-calculator.ts 的函式）
  const retriggerProbability = calculateFSTriggerProbability(
    this.symbolManager.getAll(),
    this.boardConfig,
    'fg'
  );

  // 使用 rtp-calculator.ts 的函式計算預期次數
  return calculateExpectedFreeSpins(
    config.freeSpinCount,
    retriggerProbability,
    config.enableRetrigger
  );
}

/**
 * 計算盤面上特定符號的數量
 * ⚠️ 假設：Scatter 觸發不受位置限制（全盤面任意位置皆可）
 *    如需位置約束，需擴展 fsTriggerConfig 增加 validReels 屬性
 */
private countSymbol(board: Board, symbolId: SymbolId): number {
  let count = 0;
  for (const reel of board.reels) {
    for (const id of reel) {
      if (id === symbolId) {
        count++;
      }
    }
  }
  return count;
}

/**
 * 取得 FG 平均倍率
 * 從 FG Outcomes 計算加權平均，作為 Free Spin 預期價值的基礎
 */
private getAvgFgMultiplier(): number {
  const fgOutcomes = this.outcomeManager.getAll().filter(o => o.phase === 'fg');
  
  if (fgOutcomes.length === 0) {
    return 5; // 預設值，當沒有設定 FG Outcomes 時使用
  }

  // 計算 FG Outcomes 的加權平均倍率
  let totalWeight = 0;
  let weightedSum = 0;

  for (const outcome of fgOutcomes) {
    const avgMultiplier = (outcome.multiplierRange.min + outcome.multiplierRange.max) / 2;
    totalWeight += outcome.weight;
    weightedSum += avgMultiplier * outcome.weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 5;
}
```

---

### 調用處修改

在 `buildPools()` 中，根據 Outcome 的 phase 傳遞正確的參數：

```typescript
// 在 buildPools() 中
for (const outcome of outcomes) {
  // ... 現有邏輯 ...
  
  while (pool.length < targetCap && attempts < maxAttempts) {
    attempts++;
    const board = this.generateRandomBoard();
    
    // 根據 Outcome 的 phase 計算分數（Outcome.phase 型別已定義於 types/outcome.ts）
    const score = this.calculateBoardScore(board, outcome.phase);
    
    if (score >= outcome.multiplierRange.min && score <= outcome.multiplierRange.max) {
      pool.push(board);
    }
  }
  // ...
}
```

---

## 驗收條件

- [ ] Pool Builder 在計算 NG 盤面分數時包含 Free Spin 預期價值
- [ ] Pool Builder 在計算 FG 盤面分數時不包含 FS 預期價值
- [ ] 高 Scatter 權重時，能正確建出含 3+ Scatter 的盤面
- [ ] 觸發 FS 的盤面被歸類到合理的 Outcome（考慮 FS 貢獻）
- [ ] Pool Builder 與 RTP Calculator 使用相同的 `calculateExpectedFreeSpins()` 函式
- [ ] Simulation RTP 與理論 RTP 差距 < 1%（10 萬次模擬）或 < 2%（1 萬次模擬）
- [ ] Multiplier 啟用時，FS 預期價值正確倍增
- [ ] `npm run build` 成功

---

## Verification Plan

### Manual Verification

1. **FS 盤面建池測試**
   - 開啟 `http://localhost:5173`
   - 設定 Scatter ngWeight = 3000
   - 設定 NG Outcome「大獎」倍率 50x-150x
   - 設定 FG Outcome 平均倍率 ≈ 5x
   - 設定 freeSpinCount = 10，multiplier = 2
   - Build Pool
   - ✅ 預期：「大獎」Pool 中可見含 3+ Scatter 的盤面

2. **RTP 驗證**
   - 進行 100,000 次模擬
   - ✅ 預期：實際 RTP 接近理論 RTP（差距 < 1%）

3. **FS 觸發頻率驗證**
   - 記錄模擬中 FS 觸發次數
   - ✅ 預期：觸發頻率與 Scatter 權重計算的理論值接近

4. **NG/FG 分離驗證**
   - 檢查 NG Pool 中的 FS 觸發盤面是否被正確歸類
   - 檢查 FG Pool 中的盤面分數計算是否只有連線分數

5. **單一計算標準驗證**
   - 確認 `pool-builder.ts` 引用 `rtp-calculator.ts` 的函式
   - 確認無重複的計算邏輯

### 數值驗證

| 測試情境 | 輸入參數 | 預期 FS 價值 |
|---------|---------|-------------|
| 基本 FS 觸發 | freeSpinCount=10, avgFG=5x, multiplier=1, retrigger=off | 10 × 5 × 1 = **50** |
| 啟用 Multiplier | freeSpinCount=10, avgFG=5x, multiplier=2, retrigger=off | 10 × 5 × 2 = **100** |
| 啟用 Retrigger | freeSpinCount=10, avgFG=5x, multiplier=2, retrigger=on | expectedSpins × 5 × 2（依二項分布計算） |
| FG Outcomes 為空 | freeSpinCount=10, avgFG=5x(fallback), multiplier=1 | 10 × 5 × 1 = **50** |

### 邊界條件測試

| 測試情境 | 預期結果 |
|---------|---------|
| Scatter 數量 = triggerCount - 1 | FS 預期價值 = 0 |
| FG Outcomes 為空 | 使用 fallback 值 5x |
| multiplier 未啟用 | multiplier = 1（不額外倍增） |
| Retrigger 未啟用 | expectedSpins = freeSpinCount（無增加） |

---

## 產品說明

### 設計師使用體驗

**修改前（問題）**：
1. 設計師設定高 Scatter 權重
2. 設定高倍率 Outcome
3. Build Pool → 失敗或 Scatter 很少
4. 設計師困惑

**修改後（解決）**：
1. 設計師同樣設定
2. Build Pool → 成功
3. 可選：UI 顯示「此 Outcome Pool 中 X% 為 FS 觸發盤面」

### 符合業界認知

- 公式來源：PAR Sheet 標準
- 概念對齊：`Total RTP = Base RTP + FS Contribution`
- 無需學習新概念

---

## 風險評估

> [!WARNING]
> 此修改會改變 Pool 建立邏輯。建議：
> 1. 實作後進行大量 Simulation 驗證 RTP
> 2. 檢查各 Outcome Pool 的盤面組成是否合理

> [!NOTE]
> **模組依賴說明**
> 
> 本方案使 `pool-builder.ts` 依賴 `rtp-calculator.ts` 的計算函式。
> 這是刻意設計，確保 Pool Builder 與 RTP Calculator 使用單一真相來源。

---

## 後續增強（Out of Scope）

以下項目不在 P2-11 範圍內，記錄為後續增強：

1. **UI 警告提示**：當 FG Outcomes 為空時，在 Build Pool 按鈕旁顯示警告
2. **位置約束支援**：擴展 `fsTriggerConfig` 增加 `validReels: number[]` 屬性
3. **Pool 盤面統計**：在 UI 顯示「此 Outcome Pool 中 X% 為 FS 觸發盤面」

---

## 相關 Issue

- P2-09 Free Spin 觸發修復（已完成）
- P2-10 Free Spin 控制整合（已完成）
- P1-06 Pool Builder NG/FG 分離

## 參考資料

- 市場研究報告：`compass_artifact_wf-beadfb1f-a381-419f-a325-7cce62dfee17_text_markdown.md`
- RTP 計算邏輯：[rtp-calculator.ts](file:///d:/Projects/slot-ide/src/engine/rtp-calculator.ts)
- Outcome 型別定義：[outcome.ts](file:///d:/Projects/slot-ide/src/types/outcome.ts)
