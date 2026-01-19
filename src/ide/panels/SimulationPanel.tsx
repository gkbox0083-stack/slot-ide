import { useState, useEffect } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore.js';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { calculateTheoreticalRTPBreakdown } from '../../engine/rtp-calculator.js';

const SPIN_COUNTS = [100, 500, 1000, 5000, 10000];

/**
 * Simulation 面板（V3 簡化版）
 * 顯示模擬設定、累計統計
 */
export function SimulationPanel() {
  const [customCount, setCustomCount] = useState('');

  const {
    isRunning,
    progress,
    mode,
    results,
    spinCount,
    setMode,
    setSpinCount,
    clearResults,
  } = useSimulationStore();

  // 同步自訂模擬次數到 store
  useEffect(() => {
    if (customCount) {
      const count = parseInt(customCount);
      if (count > 0) {
        setSpinCount(count);
      }
    }
  }, [customCount, setSpinCount]);

  const {
    symbols,
    outcomes,
    boardConfig,
    isPoolsBuilt,
  } = useGameConfigStore();

  // 計算理論 RTP（V3 簡化版）
  const theoreticalRTP = calculateTheoreticalRTPBreakdown(
    symbols,
    outcomes,
    boardConfig
  );

  const handleSpinCountSelect = (count: number) => {
    setSpinCount(count);
    setCustomCount('');
  };

  const totalSpins = results.reduce((sum, r) => sum + r.totalSpins, 0);
  const totalBet = results.reduce((sum, r) => sum + r.totalBet, 0);
  const actualRTP = totalBet > 0
    ? (results.reduce((sum, r) => sum + r.totalWin, 0) / totalBet) * 100
    : 0;

  return (
    <div className="space-y-4 p-4">


      {/* 模擬次數 */}
      <div className="bg-surface-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          🔢 模擬次數
        </h4>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {SPIN_COUNTS.map((count) => (
            <button
              key={count}
              onClick={() => handleSpinCountSelect(count)}
              className={`py-2 text-sm rounded transition-all ${spinCount === count && !customCount
                ? 'bg-primary-600 text-white'
                : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                }`}
            >
              {count.toLocaleString()}
            </button>
          ))}
          <input
            type="number"
            placeholder="自訂"
            value={customCount}
            onChange={(e) => setCustomCount(e.target.value)}
            className="col-span-2 px-3 py-2 bg-surface-900 border border-surface-700 rounded text-sm text-surface-100"
          />
        </div>
        <div className="text-center text-surface-400 text-sm">
          當前: <span className="text-white font-semibold">{spinCount.toLocaleString()}</span> 次
        </div>
        <p className="text-xs text-surface-500 mt-2 text-center">
          💡 點擊上方 <span className="text-primary-400 font-semibold">📊 SIM</span> 按鈕執行模擬
        </p>
      </div>

      {/* 模擬模式 */}
      <div className="bg-surface-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          🔄 模擬模式
        </h4>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setMode('stack')}
            className={`flex-1 py-2 text-sm rounded transition-all ${mode === 'stack'
              ? 'bg-green-600 text-white'
              : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
              }`}
          >
            📊 堆疊
          </button>
          <button
            onClick={() => setMode('compare')}
            className={`flex-1 py-2 text-sm rounded transition-all ${mode === 'compare'
              ? 'bg-blue-600 text-white'
              : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
              }`}
          >
            📈 比較
          </button>
        </div>
        <p className="text-xs text-surface-500">
          {mode === 'stack'
            ? '💡 堆疊模式：新結果累加至現有數據，顯示總和'
            : '💡 比較模式：保留前次結果，方便對比不同配置'}
        </p>
      </div>

      {/* 累計統計 */}
      <div className="bg-surface-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          📊 累計統計
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-400">總模擬次數:</span>
            <span className="text-surface-200 font-semibold">{totalSpins.toLocaleString()} 次</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-400">實際 RTP:</span>
            <span className={`font-semibold ${actualRTP > theoreticalRTP.totalRTP ? 'text-red-400' :
              actualRTP < theoreticalRTP.totalRTP * 0.9 ? 'text-yellow-400' : 'text-green-400'
              }`}>
              {actualRTP.toFixed(2)}%
            </span>
          </div>
          {results.length > 1 && mode === 'compare' && (
            <div className="text-xs text-surface-500">
              共 {results.length} 組比較結果
            </div>
          )}
        </div>
        <button
          onClick={clearResults}
          disabled={isRunning || results.length === 0}
          className="w-full mt-3 py-2 bg-surface-700 text-surface-300 text-sm rounded hover:bg-surface-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          清除累計
        </button>
      </div>

      {/* Pool 未建立提示 */}
      {!isPoolsBuilt && (
        <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-300 flex items-center gap-2">
            ⚠️ 請先在 Pool Tab 中建立盤池後才能進行模擬
          </p>
        </div>
      )}

      {/* 模擬進度 */}
      {isRunning && (
        <div className="p-3 bg-indigo-900/30 border border-indigo-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-indigo-300">模擬進行中...</span>
            <span className="text-sm text-indigo-200 font-semibold">{progress}%</span>
          </div>
          <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
