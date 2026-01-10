import type { SymbolDefinition } from '../types/symbol.js';
import type { OutcomeConfig, Outcome } from '../types/outcome.js';
import type { FreeSpinConfig } from '../types/free-spin.js';
import type { BoardConfig } from '../types/board.js';

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

  if (totalWeight === 0) return 0;

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

  if (totalWeight === 0) return 0;

  let weightedSum = 0;
  for (const outcome of fgOutcomes) {
    const probability = outcome.weight / totalWeight;
    const avgMultiplier = (outcome.multiplierRange.min + outcome.multiplierRange.max) / 2;
    weightedSum += probability * avgMultiplier;
  }

  return weightedSum * 100;
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
 * 二項分布機率計算
 */
function binomialProbability(n: number, k: number, p: number): number {
  const coefficient = binomialCoefficient(n, k);
  return coefficient * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

/**
 * 計算 Free Spin 觸發機率（理論值）
 * 基於符號權重及二項分布
 */
export function calculateFSTriggerProbability(
  symbols: SymbolDefinition[],
  boardConfig: BoardConfig,
  phase: 'ng' | 'fg' = 'ng',
): number {
  const triggerSymbol = symbols.find(s => s.fsTriggerConfig?.enabled);
  if (!triggerSymbol || !triggerSymbol.fsTriggerConfig) return 0;

  const weight = phase === 'ng' ? triggerSymbol.ngWeight : triggerSymbol.fgWeight;
  const totalWeight = symbols.reduce((sum, s) => {
    return sum + (phase === 'ng' ? s.ngWeight : s.fgWeight);
  }, 0);

  if (totalWeight === 0) return 0;

  const probPerCell = weight / totalWeight;
  const totalCells = boardConfig.cols * boardConfig.rows;
  const triggerCount = triggerSymbol.fsTriggerConfig.triggerCount;

  // 計算至少出現 triggerCount 個符號的機率（二項分布）
  let probability = 0;
  for (let k = triggerCount; k <= totalCells; k++) {
    probability += binomialProbability(totalCells, k, probPerCell);
  }

  return probability * 100; // 轉換為百分比
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
  const denominator = 1 - baseSpins * pPerSpin;

  // 防止除以零或負數
  if (denominator <= 0) {
    return baseSpins * 2; // 回退到合理的上限
  }

  return baseSpins / denominator;
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

  // P2-10: 優先取得符號內定義的 FS 觸發配置
  const triggerSymbol = symbols.find(s => s.fsTriggerConfig?.enabled);
  const activeFSConfig = triggerSymbol?.fsTriggerConfig || freeSpinConfig;

  // 如果 Free Spin 未啟用，只返回 NG RTP
  if (!activeFSConfig.enabled) {
    return {
      ngRTP,
      fgRTPContribution: 0,
      totalRTP: ngRTP,
      fgTriggerProbability: 0,
      expectedFreeSpins: 0,
      avgFGWinPerSpin: 0,
    };
  }

  // 2. 計算 FG 觸發機率
  const fgTriggerProbability = calculateFSTriggerProbability(
    symbols,
    boardConfig,
    'ng',
  );

  // 3. 計算 Retrigger 機率（在 FG 中）
  const retriggerProbability = activeFSConfig.enableRetrigger
    ? calculateFSTriggerProbability(symbols, boardConfig, 'fg')
    : 0;

  // 4. 計算預期 Free Spin 次數
  const expectedFreeSpins = calculateExpectedFreeSpins(
    activeFSConfig.freeSpinCount,
    retriggerProbability,
    activeFSConfig.enableRetrigger,
  );

  // 5. 計算平均 FG 獎金
  const fgRTPPerSpin = calculateTheoreticalFGRTP(outcomeConfig.fgOutcomes);
  const avgFGWinPerSpin = fgRTPPerSpin / 100; // 轉換為倍率

  // 6. 計算 FG 對總 RTP 的貢獻
  const multiplier = activeFSConfig.enableMultiplier ? activeFSConfig.multiplierValue : 1;
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

/**
 * 格式化 RTP 分解為顯示用字串
 */
export function formatRTPBreakdown(breakdown: RTPBreakdown): string {
  return `
NG RTP: ${breakdown.ngRTP.toFixed(2)}%
FG RTP 貢獻: ${breakdown.fgRTPContribution.toFixed(2)}%
總 RTP: ${breakdown.totalRTP.toFixed(2)}%
FG 觸發機率: ${breakdown.fgTriggerProbability.toFixed(4)}%
預期 Free Spin 次數: ${breakdown.expectedFreeSpins.toFixed(2)}
平均 FG 獎金/次: ${breakdown.avgFGWinPerSpin.toFixed(2)}x
`.trim();
}

