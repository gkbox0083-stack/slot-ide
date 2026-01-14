import { create } from 'zustand';
import type { SimulationStats } from '../engine/rtp-calculator.js';

type SimulationMode = 'stack' | 'compare';

interface SimulationStoreState {
  isRunning: boolean;
  progress: number;
  mode: SimulationMode;
  results: SimulationStats[];
  currentIndex: number;
  spinCount: number; // 模擬次數設定
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
  spinCount: 1000, // 預設 1000 次
};

export const useSimulationStore = create<SimulationStoreState & SimulationStoreActions>()(
  (set, get) => ({
    ...initialState,
    
    setMode: (mode) => set({ mode }),
    
    startSimulation: () => {
      const { mode, results } = get();
      
      if (mode === 'compare') {
        // 比較模式：保留現有結果，新增空位
        set({ 
          isRunning: true, 
          progress: 0,
          currentIndex: results.length,
        });
      } else {
        // 堆疊模式：累加到現有結果
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
        // 堆疊模式：合併結果
        const existing = results[0];
        const merged: SimulationStats = {
          totalSpins: existing.totalSpins + stats.totalSpins,
          ngSpins: existing.ngSpins + stats.ngSpins,
          fgSpins: existing.fgSpins + stats.fgSpins,
          totalBet: existing.totalBet + stats.totalBet,
          totalWin: existing.totalWin + stats.totalWin,
          ngWin: existing.ngWin + stats.ngWin,
          fgWin: existing.fgWin + stats.fgWin,
          fgTriggerCount: existing.fgTriggerCount + stats.fgTriggerCount,
          hitCount: existing.hitCount + stats.hitCount,
          maxWin: Math.max(existing.maxWin, stats.maxWin),
        };
        set({ 
          results: [merged],
          isRunning: false,
          progress: 100,
        });
      } else if (mode === 'compare') {
        // 比較模式：新增到指定位置
        const newResults = [...results];
        newResults[currentIndex] = stats;
        set({ 
          results: newResults,
          isRunning: false,
          progress: 100,
        });
      } else {
        // 首次結果
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

