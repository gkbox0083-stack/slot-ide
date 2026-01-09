import { useState, useRef, useCallback } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { useFreeSpinStore } from '../../store/useFreeSpinStore.js';
import { useSimulationStore } from '../../store/useSimulationStore.js';
import { spinExecutor } from '../../engine/index.js';
import { BettingPanel } from '../panels/BettingPanel.js';
import { SimulationPanel } from '../panels/SimulationPanel.js';
import { HistoryPanel } from '../panels/HistoryPanel.js';
import { FreeSpinPanel } from '../panels/FreeSpinPanel.js';
import type { SimulationStats } from '../../engine/rtp-calculator.js';

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
    assets,
    balance,
    baseBet,
    isPoolsBuilt,
    setBalance,
    setCurrentSpinPacket,
  } = useGameConfigStore();

  const freeSpinState = useFreeSpinStore();
  const isInFreeSpin = freeSpinState.mode === 'free';

  const { addResult, spinCount } = useSimulationStore();

  // 將單次 spin 結果累積到 simulation store
  const accumulateSpinResult = useCallback((win: number, isFreeSpin: boolean) => {
    const stats: SimulationStats = {
      totalSpins: 1,
      ngSpins: isFreeSpin ? 0 : 1,
      fgSpins: isFreeSpin ? 1 : 0,
      totalBet: isFreeSpin ? 0 : baseBet, // Free Spin 不扣錢
      totalWin: win,
      ngWin: isFreeSpin ? 0 : win,
      fgWin: isFreeSpin ? win : 0,
      fgTriggerCount: 0, // 暫不追蹤
      hitCount: win > 0 ? 1 : 0,
      maxWin: win / baseBet, // 以倍率表示
    };
    addResult(stats);
  }, [baseBet, addResult]);

  // 單次 Spin
  const handleSpin = useCallback(async () => {
    if (isSpinning) return;

    // 檢查 Pool 是否已建立
    if (!isPoolsBuilt) {
      alert('請先建立 Pool！');
      return;
    }

    // 檢查餘額
    if (balance < baseBet) {
      alert('餘額不足！');
      return;
    }

    setIsSpinning(true);

    try {
      // 扣除投注金額（非 Free Spin 模式）
      if (!isInFreeSpin) {
        const currentBalance = useGameConfigStore.getState().balance;
        setBalance(currentBalance - baseBet);
      }

      // 生成 SpinPacket
      const phase = isInFreeSpin ? 'free' : 'base';
      const multiplier = isInFreeSpin ? (freeSpinState.currentMultiplier || 1) : 1;

      const packet = spinExecutor.spin(
        visualConfig,
        Object.keys(assets).length > 0 ? assets : undefined,
        phase,
        multiplier,
        baseBet
      );

      // 更新 SpinPacket 到 store
      setCurrentSpinPacket(packet);

      // 等待動畫完成
      await new Promise(resolve => setTimeout(resolve, visualConfig.animation.spinDuration + 500));

      // 獲勝處理
      const win = packet.meta?.win || 0;
      if (win > 0) {
        const currentBalance = useGameConfigStore.getState().balance;
        setBalance(currentBalance + win);
      }

      // 累積結果到 simulation store
      accumulateSpinResult(win, isInFreeSpin);

    } catch (error) {
      console.error('Spin error:', error);
      alert(error instanceof Error ? error.message : '發生錯誤');
    } finally {
      setIsSpinning(false);
    }
  }, [balance, baseBet, isInFreeSpin, isPoolsBuilt, visualConfig, assets, freeSpinState, setBalance, setCurrentSpinPacket, isSpinning, accumulateSpinResult]);

  // Auto Spin
  const handleAutoSpin = useCallback(async () => {
    if (isAutoSpinning) {
      // 停止 Auto Spin
      autoSpinRef.current = false;
      setIsAutoSpinning(false);
    } else {
      // 檢查 Pool 是否已建立
      if (!isPoolsBuilt) {
        alert('請先建立 Pool！');
        return;
      }

      // 開始 Auto Spin
      autoSpinRef.current = true;
      setIsAutoSpinning(true);

      while (autoSpinRef.current) {
        await handleSpin();

        // 短暫延遲
        await new Promise(resolve => setTimeout(resolve, 500));

        // 檢查是否需要停止
        const currentBalance = useGameConfigStore.getState().balance;
        if (!autoSpinRef.current || currentBalance < baseBet || !isPoolsBuilt) {
          autoSpinRef.current = false;
          setIsAutoSpinning(false);
          break;
        }
      }
    }
  }, [isAutoSpinning, handleSpin, balance, baseBet, isPoolsBuilt]);

  // 快速模擬（執行批次 spin）
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulation = useCallback(async () => {
    if (isSimulating || isSpinning || isAutoSpinning) return;

    // 檢查 Pool 是否已建立
    if (!isPoolsBuilt) {
      alert('請先建立 Pool！');
      return;
    }

    setIsSimulating(true);

    const count = spinCount;
    const batchStats: SimulationStats = {
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

    try {
      for (let i = 0; i < count; i++) {
        // 生成 SpinPacket（模擬模式不顯示動畫、不扣餘額）
        const packet = spinExecutor.spin(
          visualConfig,
          Object.keys(assets).length > 0 ? assets : undefined,
          'base',
          1,
          baseBet
        );

        const win = packet.meta?.win || 0;

        // 累積統計
        batchStats.totalSpins += 1;
        batchStats.ngSpins += 1;
        batchStats.totalBet += baseBet;
        batchStats.totalWin += win;
        batchStats.ngWin += win;
        if (win > 0) {
          batchStats.hitCount += 1;
        }
        batchStats.maxWin = Math.max(batchStats.maxWin, win / baseBet);

        // 每 10 次更新一次 UI（避免阻塞）
        if (i % 10 === 0) {
          await new Promise(r => setTimeout(r, 0));
        }
      }

      // 將批次結果加入 store
      addResult(batchStats);

      // 切換到 history tab 查看結果
      setActiveTab('history');

    } catch (error) {
      console.error('Simulation error:', error);
      alert(error instanceof Error ? error.message : '模擬發生錯誤');
    } finally {
      setIsSimulating(false);
    }
  }, [isSimulating, isSpinning, isAutoSpinning, isPoolsBuilt, visualConfig, assets, baseBet, addResult, spinCount]);

  return (
    <div className="flex flex-col h-full bg-surface-900">
      {/* 頂部快捷鍵 */}
      <div className="p-3 border-b border-surface-700 shrink-0">
        <div className="flex gap-2">
          <button
            onClick={handleSpin}
            disabled={isSpinning || isAutoSpinning || balance < baseBet || !isPoolsBuilt}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-lg transition-all ${isSpinning
                ? 'bg-primary-700 text-white animate-pulse'
                : 'bg-gradient-to-r from-primary-500 to-purple-600 text-white hover:from-primary-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            title={!isPoolsBuilt ? '請先建立 Pool' : undefined}
          >
            {isSpinning ? '🎰 SPINNING...' : '🎰 SPIN'}
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSimulation}
            disabled={isSimulating || isSpinning || isAutoSpinning || !isPoolsBuilt}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${isSimulating
                ? 'bg-indigo-700 text-white animate-pulse'
                : 'bg-surface-700 text-surface-200 hover:bg-surface-600 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            title={!isPoolsBuilt ? '請先建立 Pool' : `執行 ${spinCount} 次模擬`}
          >
            {isSimulating ? '⏳ 模擬中...' : '📊 SIM'}
          </button>
          <button
            onClick={handleAutoSpin}
            disabled={isSpinning && !isAutoSpinning}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${isAutoSpinning
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
          className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === 'betting'
              ? 'text-primary-400 bg-surface-800 border-b-2 border-primary-500'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
            }`}
          onClick={() => setActiveTab('betting')}
        >
          💰 Betting
        </button>
        <button
          className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === 'simulation'
              ? 'text-primary-400 bg-surface-800 border-b-2 border-primary-500'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
            }`}
          onClick={() => setActiveTab('simulation')}
        >
          📊 Sim
        </button>
        <button
          className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === 'history'
              ? 'text-primary-400 bg-surface-800 border-b-2 border-primary-500'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
            }`}
          onClick={() => setActiveTab('history')}
        >
          📈 History
        </button>
        <button
          className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors relative ${activeTab === 'freespin'
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
