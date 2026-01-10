import { useState, useRef, useCallback } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { useFreeSpinStore } from '../../store/useFreeSpinStore.js';
import { useSimulationStore } from '../../store/useSimulationStore.js';
import { spinExecutor } from '../../engine/index.js';
import type { SimulationStats } from '../../engine/rtp-calculator.js';

/**
 * 底部遊戲控制欄（glass-morphism 效果）
 * 包含：Balance、Win、Bet、Spin、SIM、AUTO
 */
export function GameControlBar() {
    const [isAutoSpinning, setIsAutoSpinning] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [win, setWin] = useState(0);
    const autoSpinRef = useRef(false);

    const {
        visualConfig,
        assets,
        balance,
        baseBet,
        isPoolsBuilt,
        setBalance,
        setBaseBet,
        setCurrentSpinPacket,
    } = useGameConfigStore();

    const freeSpinState = useFreeSpinStore();
    const isInFreeSpin = freeSpinState.mode === 'free';

    const { addResult, spinCount } = useSimulationStore();

    // 累積 spin 結果到 simulation store
    const accumulateSpinResult = useCallback((winAmount: number, isFreeSpin: boolean) => {
        const stats: SimulationStats = {
            totalSpins: 1,
            ngSpins: isFreeSpin ? 0 : 1,
            fgSpins: isFreeSpin ? 1 : 0,
            totalBet: isFreeSpin ? 0 : baseBet,
            totalWin: winAmount,
            ngWin: isFreeSpin ? 0 : winAmount,
            fgWin: isFreeSpin ? winAmount : 0,
            fgTriggerCount: 0,
            hitCount: winAmount > 0 ? 1 : 0,
            maxWin: winAmount / baseBet,
        };
        addResult(stats);
    }, [baseBet, addResult]);

    // 單次 Spin
    const handleSpin = useCallback(async () => {
        if (isSpinning) return;

        if (!isPoolsBuilt) {
            alert('請先建立 Pool！');
            return;
        }

        if (balance < baseBet) {
            alert('餘額不足！');
            return;
        }

        setIsSpinning(true);
        setWin(0);

        try {
            if (!isInFreeSpin) {
                const currentBalance = useGameConfigStore.getState().balance;
                setBalance(currentBalance - baseBet);
            }

            const phase = isInFreeSpin ? 'free' : 'base';
            const multiplier = isInFreeSpin ? (freeSpinState.currentMultiplier || 1) : 1;

            const packet = spinExecutor.spin(
                visualConfig,
                Object.keys(assets).length > 0 ? assets : undefined,
                phase,
                multiplier,
                baseBet
            );

            setCurrentSpinPacket(packet);

            await new Promise(resolve => setTimeout(resolve, visualConfig.animation.spinDuration + 500));

            const winAmount = packet.meta?.win || 0;
            if (winAmount > 0) {
                const currentBalance = useGameConfigStore.getState().balance;
                setBalance(currentBalance + winAmount);
                setWin(winAmount);
            }

            // === P2-09/P2-10 Free Spin 觸發處理 ===
            // P2-10: 使用 scatterConfig 作為唯一真相來源

            // 取得 Scatter 配置
            // 1. 觸發 Free Spin（Base Game → Free Game）
            const symbolsState = useGameConfigStore.getState().symbols;
            const triggerSymbol = symbolsState.find(s => s.fsTriggerConfig?.enabled);
            const triggerConfig = triggerSymbol?.fsTriggerConfig;

            if (packet.meta?.triggeredFreeSpin && !isInFreeSpin && triggerConfig) {
                const count = packet.meta.scatterCount || 0;
                freeSpinState.triggerFreeSpin(count, {
                    enabled: true,
                    triggerCount: triggerConfig.triggerCount,
                    freeSpinCount: triggerConfig.freeSpinCount,
                    enableRetrigger: triggerConfig.enableRetrigger,
                    retriggerSpinCount: triggerConfig.retriggerSpinCount ?? 5,
                    enableMultiplier: triggerConfig.enableMultiplier,
                    multiplierValue: triggerConfig.multiplierValue,
                });
            }

            // 2. Free Spin 模式下的處理
            if (isInFreeSpin && triggerConfig) {
                // 2a. 處理 Retrigger（Free Game 中再次觸發）
                if (packet.meta?.triggeredFreeSpin && triggerConfig.enableRetrigger) {
                    freeSpinState.retrigger(triggerConfig.retriggerSpinCount ?? 5);
                }

                // 2b. 累積獎金
                freeSpinState.addWin(winAmount);

                // 2c. 記錄歷史
                freeSpinState.addHistory({
                    spinIndex: freeSpinState.totalSpins - freeSpinState.remainingSpins + 1,
                    board: packet.board,
                    win: winAmount,
                    multipliedWin: winAmount,
                    isRetrigger: packet.meta?.triggeredFreeSpin || false,
                });

                // 2d. 消耗次數
                freeSpinState.consumeSpin();

                // 2e. 檢查是否結束（在 consumeSpin 後檢查）
                const currentRemaining = useFreeSpinStore.getState().remainingSpins;
                if (currentRemaining <= 0) {
                    freeSpinState.endFreeSpin();
                }
            }

            // === End P2-09/P2-10 ===

            accumulateSpinResult(winAmount, isInFreeSpin);

        } catch (error) {
            console.error('Spin error:', error);
            alert(error instanceof Error ? error.message : '發生錯誤');
        } finally {
            setIsSpinning(false);
        }
    }, [balance, baseBet, isInFreeSpin, isPoolsBuilt, visualConfig, assets, freeSpinState, setBalance, setCurrentSpinPacket, isSpinning, accumulateSpinResult, setWin]);

    // Auto Spin
    const handleAutoSpin = useCallback(async () => {
        if (isAutoSpinning) {
            autoSpinRef.current = false;
            setIsAutoSpinning(false);
        } else {
            if (!isPoolsBuilt) {
                alert('請先建立 Pool！');
                return;
            }

            autoSpinRef.current = true;
            setIsAutoSpinning(true);

            while (autoSpinRef.current) {
                await handleSpin();
                await new Promise(resolve => setTimeout(resolve, 500));

                const currentBalance = useGameConfigStore.getState().balance;
                if (!autoSpinRef.current || currentBalance < baseBet || !isPoolsBuilt) {
                    autoSpinRef.current = false;
                    setIsAutoSpinning(false);
                    break;
                }
            }
        }
    }, [isAutoSpinning, handleSpin, baseBet, isPoolsBuilt]);

    // 快速模擬
    const [isSimulating, setIsSimulating] = useState(false);

    const handleSimulation = useCallback(async () => {
        if (isSimulating || isSpinning || isAutoSpinning) return;

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
            const symbolsState = useGameConfigStore.getState().symbols;
            const triggerSymbol = symbolsState.find(s => s.fsTriggerConfig?.enabled);
            const triggerConfig = triggerSymbol?.fsTriggerConfig;
            const assetsData = Object.keys(assets).length > 0 ? assets : undefined;

            for (let i = 0; i < count; i++) {
                // 1. 執行基礎旋轉 (NG)
                const packet = spinExecutor.spin(visualConfig, assetsData, 'base', 1, baseBet);
                const winAmount = packet.meta?.win || 0;

                batchStats.totalSpins += 1;
                batchStats.ngSpins += 1;
                batchStats.totalBet += baseBet;
                batchStats.totalWin += winAmount;
                batchStats.ngWin += winAmount;
                if (winAmount > 0) {
                    batchStats.hitCount += 1;
                }

                // 2. 處理 Free Spin 觸發
                if (packet.meta?.triggeredFreeSpin && triggerConfig) {
                    batchStats.fgTriggerCount += 1;

                    let fgRemaining = triggerConfig.freeSpinCount;
                    const fgMultiplier = triggerConfig.enableMultiplier ? triggerConfig.multiplierValue : 1;

                    // FG 迴圈
                    while (fgRemaining > 0) {
                        const fgPacket = spinExecutor.spin(visualConfig, assetsData, 'free', fgMultiplier, baseBet);
                        const fgWin = fgPacket.meta?.win || 0;

                        batchStats.totalSpins += 1;
                        batchStats.fgSpins += 1;
                        batchStats.totalWin += fgWin;
                        batchStats.fgWin += fgWin;
                        if (fgWin > 0) {
                            batchStats.hitCount += 1;
                        }

                        // 處理 Retrigger
                        if (fgPacket.meta?.triggeredFreeSpin && triggerConfig.enableRetrigger) {
                            fgRemaining += (triggerConfig.retriggerSpinCount ?? 5);
                        }

                        fgRemaining--;

                        // 防護：避免過度遞迴
                        if (batchStats.fgSpins > count * 100) break;
                    }
                }

                // 更新單次最大獲勝倍率 (以 NG 為基準)
                batchStats.maxWin = Math.max(batchStats.maxWin, winAmount / baseBet);

                // 每 50 次旋轉釋放一次主執行緒，避免 UI 凍結
                if (i % 50 === 0) {
                    await new Promise(r => setTimeout(r, 0));
                }
            }

            addResult(batchStats);

        } catch (error) {
            console.error('Simulation error:', error);
            alert(error instanceof Error ? error.message : '模擬發生錯誤');
        } finally {
            setIsSimulating(false);
        }
    }, [isSimulating, isSpinning, isAutoSpinning, isPoolsBuilt, visualConfig, assets, baseBet, addResult, spinCount]);

    // Balance 輸入處理
    const handleBalanceChange = (value: string) => {
        const num = parseFloat(value);
        if (!isNaN(num) && num >= 0) {
            setBalance(num);
        }
    };

    // Bet 輸入處理
    const handleBetChange = (value: string) => {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
            setBaseBet(num);
        }
    };

    // Bet 增減
    const adjustBet = (delta: number) => {
        const newBet = Math.max(1, baseBet + delta);
        setBaseBet(newBet);
    };

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
            <div
                className="
          rounded-full px-6 py-3 flex items-center gap-6
          bg-surface-900/80 backdrop-blur-xl
          border border-surface-600/50
          shadow-2xl shadow-black/50
        "
            >
                {/* Balance */}
                <div className="flex flex-col items-start min-w-[100px]">
                    <span className="text-[10px] uppercase tracking-wider text-surface-500 font-bold mb-0.5">
                        Balance
                    </span>
                    <input
                        type="number"
                        value={balance}
                        onChange={(e) => handleBalanceChange(e.target.value)}
                        className="w-full bg-transparent text-sm font-mono font-medium text-surface-200 
                       border-none outline-none focus:ring-0 p-0
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>

                <div className="w-px h-8 bg-surface-700/50" />

                {/* Win */}
                <div className="flex flex-col items-start min-w-[60px]">
                    <span className="text-[10px] uppercase tracking-wider text-surface-500 font-bold mb-0.5">
                        Win
                    </span>
                    <span className={`text-sm font-mono font-bold tracking-tight ${win > 0 ? 'text-primary-400' : 'text-surface-400'}`}>
                        ${win.toLocaleString()}
                    </span>
                </div>

                <div className="w-px h-8 bg-surface-700/50" />

                {/* Bet */}
                <div className="flex flex-col items-start">
                    <span className="text-[10px] uppercase tracking-wider text-surface-500 font-bold mb-0.5">
                        Bet
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => adjustBet(-1)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-surface-800 text-surface-400 
                         hover:text-white hover:bg-surface-700 transition-colors text-xs font-bold"
                        >
                            −
                        </button>
                        <input
                            type="number"
                            value={baseBet}
                            onChange={(e) => handleBetChange(e.target.value)}
                            className="w-12 bg-transparent text-sm font-mono font-medium text-surface-200 text-center
                         border-none outline-none focus:ring-0 p-0
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                            onClick={() => adjustBet(1)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-surface-800 text-surface-400 
                         hover:text-white hover:bg-surface-700 transition-colors text-xs font-bold"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="w-px h-8 bg-surface-700/50" />

                {/* Spin Button */}
                <button
                    onClick={handleSpin}
                    disabled={isSpinning || isAutoSpinning || balance < baseBet || !isPoolsBuilt}
                    className="relative group focus:outline-none"
                    title={!isPoolsBuilt ? '請先建立 Pool' : undefined}
                >
                    <div className="absolute inset-0 bg-primary-500 rounded-full blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
                    <div
                        className={`
              relative w-14 h-14 rounded-full flex items-center justify-center
              shadow-inner border border-primary-300/20
              transition-all duration-200
              ${isSpinning
                                ? 'bg-primary-700 animate-pulse'
                                : 'bg-gradient-to-br from-primary-400 to-primary-600 group-hover:scale-105 active:scale-95'
                            }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
                    >
                        <span
                            className={`text-white text-2xl drop-shadow-md transition-transform duration-700 ${isSpinning ? 'animate-spin' : 'group-hover:rotate-180'}`}
                        >
                            🔄
                        </span>
                    </div>
                </button>

                <div className="w-px h-8 bg-surface-700/50" />

                {/* SIM & AUTO Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSimulation}
                        disabled={isSimulating || isSpinning || isAutoSpinning || !isPoolsBuilt}
                        className={`
              flex items-center justify-center w-10 h-10 rounded-full
              border transition-all
              ${isSimulating
                                ? 'bg-indigo-700 border-indigo-500 text-white animate-pulse'
                                : 'bg-surface-800/50 border-surface-700/50 text-surface-400 hover:bg-surface-700 hover:text-primary-400'
                            }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
                        title={`執行 ${spinCount} 次模擬`}
                    >
                        <span className="text-lg">📊</span>
                    </button>
                    <button
                        onClick={handleAutoSpin}
                        disabled={isSpinning && !isAutoSpinning}
                        className={`
              flex items-center justify-center w-10 h-10 rounded-full
              border transition-all
              ${isAutoSpinning
                                ? 'bg-red-600 border-red-500 text-white'
                                : 'bg-surface-800/50 border-surface-700/50 text-surface-400 hover:bg-surface-700 hover:text-primary-400'
                            }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
                        title={isAutoSpinning ? '停止自動旋轉' : '開始自動旋轉'}
                    >
                        <span className="text-lg">{isAutoSpinning ? '⏹️' : '🔁'}</span>
                    </button>
                </div>

                {/* Free Spin 提示 */}
                {isInFreeSpin && (
                    <>
                        <div className="w-px h-8 bg-surface-700/50" />
                        <div className="flex items-center gap-2 px-3 py-1 bg-purple-900/50 border border-purple-500/50 rounded-full">
                            <span className="text-purple-300 text-xs font-semibold">
                                🎰 FS: {freeSpinState.remainingSpins}/{freeSpinState.totalSpins}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
