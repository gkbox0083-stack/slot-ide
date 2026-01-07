# P4-01 Simulation 堆疊/比較模式

## 目標 (Objective)

實作 Simulation 的堆疊和比較模式，包括：
- 堆疊模式：新結果累加至現有數據
- 比較模式：保留前次結果並排比較
- 模式切換
- 清除累計功能

---

## 範圍 (Scope)

需要修改的檔案：
- `src/store/useSimulationStore.ts`（或新增）
- `src/analytics/simulator.ts`
- `src/ide/panels/SimulationPanel.tsx`
- `src/ide/panels/HistoryPanel.tsx`

依賴：
- P2-03（右側 Game Control）
- Phase 1（核心機制）

---

## 實作細節 (Implementation Details)

### useSimulationStore.ts

```typescript
// src/store/useSimulationStore.ts

import { create } from 'zustand';
import type { SimulationStats } from '../engine/rtp-calculator';

export type SimulationMode = 'stack' | 'compare';

export interface SimulationResult extends SimulationStats {
  id: string;
  timestamp: Date;
  spinCount: number;
}

interface SimulationState {
  isRunning: boolean;
  progress: number;
  mode: SimulationMode;
  results: SimulationResult[];
  compareResults: SimulationResult[][];
}

interface SimulationActions {
  setMode: (mode: SimulationMode) => void;
  startSimulation: (count: number) => void;
  updateProgress: (progress: number) => void;
  addResult: (result: SimulationResult) => void;
  clearResults: () => void;
  stopSimulation: () => void;
}

const initialState: SimulationState = {
  isRunning: false,
  progress: 0,
  mode: 'stack',
  results: [],
  compareResults: [],
};

export const useSimulationStore = create<SimulationState & SimulationActions>()(
  (set, get) => ({
    ...initialState,

    setMode: (mode) => set({ mode }),

    startSimulation: (count) => {
      const { mode, results, compareResults } = get();
      
      set({ isRunning: true, progress: 0 });
      
      // 比較模式：保存當前結果到比較列表
      if (mode === 'compare' && results.length > 0) {
        set({
          compareResults: [...compareResults, results],
          results: [],
        });
      }
    },

    updateProgress: (progress) => set({ progress }),

    addResult: (result) => {
      const { mode, results } = get();
      
      if (mode === 'stack') {
        // 堆疊模式：累加結果
        if (results.length === 0) {
          set({ results: [result], isRunning: false, progress: 100 });
        } else {
          // 合併統計數據
          const merged: SimulationResult = {
            ...result,
            id: results[0].id, // 保留原始 ID
            totalSpins: results[0].totalSpins + result.totalSpins,
            ngSpins: results[0].ngSpins + result.ngSpins,
            fgSpins: results[0].fgSpins + result.fgSpins,
            totalBet: results[0].totalBet + result.totalBet,
            totalWin: results[0].totalWin + result.totalWin,
            ngWin: results[0].ngWin + result.ngWin,
            fgWin: results[0].fgWin + result.fgWin,
            fgTriggerCount: results[0].fgTriggerCount + result.fgTriggerCount,
            hitCount: results[0].hitCount + result.hitCount,
            maxWin: Math.max(results[0].maxWin, result.maxWin),
          };
          set({ results: [merged], isRunning: false, progress: 100 });
        }
      } else {
        // 比較模式：添加新結果
        set({ 
          results: [result], 
          isRunning: false, 
          progress: 100 
        });
      }
    },

    clearResults: () => set({ 
      results: [], 
      compareResults: [],
      progress: 0,
    }),

    stopSimulation: () => set({ isRunning: false }),
  })
);
```

### simulator.ts 修改

```typescript
// src/analytics/simulator.ts (修改片段)

import { useSimulationStore } from '../store/useSimulationStore';

export async function runSimulation(
  context: SimulationContext,
  count: number,
  onProgress?: (progress: number) => void
): Promise<SimulationResult> {
  const stats: SimulationStats = {
    totalSpins: 0,
    ngSpins: 0,
    fgSpins: 0,
    totalBet: 0,
    totalWin: 0,
    ngWin: 0,
    fgWin: 0,
    fgTriggerCount: 0,
    hitCount: 0,
    maxWin: 0,
  };

  let freeSpinState = getBaseGameState();

  for (let i = 0; i < count; i++) {
    // 執行單次 spin
    const result = executeSpin(context, pools, freeSpinState);
    
    // 更新統計
    stats.totalSpins++;
    stats.totalBet += context.baseBet;
    
    if (freeSpinState.mode === 'base') {
      stats.ngSpins++;
      stats.ngWin += result.packet.meta?.win || 0;
    } else {
      stats.fgSpins++;
      stats.fgWin += result.packet.meta?.win || 0;
    }
    
    const win = result.packet.meta?.win || 0;
    stats.totalWin += win;
    
    if (win > 0) {
      stats.hitCount++;
      stats.maxWin = Math.max(stats.maxWin, win / context.baseBet);
    }
    
    if (result.triggeredFreeSpin) {
      stats.fgTriggerCount++;
      // 進入 Free Spin 模式
      freeSpinState = initializeFreeSpinState(
        result.packet.meta?.scatterCount || 0,
        context.freeSpinConfig
      );
    }
    
    // 處理 Free Spin 狀態
    if (freeSpinState.mode === 'free') {
      if (result.isRetrigger) {
        freeSpinState.remainingSpins += context.freeSpinConfig.retriggerSpinCount;
      }
      freeSpinState.remainingSpins--;
      
      if (freeSpinState.remainingSpins <= 0) {
        freeSpinState = getBaseGameState();
      }
    }
    
    // 更新進度
    if (onProgress && i % 100 === 0) {
      onProgress((i / count) * 100);
    }
  }

  return {
    ...stats,
    id: `sim_${Date.now()}`,
    timestamp: new Date(),
    spinCount: count,
  };
}
```

### HistoryPanel 比較模式顯示

```tsx
// src/ide/panels/HistoryPanel.tsx (修改片段)

// 比較模式顯示
{mode === 'compare' && compareResults.length > 0 && (
  <div className="panel-section">
    <h4>比較結果</h4>
    <div className="compare-grid">
      {compareResults.map((results, index) => {
        const stats = results[0];
        const breakdown = calculateActualRTPFromStats(stats);
        
        return (
          <div key={index} className="compare-column">
            <h5>Run #{index + 1}</h5>
            <div className="compare-stats">
              <div>Spins: {stats.totalSpins}</div>
              <div>RTP: {breakdown.totalRTP.toFixed(2)}%</div>
              <div>Max Win: {stats.maxWin.toFixed(2)}x</div>
            </div>
          </div>
        );
      })}
      
      {results.length > 0 && (
        <div className="compare-column current">
          <h5>Current</h5>
          <div className="compare-stats">
            <div>Spins: {results[0].totalSpins}</div>
            <div>RTP: {rtpBreakdown.totalRTP.toFixed(2)}%</div>
            <div>Max Win: {results[0].maxWin.toFixed(2)}x</div>
          </div>
        </div>
      )}
    </div>
  </div>
)}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 堆疊模式正確累加模擬結果
- [ ] 比較模式保留前次結果
- [ ] 比較模式並排顯示多次結果
- [ ] 模式切換正常
- [ ] 清除累計功能正常
- [ ] 進度正確更新
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/store/useSimulationStore.ts` 完整程式碼
2. 相關面板修改
3. 堆疊/比較模式測試截圖

