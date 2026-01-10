import { useFreeSpinStore } from '../../store/useFreeSpinStore.js';

/**
 * Free Spin 狀態面板（簡化版）
 * 只顯示 Free Spin 進行中的狀態，配置已移至 Scatter 符號設定
 */
export function FreeSpinPanel() {
  const freeSpinState = useFreeSpinStore();
  const isInFreeSpin = freeSpinState.mode === 'free';

  return (
    <div className="space-y-4 p-4">
      {/* Free Spin 狀態（進行中時顯示） */}
      {isInFreeSpin ? (
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-4 border border-purple-500/50">
          <h4 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
            🎰 Free Spin 進行中！
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-black/30 rounded-lg text-center">
              <div className="text-xs text-surface-400 mb-1">剩餘次數</div>
              <div className="text-2xl font-bold text-white">
                {freeSpinState.remainingSpins}/{freeSpinState.totalSpins}
              </div>
            </div>
            <div className="p-3 bg-black/30 rounded-lg text-center">
              <div className="text-xs text-surface-400 mb-1">累積獎金</div>
              <div className="text-2xl font-bold text-yellow-400">
                ${freeSpinState.accumulatedWin.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-black/30 rounded-lg text-center">
              <div className="text-xs text-surface-400 mb-1">Multiplier</div>
              <div className="text-2xl font-bold text-green-400">
                {freeSpinState.currentMultiplier}x
              </div>
            </div>
            <div className="p-3 bg-black/30 rounded-lg text-center">
              <div className="text-xs text-surface-400 mb-1">觸發 Scatter</div>
              <div className="text-2xl font-bold text-purple-400">
                {freeSpinState.triggerCount}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface-800 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">🎰</div>
          <h4 className="text-sm font-semibold text-surface-300 mb-2">
            Free Spin 待機中
          </h4>
          <p className="text-xs text-surface-500">
            達到 Scatter 觸發條件時將自動進入 Free Spin
          </p>
          <div className="mt-4 p-3 bg-surface-900/50 rounded-lg">
            <p className="text-xs text-surface-400">
              💡 Free Spin 設定請至 <span className="text-primary-400">[數值] → 符號設定 → SCATTER</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
