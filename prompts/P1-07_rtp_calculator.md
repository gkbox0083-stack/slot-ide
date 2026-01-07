# P1-07 RTP Calculator（NG/FG 分開）

## 目標 (Objective)

實作 RTP 計算模組，支援：
- NG RTP 計算
- FG RTP 計算
- 總 RTP 合併計算
- FG 觸發機率計算

---

## 範圍 (Scope)

需要新增的檔案：
- `src/engine/rtp-calculator.ts`

需要修改的檔案：
- `src/analytics/statistics.ts`（如存在）

依賴：
- P1-01（型別定義擴展）
- P1-04（Free Spin 機制）
- P1-06（Pool Builder）

---

## 實作細節 (Implementation Details)

### RTP 計算公式

根據業界標準（參考 `slot_rtp_calculation_zh_tw.md`）：

```
總 RTP = NG RTP + FG RTP 貢獻

FG RTP 貢獻 = P(觸發FG) × E[FG 總獎金] / Bet

其中：
- P(觸發FG) = Scatter >= N 的機率
- E[FG 總獎金] = 預期 Free Spin 次數 × 平均每次 FG 獎金 × Multiplier

預期 Free Spin 次數（含 Retrigger）：
= 初始次數 / (1 - 初始次數 × P(Retrigger))
```

### rtp-calculator.ts 完整實作

