import { useRef, useMemo } from 'react';
import { SlotMachine } from '../runtime/SlotMachine.js';
import type { SlotMachineRef } from '../runtime/SlotMachine.js';
import { useGameConfigStore, useWizardStore } from '../store/index.js';
import { spinExecutor } from '../engine/index.js';
import type { SpinPacket } from '../types/spin-packet.js';

/**
 * PreviewPanel 中央預覽面板
 */
export function PreviewPanel() {
  const slotMachineRef = useRef<SlotMachineRef>(null);
  const {
    currentSpinPacket,
    setCurrentSpinPacket,
    visualConfig,
    assets,
  } = useGameConfigStore();
  const { isPoolsBuilt, isSpinning, setIsSpinning } = useWizardStore();

  // 同步 visualConfig 和 assets 到 displaySpinPacket
  const displaySpinPacket = useMemo<SpinPacket | undefined>(() => {
    if (!currentSpinPacket) {
      return undefined;
    }
    return {
      ...currentSpinPacket,
      visual: visualConfig,
      assets: Object.keys(assets).length > 0 ? assets : undefined,
    };
  }, [currentSpinPacket, visualConfig, assets]);

  // Spin 處理
  const handleSpin = () => {
    if (!isPoolsBuilt || isSpinning) {
      return;
    }

    try {
      const newSpinPacket = spinExecutor.spin(visualConfig, assets);
      setCurrentSpinPacket(newSpinPacket);
      setIsSpinning(true);

      // 延遲啟動動畫
      setTimeout(() => {
        if (slotMachineRef.current) {
          slotMachineRef.current.startSpin();
        }
      }, 100);
    } catch (error) {
      console.error('Spin error:', error);
    }
  };

  // Skip 處理
  const handleSkip = () => {
    if (slotMachineRef.current && isSpinning) {
      slotMachineRef.current.skip();
    }
  };

  // 取得結算資訊
  const meta = currentSpinPacket?.meta;

  return (
    <div className="h-full flex flex-col bg-surface-900 dark:bg-surface-950">
      {/* 預覽區標題 */}
      <div className="shrink-0 px-4 py-3 border-b border-surface-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-surface-300">遊戲預覽</h2>
          {meta && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-surface-400">
                Outcome: <span className="text-primary-400">{meta.outcomeId}</span>
              </span>
              <span className="text-surface-400">
                Win: <span className="text-accent-success">{meta.win}</span>
              </span>
              <span className="text-surface-400">
                Lines: <span className="text-yellow-400">{meta.winningLines?.length || 0}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SlotMachine 預覽區 */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="relative">
          <SlotMachine
            ref={slotMachineRef}
            spinPacket={displaySpinPacket}
            onSpinComplete={() => {
              setIsSpinning(false);
            }}
            onSkip={() => {
              setIsSpinning(false);
            }}
          />
        </div>
      </div>

      {/* 控制按鈕 */}
      <div className="shrink-0 px-4 py-3 border-t border-surface-800">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleSpin}
            disabled={!isPoolsBuilt || isSpinning}
            className={`
              px-6 py-2 rounded-lg font-semibold text-sm transition-all
              ${
                isPoolsBuilt && !isSpinning
                  ? 'bg-accent-success hover:bg-green-600 text-white'
                  : 'bg-surface-700 text-surface-500 cursor-not-allowed'
              }
            `}
          >
            {isSpinning ? '🎰 動畫中...' : '🎰 Spin'}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={!isSpinning}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm transition-all
              ${
                isSpinning
                  ? 'bg-accent-warning hover:bg-yellow-600 text-white'
                  : 'bg-surface-700 text-surface-500 cursor-not-allowed'
              }
            `}
          >
            ⏭️ 跳過
          </button>
        </div>

        {!isPoolsBuilt && (
          <p className="text-center text-xs text-surface-500 mt-2">
            請先在「數值權重模擬」步驟建立盤池
          </p>
        )}
      </div>
    </div>
  );
}

