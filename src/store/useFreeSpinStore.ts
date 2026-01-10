import { create } from 'zustand';
import type { FreeSpinState, FreeSpinResult, FreeSpinConfig } from '../types/free-spin.js';

/**
 * Free Spin Store 狀態
 */
interface FreeSpinStoreState extends FreeSpinState {
  // 配置
  config: FreeSpinConfig;

  // 歷史紀錄
  history: FreeSpinResult[];
}

/**
 * Free Spin Store Actions
 */
interface FreeSpinStoreActions {
  // 配置管理
  setConfig: (config: FreeSpinConfig) => void;

  // 狀態管理
  triggerFreeSpin: (scatterCount: number, config: FreeSpinConfig) => void;
  consumeSpin: () => void;
  addWin: (win: number) => void;
  retrigger: (additionalSpins: number) => void;
  endFreeSpin: () => number; // 返回累積獎金
  reset: () => void;

  // 歷史紀錄
  addHistory: (result: FreeSpinResult) => void;
  clearHistory: () => void;
}

/**
 * 預設 Free Spin 配置
 */
const defaultConfig: FreeSpinConfig = {
  enabled: true,
  triggerCount: 3,
  freeSpinCount: 10,
  enableRetrigger: true,
  retriggerSpinCount: 5,
  enableMultiplier: true,
  multiplierValue: 2,
};

/**
 * 初始狀態
 */
const initialState: FreeSpinStoreState = {
  mode: 'base',
  remainingSpins: 0,
  totalSpins: 0,
  accumulatedWin: 0,
  currentMultiplier: 1,
  triggerCount: 0,
  config: defaultConfig,
  history: [],
};

/**
 * Free Spin Store
 * 管理 Free Spin 狀態（唯一管理處，P0 約束）
 */
export const useFreeSpinStore = create<FreeSpinStoreState & FreeSpinStoreActions>()(
  (set, get) => ({
    ...initialState,

    setConfig: (config) => set({ config }),

    triggerFreeSpin: (scatterCount, config) => {
      const spins = config.freeSpinCount;
      const multiplier = config.enableMultiplier ? config.multiplierValue : 1;

      set({
        mode: 'free',
        remainingSpins: spins,
        totalSpins: spins,
        accumulatedWin: 0,
        currentMultiplier: multiplier,
        triggerCount: scatterCount,
        config,
        history: [],
      });
    },

    consumeSpin: () => {
      set((state) => ({
        remainingSpins: Math.max(0, state.remainingSpins - 1),
      }));
    },

    addWin: (win) => {
      set((state) => ({
        accumulatedWin: state.accumulatedWin + win,
      }));
    },

    retrigger: (additionalSpins) => {
      set((state) => ({
        remainingSpins: state.remainingSpins + additionalSpins,
        totalSpins: state.totalSpins + additionalSpins,
      }));
    },

    endFreeSpin: () => {
      const { accumulatedWin } = get();
      set({
        mode: 'base',
        remainingSpins: 0,
        totalSpins: 0,
        currentMultiplier: 1,
        triggerCount: 0,
      });
      return accumulatedWin;
    },

    reset: () => set(initialState),

    addHistory: (result) => {
      set((state) => ({
        history: [...state.history, result],
      }));
    },

    clearHistory: () => set({ history: [] }),
  })
);

// Selectors
export const selectFreeSpinMode = (state: FreeSpinStoreState) => state.mode;
export const selectIsInFreeSpin = (state: FreeSpinStoreState) => state.mode === 'free';
export const selectRemainingSpins = (state: FreeSpinStoreState) => state.remainingSpins;
export const selectAccumulatedWin = (state: FreeSpinStoreState) => state.accumulatedWin;
export const selectCurrentMultiplier = (state: FreeSpinStoreState) => state.currentMultiplier;

/**
 * 取得 Free Spin 狀態快照
 */
export function getFreeSpinState(): FreeSpinState {
  const state = useFreeSpinStore.getState();
  return {
    mode: state.mode,
    remainingSpins: state.remainingSpins,
    totalSpins: state.totalSpins,
    accumulatedWin: state.accumulatedWin,
    currentMultiplier: state.currentMultiplier,
    triggerCount: state.triggerCount,
  };
}

/**
 * 取得 Base Game 狀態
 */
export function getBaseGameState(): FreeSpinState {
  return {
    mode: 'base',
    remainingSpins: 0,
    totalSpins: 0,
    accumulatedWin: 0,
    currentMultiplier: 1,
    triggerCount: 0,
  };
}

/**
 * 初始化 Free Spin 狀態（觸發時使用）
 */
export function initializeFreeSpinState(
  scatterCount: number,
  config: FreeSpinConfig
): FreeSpinState {
  return {
    mode: 'free',
    remainingSpins: config.freeSpinCount,
    totalSpins: config.freeSpinCount,
    accumulatedWin: 0,
    currentMultiplier: config.enableMultiplier ? config.multiplierValue : 1,
    triggerCount: scatterCount,
  };
}

