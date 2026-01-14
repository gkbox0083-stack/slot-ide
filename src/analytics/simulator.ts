import type { VisualConfig } from '../types/visual.js';
import type { SpinExecutor } from '../engine/spin-executor.js';
import type { OutcomeManager } from '../engine/outcome-manager.js';
import type { Statistics } from './statistics.js';
import { calculateStatistics } from './statistics.js';

/**
 * 模擬配置
 */
export interface SimulationConfig {
  count: number;
  baseBet: number;
  visualConfig: VisualConfig;
}

/**
 * 單次 Spin 結果
 */
export interface SpinResult {
  index: number;
  outcomeId: string;
  outcomeName: string;
  win: number;
  bet: number;
  profit: number;
  cumulativeProfit: number;
}

/**
 * 模擬結果
 */
export interface SimulationResult {
  spins: SpinResult[];
  statistics: Statistics;
  duration: number;
}

/**
 * 進度回調
 */
export type ProgressCallback = (progress: number, current: number, total: number) => void;

/**
 * Simulator 類別（V3 簡化版）
 */
export class Simulator {
  private aborted = false;

  constructor(
    private spinExecutor: SpinExecutor,
    private outcomeManager: OutcomeManager
  ) { }

  /**
   * 同步執行模擬（V3 簡化版）
   */
  run(config: SimulationConfig): SimulationResult {
    const startTime = performance.now();
    const spins: SpinResult[] = [];
    let cumulativeProfit = 0;

    for (let i = 0; i < config.count; i++) {
      // V3: 移除 phase 參數
      const spinPacket = this.spinExecutor.spin(config.visualConfig, undefined, config.baseBet);

      const win = spinPacket.meta?.win ?? 0;
      const profit = win - config.baseBet;
      cumulativeProfit += profit;

      const outcome = this.outcomeManager.getById(spinPacket.meta?.outcomeId ?? '');

      spins.push({
        index: i + 1,
        outcomeId: spinPacket.meta?.outcomeId ?? '',
        outcomeName: outcome?.name ?? '未知',
        win,
        bet: config.baseBet,
        profit,
        cumulativeProfit,
      });
    }

    const duration = performance.now() - startTime;
    const statistics = calculateStatistics(spins, config.baseBet, this.outcomeManager);

    return { spins, statistics, duration };
  }

  /**
   * 非同步執行模擬（V3 簡化版）
   */
  async runAsync(
    config: SimulationConfig,
    onProgress?: ProgressCallback
  ): Promise<SimulationResult> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const spins: SpinResult[] = [];
      let cumulativeProfit = 0;
      let current = 0;
      const batchSize = 100;

      const processBatch = () => {
        if (this.aborted) {
          const duration = performance.now() - startTime;
          const statistics = calculateStatistics(spins, config.baseBet, this.outcomeManager);
          resolve({ spins, statistics, duration });
          return;
        }

        const end = Math.min(current + batchSize, config.count);

        for (let i = current; i < end; i++) {
          // V3: 移除 phase 參數
          const spinPacket = this.spinExecutor.spin(config.visualConfig, undefined, config.baseBet);
          const win = spinPacket.meta?.win ?? 0;
          const profit = win - config.baseBet;
          cumulativeProfit += profit;

          const outcome = this.outcomeManager.getById(spinPacket.meta?.outcomeId ?? '');

          spins.push({
            index: i + 1,
            outcomeId: spinPacket.meta?.outcomeId ?? '',
            outcomeName: outcome?.name ?? '未知',
            win,
            bet: config.baseBet,
            profit,
            cumulativeProfit,
          });
        }

        current = end;

        if (onProgress) {
          onProgress(current / config.count, current, config.count);
        }

        if (current < config.count) {
          setTimeout(processBatch, 0);
        } else {
          const duration = performance.now() - startTime;
          const statistics = calculateStatistics(spins, config.baseBet, this.outcomeManager);
          resolve({ spins, statistics, duration });
        }
      };

      this.aborted = false;
      processBatch();
    });
  }

  /**
   * 中止模擬
   */
  abort(): void {
    this.aborted = true;
  }
}
