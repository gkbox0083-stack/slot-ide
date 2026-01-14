import { create } from 'zustand';
import type { SimulationStats } from '../engine/rtp-calculator.js';

type SimulationMode = 'stack' | 'compare';

interface SimulationStoreState {
  isRunning: boolean;
  progress: number;
  mode: SimulationMode;
  results: SimulationStats[];
  currentIndex: number;
  spinCount: number;
}

interface SimulationStoreActions {
  setMode: (mode: SimulationMode) => void;
  startSimulation: (count: number) => void;
  updateProgress: (progress: number) => void;
  addResult: (stats: SimulationStats) => void;
  clearResults: () => void;
  setIsRunning: (isRunning: boolean) => void;
  setSpinCount: (count: number) => void;
}

const initialState: SimulationStoreState = {
  isRunning: false,
  progress: 0,
  mode: 'stack',
  results: [],
  currentIndex: 0,
  spinCount: 1000,
};

export const useSimulationStore = create<SimulationStoreState & SimulationStoreActions>()(
  (set, get) => ({
    ...initialState,

    setMode: (mode) => set({ mode }),

    startSimulation: () => {
      const { mode, results } = get();

      if (mode === 'compare') {
        set({
          isRunning: true,
          progress: 0,
          currentIndex: results.length,
        });
      } else {
        set({
          isRunning: true,
          progress: 0,
        });
      }
    },

    updateProgress: (progress) => set({ progress }),

    addResult: (stats) => {
      const { mode, results, currentIndex } = get();

      if (mode === 'stack' && results.length > 0) {
        // 堆疊模式：合併結果（V3 簡化版）
        const existing = results[0];
        const merged: SimulationStats = {
          totalSpins: existing.totalSpins + stats.totalSpins,
          totalBet: existing.totalBet + stats.totalBet,
          totalWin: existing.totalWin + stats.totalWin,
          lineWin: existing.lineWin + stats.lineWin,
          scatterWin: existing.scatterWin + stats.scatterWin,
          hitCount: existing.hitCount + stats.hitCount,
          maxWin: Math.max(existing.maxWin, stats.maxWin),
        };
        set({
          results: [merged],
          isRunning: false,
          progress: 100,
        });
      } else if (mode === 'compare') {
        const newResults = [...results];
        newResults[currentIndex] = stats;
        set({
          results: newResults,
          isRunning: false,
          progress: 100,
        });
      } else {
        set({
          results: [stats],
          isRunning: false,
          progress: 100,
        });
      }
    },

    clearResults: () => set({
      results: [],
      currentIndex: 0,
      progress: 0,
    }),

    setIsRunning: (isRunning) => set({ isRunning }),

    setSpinCount: (count) => set({ spinCount: count }),
  })
);
