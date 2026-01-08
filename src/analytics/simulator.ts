import type { VisualConfig } from '../types/visual.js';
import type { SpinExecutor } from '../engine/spin-executor.js';
import type { OutcomeManager } from '../engine/outcome-manager.js';
import type { Statistics } from './statistics.js';
import { calculateStatistics } from './statistics.js';

/**
 * 模擬配置
 */
export interface SimulationConfig {
  count: number;           // 模擬次數
  baseBet: number;         // 單次投注
  visualConfig: VisualConfig;
}

/**
 * 單次 Spin 結果
 */
export interface SpinResult {
  index: number;           // 第幾次 (1-based)
  outcomeId: string;
  outcomeName: string;
  win: number;
  bet: number;
  profit: number;          // win - bet
  cumulativeProfit: number; // 累積盈虧
}

/**
 * 模擬結果
 */
export interface SimulationResult {
  spins: SpinResult[];
  statistics: Statistics;  // 從 statistics.ts 匯入
  duration: number;        // 執行時間 (ms)
}

/**
 * 進度回調
 */
export type ProgressCallback = (progress: number, current: number, total: number) => void;

/**
 * Simulator 類別
 */
export class Simulator {
  private aborted = false;

  constructor(
    private spinExecutor: SpinExecutor,
    private outcomeManager: OutcomeManager
  ) {}

  /**
   * 同步執行模擬
   */
  run(config: SimulationConfig): SimulationResult {
    const startTime = performance.now();
    const spins: SpinResult[] = [];
    let cumulativeProfit = 0;

    for (let i = 0; i < config.count; i++) {
      // 使用 Engine 的 spin（不可自己產生亂數）
      const spinPacket = this.spinExecutor.spin(config.visualConfig, undefined, 'base', 1, config.baseBet);
      
      const win = spinPacket.meta?.win ?? 0;
      const profit = win - config.baseBet;
      cumulativeProfit += profit;

      // 取得 Outcome 名稱
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
   * 非同步執行模擬（支援進度回調）
   * 使用 setTimeout 分批執行，避免阻塞 UI
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
      const batchSize = 100; // 每批執行 100 次

      const processBatch = () => {
        if (this.aborted) {
          // 如果被中止，返回目前結果
          const duration = performance.now() - startTime;
          const statistics = calculateStatistics(spins, config.baseBet, this.outcomeManager);
          resolve({ spins, statistics, duration });
          return;
        }

        const end = Math.min(current + batchSize, config.count);
        
        for (let i = current; i < end; i++) {
          const spinPacket = this.spinExecutor.spin(config.visualConfig, undefined, 'base', 1, config.baseBet);
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
          setTimeout(processBatch, 0); // 讓出控制權給 UI
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

