import { useState, useRef } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { useFreeSpinStore } from '../../store/useFreeSpinStore.js';
import { spinExecutor, calculateTheoreticalRTPBreakdown } from '../../engine/index.js';
import type { SpinPacket } from '../../types/spin-packet.js';

type GameControlTab = 'betting' | 'simulation' | 'history' | 'freespin';

interface SpinHistoryEntry {
  id: number;
  win: number;
  balance: number;
  outcomeId: string;
  phase: 'base' | 'free';
  timestamp: number;
}

/**
 * 右側遊戲控制面板（V2 三欄式佈局）
 * Tab 切換：Betting、Simulation、History、Free Spin
 */
export function GameControlV2() {
  const [activeTab, setActiveTab] = useState<GameControlTab>('betting');
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [history, setHistory] = useState<SpinHistoryEntry[]>([]);
  const [simulationCount, setSimulationCount] = useState(1000);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const autoSpinRef = useRef<number | null>(null);
  const historyIdRef = useRef(0);
  
  const { 
    baseBet, 
    visualConfig, 
    symbols, 
    outcomeConfig, 
    freeSpinConfig,
    boardConfig,
    setCurrentSpinPacket 
  } = useGameConfigStore();
  
  const { 
    mode: freeSpinMode, 
    remainingSpins, 
    totalSpins, 
    accumulatedWin,
    currentMultiplier,
    triggerFreeSpin,
    consumeSpin,
    addWin,
    endFreeSpin,
    retrigger
  } = useFreeSpinStore();

  // 執行單次 Spin
  const executeSpin = (): SpinPacket | null => {
    try {
      if (!spinExecutor.isReady()) {
        throw new Error('請先 Build Pools');
      }
      
      const phase = freeSpinMode;
      const multiplier = currentMultiplier;
      
      const packet = spinExecutor.spin(visualConfig, undefined, phase, multiplier);
      setCurrentSpinPacket(packet);
      
      // 處理餘額和歷史
      const win = packet.meta?.win || 0;
      const newBalance = balance - (phase === 'base' ? baseBet : 0) + win;
      setBalance(newBalance);
      
      // 記錄歷史
      const entry: SpinHistoryEntry = {
        id: ++historyIdRef.current,
        win,
        balance: newBalance,
        outcomeId: packet.meta?.outcomeId || '',
        phase,
        timestamp: Date.now(),
      };
      setHistory(prev => [entry, ...prev].slice(0, 100)); // 保留最近 100 條
      
      // 處理 Free Spin
      if (phase === 'base' && packet.meta?.triggeredFreeSpin) {
        triggerFreeSpin(packet.meta.scatterCount, freeSpinConfig);
      } else if (phase === 'free') {
        addWin(win);
        consumeSpin();
        
        // 檢查 Retrigger
        if (packet.meta?.triggeredFreeSpin && freeSpinConfig.enableRetrigger) {
          retrigger(freeSpinConfig.retriggerSpinCount);
        }
        
        // 檢查是否結束
        if (remainingSpins <= 1) {
          const totalWin = endFreeSpin();
          console.log(`Free Spin 結束，總獲獎：${totalWin}`);
        }
      }
      
      return packet;
    } catch (error) {
      console.error('Spin 失敗:', error);
      return null;
    }
  };

  const handleSpin = () => {
    executeSpin();
  };

  const handleAutoSpin = () => {
    if (isAutoSpinning) {
      // 停止 Auto Spin
      if (autoSpinRef.current) {
        clearInterval(autoSpinRef.current);
        autoSpinRef.current = null;
      }
      setIsAutoSpinning(false);
    } else {
      // 開始 Auto Spin
      setIsAutoSpinning(true);
      autoSpinRef.current = window.setInterval(() => {
        executeSpin();
      }, 1000); // 每秒一次
    }
  };

  const handleSimulation = async () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    
    // 模擬執行
    const batchSize = 100;
    let completed = 0;
    
    while (completed < simulationCount) {
      const batch = Math.min(batchSize, simulationCount - completed);
      for (let i = 0; i < batch; i++) {
        executeSpin();
      }
      completed += batch;
      setSimulationProgress(completed / simulationCount);
      
      // 讓 UI 有機會更新
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    setIsSimulating(false);
  };

  // 計算 RTP
  const rtpBreakdown = calculateTheoreticalRTPBreakdown(
    symbols,
    outcomeConfig,
    freeSpinConfig,
    boardConfig
  );

  const renderBettingTab = () => (
    <div className="p-4 space-y-4">
      {/* Balance */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold mb-2">💰 Balance</h3>
        <p className="text-2xl font-bold text-accent-success">{balance.toLocaleString()}</p>
      </div>
      
      {/* Bet 設定 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold mb-2">🎯 Bet</h3>
        <p className="text-lg font-semibold">{baseBet} × 20 lines = {baseBet * 20}</p>
      </div>
      
      {/* RTP 資訊 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold mb-2">📊 RTP (理論值)</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-600">NG RTP:</span>
            <span className="font-semibold">{rtpBreakdown.ngRTP.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-600">FG 貢獻:</span>
            <span className="font-semibold">{rtpBreakdown.fgRTPContribution.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between border-t pt-1 mt-1">
            <span className="text-surface-600">總 RTP:</span>
            <span className="font-bold text-accent-success">{rtpBreakdown.totalRTP.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-600">FG 觸發:</span>
            <span className="font-semibold">{rtpBreakdown.fgTriggerProbability.toFixed(4)}%</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSimulationTab = () => (
    <div className="p-4 space-y-4">
      {/* 模擬次數 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold mb-3">📊 批次模擬</h3>
        
        <div className="flex gap-2 mb-3">
          {[100, 1000, 10000].map(count => (
            <button
              key={count}
              onClick={() => setSimulationCount(count)}
              className={`flex-1 py-2 text-sm rounded ${
                simulationCount === count
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300'
              }`}
            >
              {count.toLocaleString()}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleSimulation}
          disabled={isSimulating || !spinExecutor.isReady()}
          className="btn-success w-full"
        >
          {isSimulating ? `模擬中 ${Math.round(simulationProgress * 100)}%` : '▶️ 開始模擬'}
        </button>
        
        {isSimulating && (
          <div className="mt-3 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-100"
              style={{ width: `${simulationProgress * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="p-4 space-y-2">
      <h3 className="text-sm font-semibold mb-3">📜 Spin 歷史</h3>
      
      {history.length === 0 ? (
        <p className="text-sm text-surface-500">尚無記錄</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map(entry => (
            <div 
              key={entry.id} 
              className={`p-3 rounded-lg text-sm ${
                entry.win > 0 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-surface-500">#{entry.id}</span>
                <span className={`font-semibold ${entry.win > 0 ? 'text-accent-success' : ''}`}>
                  {entry.win > 0 ? `+${entry.win}` : '0'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-surface-500 mt-1">
                <span>{entry.phase === 'free' ? '🎁 FG' : '🎰 NG'}</span>
                <span>餘額: {entry.balance.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFreeSpinTab = () => (
    <div className="p-4 space-y-4">
      {/* Free Spin 狀態 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold mb-3">🎁 Free Spin 狀態</h3>
        
        <div className={`p-4 rounded-lg ${
          freeSpinMode === 'free' 
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
            : 'bg-surface-100 dark:bg-surface-800'
        }`}>
          <div className="text-center">
            <p className="text-sm opacity-80">
              {freeSpinMode === 'free' ? '🔥 Free Spin 進行中!' : '等待觸發...'}
            </p>
            {freeSpinMode === 'free' && (
              <>
                <p className="text-3xl font-bold my-2">{remainingSpins} / {totalSpins}</p>
                <p className="text-sm">累積獎金: {accumulatedWin.toLocaleString()}</p>
                <p className="text-sm">倍率: {currentMultiplier}x</p>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Free Spin 配置 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold mb-2">⚙️ 配置</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-600">觸發數量:</span>
            <span>{freeSpinConfig.triggerCount} Scatter</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-600">基礎次數:</span>
            <span>{freeSpinConfig.baseSpinCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-600">Retrigger:</span>
            <span>{freeSpinConfig.enableRetrigger ? '✅ 啟用' : '❌ 停用'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-600">Multiplier:</span>
            <span>{freeSpinConfig.enableMultiplier ? `${freeSpinConfig.multiplierValue}x` : '❌ 停用'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* 頂部快捷鍵 */}
      <div className="p-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
        <div className="flex gap-2">
          <button
            onClick={handleSpin}
            disabled={!spinExecutor.isReady()}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            🎰 SPIN
          </button>
          <button
            onClick={handleAutoSpin}
            disabled={!spinExecutor.isReady()}
            className={`py-3 px-4 font-bold rounded-lg transition-all ${
              isAutoSpinning
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-300 dark:hover:bg-surface-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAutoSpinning ? '⏹️' : '🔄'}
          </button>
        </div>
      </div>

      {/* Tab 切換器 */}
      <div className="flex border-b border-surface-200 dark:border-surface-700 text-xs">
        {(['betting', 'simulation', 'history', 'freespin'] as GameControlTab[]).map(tab => (
          <button
            key={tab}
            className={`flex-1 px-2 py-2.5 font-medium transition-colors ${
              activeTab === tab
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 bg-white dark:bg-surface-900'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'betting' && '💰 Bet'}
            {tab === 'simulation' && '📊 Sim'}
            {tab === 'history' && '📜 History'}
            {tab === 'freespin' && '🎁 FS'}
          </button>
        ))}
      </div>

      {/* Tab 內容 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'betting' && renderBettingTab()}
        {activeTab === 'simulation' && renderSimulationTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'freespin' && renderFreeSpinTab()}
      </div>
    </div>
  );
}