```typescript
import type { SymbolDefinition } from '../types/symbol.js';
import type { OutcomeConfig, Outcome } from '../types/outcome.js';
import type { FreeSpinConfig } from '../types/free-spin.js';
import type { BoardConfig } from '../types/board.js';
import { isScatterSymbol, getSymbolWeight } from './symbol-manager.js';

/**
 * RTP 分解結構
 */
export interface RTPBreakdown {
  ngRTP: number;              // Base Game RTP (%)
  fgRTPContribution: number;  // Free Game 對總 RTP 的貢獻 (%)
  totalRTP: number;           // 總 RTP (%)
  fgTriggerProbability: number; // FG 觸發機率 (%)
  expectedFreeSpins: number;  // 預期 Free Spin 次數（含 Retrigger）
  avgFGWinPerSpin: number;    // 平均每次 FG 獎金
}

/**
 * Simulation 結果統計
 */
export interface SimulationStats {
  totalSpins: number;
  ngSpins: number;
  fgSpins: number;
  totalBet: number;
  totalWin: number;
  ngWin: number;
  fgWin: number;
  fgTriggerCount: number;
  hitCount: number;
  maxWin: number;
}

/**
 * 計算 NG RTP（理論值）
 * 基於 Outcome 權重和倍率區間的加權平均
 */
export function calculateTheoreticalNGRTP(ngOutcomes: Outcome[]): number {
  const totalWeight = ngOutcomes.reduce((sum, o) => sum + o.weight, 0);
  
  let weightedSum = 0;
  for (const outcome of ngOutcomes) {
    const probability = outcome.weight / totalWeight;
    const avgMultiplier = (outcome.multiplierRange.min + outcome.multiplierRange.max) / 2;
    weightedSum += probability * avgMultiplier;
  }
  
  return weightedSum * 100; // 轉換為百分比
}

/**
 * 計算 FG RTP（理論值）
 */
export function calculateTheoreticalFGRTP(fgOutcomes: Outcome[]): number {
  const totalWeight = fgOutcomes.reduce((sum, o) => sum + o.weight, 0);
  
  let weightedSum = 0;
  for (const outcome of fgOutcomes) {
    const probability = outcome.weight / totalWeight;
    const avgMultiplier = (outcome.multiplierRange.min + outcome.multiplierRange.max) / 2;
    weightedSum += probability * avgMultiplier;
  }
  
  return weightedSum * 100;
}

/**
 * 計算 Scatter 觸發機率（理論值）
 * 簡化計算：基於符號權重
 */
export function calculateScatterTriggerProbability(
  symbols: SymbolDefinition[],
  boardConfig: BoardConfig,
  triggerCount: number,
  phase: 'ng' | 'fg' = 'ng',
): number {
  const scatterSymbol = symbols.find(isScatterSymbol);
  if (!scatterSymbol) return 0;
  
  const scatterWeight = phase === 'ng' ? scatterSymbol.ngWeight : scatterSymbol.fgWeight;
  const normalSymbols = symbols.filter(s => !isScatterSymbol(s));
  const totalWeight = normalSymbols.reduce((sum, s) => {
    return sum + (phase === 'ng' ? s.ngWeight : s.fgWeight);
  }, 0) + scatterWeight;
  
  const scatterProbPerCell = scatterWeight / totalWeight;
  const totalCells = boardConfig.cols * boardConfig.rows;
  
  // 計算至少出現 triggerCount 個 Scatter 的機率（二項分布）
  // 簡化：使用近似計算
  let probability = 0;
  for (let k = triggerCount; k <= totalCells; k++) {
    probability += binomialProbability(totalCells, k, scatterProbPerCell);
  }
  
  return probability * 100; // 轉換為百分比
}

/**
 * 二項分布機率計算
 */
function binomialProbability(n: number, k: number, p: number): number {
  const coefficient = binomialCoefficient(n, k);
  return coefficient * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

/**
 * 二項係數計算
 */
function binomialCoefficient(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
}

/**
 * 計算預期 Free Spin 次數（含 Retrigger）
 */
export function calculateExpectedFreeSpins(
  baseSpins: number,
  retriggerProbability: number,
  enableRetrigger: boolean,
): number {
  if (!enableRetrigger || retriggerProbability === 0) {
    return baseSpins;
  }
  
  // 公式：n / (1 - n × p_retrigger)
  // 其中 n = 初始次數，p_retrigger = 每次 spin 的 retrigger 機率
  const pPerSpin = retriggerProbability / 100;
  return baseSpins / (1 - baseSpins * pPerSpin);
}

/**
 * 計算完整 RTP 分解（理論值）
 */
export function calculateTheoreticalRTPBreakdown(
  symbols: SymbolDefinition[],
  outcomeConfig: OutcomeConfig,
  freeSpinConfig: FreeSpinConfig,
  boardConfig: BoardConfig,
): RTPBreakdown {
  // 1. 計算 NG RTP
  const ngRTP = calculateTheoreticalNGRTP(outcomeConfig.ngOutcomes);
  
  // 2. 計算 FG 觸發機率
  const fgTriggerProbability = calculateScatterTriggerProbability(
    symbols,
    boardConfig,
    freeSpinConfig.triggerCount,
    'ng',
  );
  
  // 3. 計算 Retrigger 機率（在 FG 中）
  const retriggerProbability = freeSpinConfig.enableRetrigger
    ? calculateScatterTriggerProbability(symbols, boardConfig, freeSpinConfig.triggerCount, 'fg')
    : 0;
  
  // 4. 計算預期 Free Spin 次數
  const expectedFreeSpins = calculateExpectedFreeSpins(
    freeSpinConfig.baseSpinCount,
    retriggerProbability,
    freeSpinConfig.enableRetrigger,
  );
  
  // 5. 計算平均 FG 獎金
  const fgRTPPerSpin = calculateTheoreticalFGRTP(outcomeConfig.fgOutcomes);
  const avgFGWinPerSpin = fgRTPPerSpin / 100; // 轉換為倍率
  
  // 6. 計算 FG 對總 RTP 的貢獻
  // FG RTP 貢獻 = P(觸發) × E[總 FG 獎金]
  // E[總 FG 獎金] = 預期次數 × 平均每次獎金 × Multiplier
  const multiplier = freeSpinConfig.enableMultiplier ? freeSpinConfig.multiplierValue : 1;
  const fgRTPContribution = (fgTriggerProbability / 100) * expectedFreeSpins * avgFGWinPerSpin * multiplier * 100;
  
  // 7. 計算總 RTP
  const totalRTP = ngRTP + fgRTPContribution;
  
  return {
    ngRTP,
    fgRTPContribution,
    totalRTP,
    fgTriggerProbability,
    expectedFreeSpins,
    avgFGWinPerSpin,
  };
}

/**
 * 從 Simulation 結果計算實際 RTP
 */
export function calculateActualRTPFromStats(stats: SimulationStats): RTPBreakdown {
  const ngRTP = stats.totalBet > 0 ? (stats.ngWin / stats.totalBet) * 100 : 0;
  const fgRTPContribution = stats.totalBet > 0 ? (stats.fgWin / stats.totalBet) * 100 : 0;
  const totalRTP = ngRTP + fgRTPContribution;
  
  const fgTriggerProbability = stats.ngSpins > 0 
    ? (stats.fgTriggerCount / stats.ngSpins) * 100 
    : 0;
  
  const avgFGWinPerSpin = stats.fgSpins > 0 
    ? stats.fgWin / stats.fgSpins 
    : 0;
  
  const expectedFreeSpins = stats.fgTriggerCount > 0 
    ? stats.fgSpins / stats.fgTriggerCount 
    : 0;
  
  return {
    ngRTP,
    fgRTPContribution,
    totalRTP,
    fgTriggerProbability,
    expectedFreeSpins,
    avgFGWinPerSpin,
  };
}

/**
 * 計算其他統計指標
 */
export function calculateAdditionalStats(stats: SimulationStats): {
  hitRate: number;
  avgWin: number;
  volatility: string;
} {
  const hitRate = stats.totalSpins > 0 
    ? (stats.hitCount / stats.totalSpins) * 100 
    : 0;
  
  const avgWin = stats.hitCount > 0 
    ? stats.totalWin / stats.hitCount 
    : 0;
  
  // 簡易波動性判斷
  let volatility: string;
  if (hitRate > 35) {
    volatility = '低';
  } else if (hitRate > 25) {
    volatility = '中';
  } else {
    volatility = '高';
  }
  
  return { hitRate, avgWin, volatility };
}
```

