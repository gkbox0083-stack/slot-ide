import { useState, useRef, useCallback } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { useFreeSpinStore } from '../../store/useFreeSpinStore.js';
import { BettingPanel } from '../panels/BettingPanel.js';
import { SimulationPanel } from '../panels/SimulationPanel.js';
import { HistoryPanel } from '../panels/HistoryPanel.js';
import { FreeSpinPanel } from '../panels/FreeSpinPanel.js';

type GameControlTab = 'betting' | 'simulation' | 'history' | 'freespin';

/**
 * 右側遊戲控制面板（V2 三欄式佈局）
 */
export function GameControlV2() {
  const [activeTab, setActiveTab] = useState<GameControlTab>('betting');
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const autoSpinRef = useRef(false);

  const {
    visualConfig,
    currentSpinPacket,
    balance,
    baseBet,
    setBalance,
  } = useGameConfigStore();

  const freeSpinState = useFreeSpinStore();
  const isInFreeSpin = freeSpinState.mode === 'free';

  // 單次 Spin
  const handleSpin = useCallback(async () => {
    if (isSpinning) return;
    
    // 檢查餘額
    if (balance < baseBet) {
      alert('餘額不足！');
      return;
    }
    
    setIsSpinning(true);
    
    try {
      // 扣除投注金額（非 Free Spin 模式）
      if (!isInFreeSpin) {
        setBalance(balance - baseBet);
      }
      
      // 模擬 Spin 動畫延遲
      await new Promise(resolve => setTimeout(resolve, visualConfig.animation.spinDuration + 500));
      
      // 獲勝處理
      const win = currentSpinPacket?.meta?.win || 0;
      if (win > 0) {
        setBalance(balance - baseBet + win);
      }
      
    } catch (error) {
      console.error('Spin error:', error);
    } finally {
      setIsSpinning(false);
    }
  }, [balance, baseBet, isInFreeSpin, visualConfig, currentSpinPacket, setBalance, isSpinning]);

  // Auto Spin
  const handleAutoSpin = useCallback(async () => {
    if (isAutoSpinning) {
      // 停止 Auto Spin
      autoSpinRef.current = false;
      setIsAutoSpinning(false);
    } else {
      // 開始 Auto Spin
      autoSpinRef.current = true;
      setIsAutoSpinning(true);
      
      while (autoSpinRef.current) {
        await handleSpin();
        
        // 短暫延遲
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 檢查是否需要停止
        if (!autoSpinRef.current || balance < baseBet) {
          autoSpinRef.current = false;
          setIsAutoSpinning(false);
          break;
        }
      }
    }
  }, [isAutoSpinning, handleSpin, balance, baseBet]);

  // Simulation 快捷鍵
  const handleSimulation = () => {
    setActiveTab('simulation');
  };

  return (
    <div className="flex flex-col h-full bg-surface-900">
      {/* 頂部快捷鍵 */}
      <div className="p-3 border-b border-surface-700 shrink-0">
        <div className="flex gap-2">
          <button 
            onClick={handleSpin}
            disabled={isSpinning || isAutoSpinning || balance < baseBet}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-lg transition-all ${
              isSpinning
                ? 'bg-primary-700 text-white animate-pulse'
                : 'bg-gradient-to-r from-primary-500 to-purple-600 text-white hover:from-primary-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isSpinning ? '🎰 SPINNING...' : '🎰 SPIN'}
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={handleSimulation}
            className="flex-1 py-2 bg-surface-700 text-surface-200 rounded-lg hover:bg-surface-600 transition-colors font-semibold"
          >
            📊 SIM
          </button>
          <button 
            onClick={handleAutoSpin}
            disabled={isSpinning && !isAutoSpinning}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              isAutoSpinning
                ? 'bg-red-600 text-white'
                : 'bg-surface-700 text-surface-200 hover:bg-surface-600 disabled:opacity-50'
            }`}
          >
            {isAutoSpinning ? '⏹️ STOP' : '🔄 AUTO'}
          </button>
        </div>
        
        {/* Free Spin 提示 */}
        {isInFreeSpin && (
          <div className="mt-2 p-2 bg-purple-900/50 border border-purple-500/50 rounded-lg text-center">
            <span className="text-purple-300 text-sm font-semibold">
              🎰 Free Spin: {freeSpinState.remainingSpins}/{freeSpinState.totalSpins}
            </span>
          </div>
        )}
      </div>

      {/* Tab 切換器 */}
      <div className="flex border-b border-surface-700 shrink-0">
        <button 
          className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'betting'
              ? 'text-primary-400 bg-surface-800 border-b-2 border-primary-500'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
          }`}
          onClick={() => setActiveTab('betting')}
        >
          💰 Betting
        </button>
        <button 
          className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'simulation'
              ? 'text-primary-400 bg-surface-800 border-b-2 border-primary-500'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
          }`}
          onClick={() => setActiveTab('simulation')}
        >
          📊 Sim
        </button>
        <button 
          className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-primary-400 bg-surface-800 border-b-2 border-primary-500'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
          }`}
          onClick={() => setActiveTab('history')}
        >
          📈 History
        </button>
        <button 
          className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'freespin'
              ? 'text-primary-400 bg-surface-800 border-b-2 border-primary-500'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
          }`}
          onClick={() => setActiveTab('freespin')}
        >
          🎰 FS
          {isInFreeSpin && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab 內容 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'betting' && <BettingPanel />}
        {activeTab === 'simulation' && <SimulationPanel />}
        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'freespin' && <FreeSpinPanel />}
      </div>
    </div>
  );
}
