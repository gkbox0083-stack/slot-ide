import type { SymbolDefinition } from '../types/symbol.js';
import type { Outcome } from '../types/outcome.js';
import type { BoardConfig } from '../types/board.js';

/**
 * RTP 分解結構（V3 簡化版）
 */
export interface RTPBreakdown {
  lineRTP: number;              // 連線 RTP (%)
  scatterRTP: number;           // Scatter 直接賦值 RTP (%)
  totalRTP: number;             // 總 RTP (%)
}

/**
 * Simulation 結果統計（V3 簡化版）
 */
export interface SimulationStats {
  totalSpins: number;
  totalBet: number;
  totalWin: number;
  lineWin: number;              // 連線獲勝
  scatterWin: number;           // Scatter 直接獲勝
  hitCount: number;
  maxWin: number;
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
 * 計算理論 Line RTP（V3 簡化版）
 * 基於 Outcome 權重和倍率區間的加權平均
 */
export function calculateTheoreticalLineRTP(outcomes: Outcome[]): number {
  const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);

  if (totalWeight === 0) return 0;

  let weightedSum = 0;
  for (const outcome of outcomes) {
    const probability = outcome.weight / totalWeight;
    const avgMultiplier = (outcome.multiplierRange.min + outcome.multiplierRange.max) / 2;
    weightedSum += probability * avgMultiplier;
  }

  return weightedSum * 100; // 轉換為百分比
}

/**
 * 計算 Scatter 直接賦值的 RTP 貢獻（V3 新增）
 * 基於二項分布計算各數量的機率，乘以對應賠率
 */
export function calculateScatterRTPContribution(
  symbols: SymbolDefinition[],
  boardConfig: BoardConfig
): number {
  const scatterSymbol = symbols.find(s => s.scatterPayoutConfig);
  if (!scatterSymbol?.scatterPayoutConfig) return 0;

  const config = scatterSymbol.scatterPayoutConfig;
  const probPerCell = 1 / symbols.length; // 均勻分布
  const totalCells = boardConfig.cols * boardConfig.rows;

  let contribution = 0;
  for (let count = config.minCount; count <= totalCells; count++) {
    const prob = binomialProbability(totalCells, count, probPerCell);
    const payout = config.payoutByCount[count] ?? 0;
    contribution += prob * payout;
  }

  return contribution * 100; // 轉換為百分比
}

/**
 * 計算完整 RTP 分解（V3 簡化版）
 * Total RTP = Line RTP + Scatter RTP
 */
export function calculateTheoreticalRTPBreakdown(
  symbols: SymbolDefinition[],
  outcomes: Outcome[],
  boardConfig: BoardConfig,
): RTPBreakdown {
  const lineRTP = calculateTheoreticalLineRTP(outcomes);
  const scatterRTP = calculateScatterRTPContribution(symbols, boardConfig);
  const totalRTP = lineRTP + scatterRTP;

  return {
    lineRTP,
    scatterRTP,
    totalRTP,
  };
}

/**
 * 從 Simulation 結果計算實際 RTP（V3 簡化版）
 */
export function calculateActualRTPFromStats(stats: SimulationStats): RTPBreakdown {
  const lineRTP = stats.totalBet > 0 ? (stats.lineWin / stats.totalBet) * 100 : 0;
  const scatterRTP = stats.totalBet > 0 ? (stats.scatterWin / stats.totalBet) * 100 : 0;
  const totalRTP = lineRTP + scatterRTP;

  return {
    lineRTP,
    scatterRTP,
    totalRTP,
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
 * 格式化 RTP 分解為顯示用字串（V3 簡化版）
 */
export function formatRTPBreakdown(breakdown: RTPBreakdown): string {
  return `
Line RTP: ${breakdown.lineRTP.toFixed(2)}%
Scatter RTP: ${breakdown.scatterRTP.toFixed(2)}%
總 RTP: ${breakdown.totalRTP.toFixed(2)}%
`.trim();
}
