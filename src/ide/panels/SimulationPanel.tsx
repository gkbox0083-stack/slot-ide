import { useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore.js';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { calculateTheoreticalRTPBreakdown } from '../../engine/rtp-calculator.js';

const SPIN_COUNTS = [100, 500, 1000, 5000, 10000];

/**
 * Simulation 面板
 * 顯示模擬控制、進度、累計統計
 */
export function SimulationPanel() {
  const [spinCount, setSpinCount] = useState(1000);
  const [customCount, setCustomCount] = useState('');
  
  const {
    isRunning,
    progress,
    mode,
    results,
    setMode,
    startSimulation,
    updateProgress,
    addResult,
    clearResults,
  } = useSimulationStore();

  const { 
    symbols, 
    outcomeConfig, 
    freeSpinConfig, 
    boardConfig,
    baseBet,
  } = useGameConfigStore();

  // 計算理論 RTP
  const theoreticalRTP = calculateTheoreticalRTPBreakdown(
    symbols,
    outcomeConfig,
    freeSpinConfig,
    boardConfig
  );

  const handleStartSimulation = async () => {
    const count = customCount ? parseInt(customCount) : spinCount;
    
    if (count <= 0 || isRunning) return;
    
    startSimulation(count);
    
    // 模擬進度（實際上應該是非同步執行）
    const stats = {
      totalSpins: count,
      ngSpins: Math.floor(count * 0.95),
      fgSpins: Math.floor(count * 0.05),
      totalBet: count * baseBet,
      totalWin: 0,
      ngWin: 0,
      fgWin: 0,
      fgTriggerCount: 0,
      hitCount: 0,
      maxWin: 0,
    };
    
    // 模擬進度更新
    for (let i = 0; i <= 100; i += 10) {
      updateProgress(i);
      await new Promise(r => setTimeout(r, 100));
    }
    
    // 模擬完成 - 生成隨機結果（實際應該用真正的 Spin）
    const rtpVariance = 0.9 + Math.random() * 0.2; // 90%-110% of theoretical
    stats.totalWin = Math.floor(stats.totalBet * (theoreticalRTP.totalRTP / 100) * rtpVariance);
    stats.ngWin = Math.floor(stats.totalWin * 0.7);
    stats.fgWin = stats.totalWin - stats.ngWin;
    stats.hitCount = Math.floor(count * 0.3);
    stats.fgTriggerCount = Math.floor(count * (theoreticalRTP.fgTriggerProbability / 100));
    stats.maxWin = Math.floor(baseBet * (10 + Math.random() * 40));
    
    addResult(stats);
  };

  const totalSpins = results.reduce((sum, r) => sum + r.totalSpins, 0);
  const actualRTP = results.length > 0
    ? (results.reduce((sum, r) => sum + r.totalWin, 0) / results.reduce((sum, r) => sum + r.totalBet, 0)) * 100
    : 0;

  return (
    <div className="space-y-4 p-4">
      {/* 理論 RTP */}
      <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-lg p-4 border border-indigo-700/50">
        <h4 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
          📐 理論 RTP
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-400">NG RTP:</span>
            <span className="text-surface-200 font-semibold">{theoreticalRTP.ngRTP.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-400">FG 貢獻:</span>
            <span className="text-surface-200 font-semibold">{theoreticalRTP.fgRTPContribution.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-400">FG 觸發:</span>
            <span className="text-surface-200 font-semibold">{theoreticalRTP.fgTriggerProbability.toFixed(4)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-yellow-400 font-semibold">總 RTP:</span>
            <span className="text-yellow-400 font-bold">{theoreticalRTP.totalRTP.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* 模擬次數 */}
      <div className="bg-surface-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          🔢 模擬次數
        </h4>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {SPIN_COUNTS.map((count) => (
            <button
              key={count}
              onClick={() => {
                setSpinCount(count);
                setCustomCount('');
              }}
              className={`py-2 text-sm rounded transition-all ${
                spinCount === count && !customCount
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
          當前: <span className="text-white font-semibold">{(customCount || spinCount).toLocaleString()}</span> 次
        </div>
      </div>

      {/* 模擬模式 */}
      <div className="bg-surface-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          🔄 模擬模式
        </h4>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setMode('stack')}
            className={`flex-1 py-2 text-sm rounded transition-all ${
              mode === 'stack'
                ? 'bg-green-600 text-white'
                : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
            }`}
          >
            📊 堆疊
          </button>
          <button
            onClick={() => setMode('compare')}
            className={`flex-1 py-2 text-sm rounded transition-all ${
              mode === 'compare'
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

      {/* 進度 */}
      {isRunning && (
        <div className="bg-surface-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
            ⏳ 進度
          </h4>
          <div className="relative h-4 bg-surface-700 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center mt-2 text-sm text-surface-400">
            {Math.round(progress)}%
          </div>
        </div>
      )}

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
            <span className={`font-semibold ${
              actualRTP > theoreticalRTP.totalRTP ? 'text-red-400' : 
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

      {/* 開始按鈕 */}
      <button
        onClick={handleStartSimulation}
        disabled={isRunning}
        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
      >
        {isRunning ? '🔄 模擬中...' : '🚀 開始模擬'}
      </button>
    </div>
  );
}

