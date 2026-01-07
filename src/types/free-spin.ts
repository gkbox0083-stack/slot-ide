import type { Board } from './board.js';

/**
 * Free Spin 模式
 */
export type FreeSpinMode = 'base' | 'free';

/**
 * Free Spin 配置
 */
export interface FreeSpinConfig {
  enabled: boolean;            // 是否啟用 Free Spin 功能
  triggerCount: number;        // Scatter 觸發數量
  baseSpinCount: number;       // 基礎 Free Spin 次數
  enableRetrigger: boolean;    // 是否支援 Retrigger
  retriggerSpinCount: number;  // Retrigger 給予的額外次數
  enableMultiplier: boolean;   // 是否啟用 Multiplier
  multiplierValue: number;     // Multiplier 倍率
}

/**
 * Free Spin 狀態
 */
export interface FreeSpinState {
  mode: FreeSpinMode;
  remainingSpins: number;
  totalSpins: number;
  accumulatedWin: number;
  currentMultiplier: number;
  triggerCount: number;        // 本輪觸發的 Scatter 數量
}

/**
 * Free Spin 單次結果
 */
export interface FreeSpinResult {
  spinIndex: number;
  board: Board;
  win: number;
  multipliedWin: number;
  isRetrigger: boolean;
}