---

## 使用範例

```typescript
// 理論值計算
const breakdown = calculateTheoreticalRTPBreakdown(
  symbols,
  outcomeConfig,
  freeSpinConfig,
  boardConfig,
);

console.log(`NG RTP: ${breakdown.ngRTP.toFixed(2)}%`);
console.log(`FG RTP 貢獻: ${breakdown.fgRTPContribution.toFixed(2)}%`);
console.log(`總 RTP: ${breakdown.totalRTP.toFixed(2)}%`);
console.log(`FG 觸發機率: ${breakdown.fgTriggerProbability.toFixed(2)}%`);

// 從 Simulation 結果計算
const actualBreakdown = calculateActualRTPFromStats(simulationStats);
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] `calculateTheoreticalNGRTP` 正確計算 NG RTP
- [ ] `calculateTheoreticalFGRTP` 正確計算 FG RTP
- [ ] `calculateScatterTriggerProbability` 正確計算觸發機率
- [ ] `calculateExpectedFreeSpins` 含 Retrigger 計算正確
- [ ] `calculateTheoreticalRTPBreakdown` 返回完整分解
- [ ] `calculateActualRTPFromStats` 從 Simulation 正確計算
- [ ] 總 RTP = NG RTP + FG RTP 貢獻
- [ ] `npm run build` 成功

---

## 測試案例

### 案例 1：純 NG RTP
```typescript
const ngOutcomes = [
  { id: 'lose', multiplierRange: { min: 0, max: 0 }, weight: 600 },
  { id: 'small', multiplierRange: { min: 1, max: 10 }, weight: 300 },
  { id: 'medium', multiplierRange: { min: 11, max: 50 }, weight: 80 },
];
// 預期 NG RTP ≈ 某個值
```

### 案例 2：FG 觸發機率
```typescript
// 假設 Scatter 權重 = 3，總權重 = 100
// 5x3 盤面 = 15 格
// 至少 3 個 Scatter 的機率 = ?
```

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/engine/rtp-calculator.ts` 完整程式碼
2. 測試案例執行結果
3. 與已知遊戲數據的對照驗證（如適用）

