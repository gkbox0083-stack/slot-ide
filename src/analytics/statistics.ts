import type { SpinResult } from './simulator.js';
import type { OutcomeManager } from '../engine/outcome-manager.js';

/**
 * Outcome 分佈
 */
export interface OutcomeDistribution {
  outcomeId: string;
  outcomeName: string;
  count: number;
  percentage: number;
  expectedPercentage: number;  // 理論機率
}

/**
 * 統計摘要
 */
export interface Statistics {
  totalSpins: number;
  totalBet: number;
  totalWin: number;
  rtp: number;               // (totalWin / totalBet) * 100
  hitRate: number;           // (中獎次數 / totalSpins) * 100
  hitCount: number;          // 中獎次數 (win > 0)
  avgWin: number;            // totalWin / hitCount（中獎時的平均獲勝）
  avgWinPerSpin: number;     // totalWin / totalSpins（每次 Spin 平均獲勝）
  maxWin: number;
  minWin: number;
  maxProfit: number;         // 最高累積盈虧
  minProfit: number;         // 最低累積盈虧
  outcomeDistribution: OutcomeDistribution[];
}

/**
 * 計算 Outcome 分佈
 */
function calculateOutcomeDistribution(
  spins: SpinResult[],
  outcomeManager: OutcomeManager
): OutcomeDistribution[] {
  // 取得所有 Outcome 的理論機率
  const allProbabilities = outcomeManager.getAllProbabilities();
  
  // 統計每個 Outcome 的出現次數
  const outcomeCounts = new Map<string, number>();
  for (const spin of spins) {
    const count = outcomeCounts.get(spin.outcomeId) || 0;
    outcomeCounts.set(spin.outcomeId, count + 1);
  }

  // 建立分佈列表
  const distribution: OutcomeDistribution[] = [];
  const totalSpins = spins.length;

  for (const prob of allProbabilities) {
    const count = outcomeCounts.get(prob.id) || 0;
    const percentage = totalSpins > 0 ? (count / totalSpins) * 100 : 0;
    
    distribution.push({
      outcomeId: prob.id,
      outcomeName: prob.name,
      count,
      percentage,
      expectedPercentage: prob.probability,
    });
  }

  return distribution;
}

/**
 * 取得空的統計數據
 */
function getEmptyStatistics(): Statistics {
  return {
    totalSpins: 0,
    totalBet: 0,
    totalWin: 0,
    rtp: 0,
    hitRate: 0,
    hitCount: 0,
    avgWin: 0,
    avgWinPerSpin: 0,
    maxWin: 0,
    minWin: 0,
    maxProfit: 0,
    minProfit: 0,
    outcomeDistribution: [],
  };
}

/**
 * 計算統計數據
 */
export function calculateStatistics(
  spins: SpinResult[],
  baseBet: number,
  outcomeManager: OutcomeManager
): Statistics {
  if (spins.length === 0) {
    return getEmptyStatistics();
  }

  const totalSpins = spins.length;
  const totalBet = totalSpins * baseBet;
  const totalWin = spins.reduce((sum, s) => sum + s.win, 0);
  const hitCount = spins.filter(s => s.win > 0).length;

  // RTP
  const rtp = totalBet > 0 ? (totalWin / totalBet) * 100 : 0;

  // Hit Rate
  const hitRate = totalSpins > 0 ? (hitCount / totalSpins) * 100 : 0;

  // Avg Win
  const avgWin = hitCount > 0 ? totalWin / hitCount : 0;
  const avgWinPerSpin = totalSpins > 0 ? totalWin / totalSpins : 0;

  // Max/Min
  const wins = spins.map(s => s.win);
  const maxWin = Math.max(...wins);
  const minWin = Math.min(...wins);

  const profits = spins.map(s => s.cumulativeProfit);
  const maxProfit = Math.max(...profits);
  const minProfit = Math.min(...profits);

  // Outcome 分佈
  const outcomeDistribution = calculateOutcomeDistribution(spins, outcomeManager);

  return {
    totalSpins,
    totalBet,
    totalWin,
    rtp,
    hitRate,
    hitCount,
    avgWin,
    avgWinPerSpin,
    maxWin,
    minWin,
    maxProfit,
    minProfit,
    outcomeDistribution,
  };
}

