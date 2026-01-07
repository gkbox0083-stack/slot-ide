import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { useFreeSpinStore } from '../../store/useFreeSpinStore.js';

/**
 * Free Spin 設定與狀態面板
 */
export function FreeSpinPanel() {
  const { freeSpinConfig, setFreeSpinConfig } = useGameConfigStore();
  const freeSpinState = useFreeSpinStore();

  const handleConfigChange = <K extends keyof typeof freeSpinConfig>(
    key: K,
    value: typeof freeSpinConfig[K]
  ) => {
    setFreeSpinConfig({ ...freeSpinConfig, [key]: value });
  };

  const isInFreeSpin = freeSpinState.mode === 'free';

  return (
    <div className="space-y-4 p-4">
      {/* Free Spin 狀態（進行中時顯示） */}
      {isInFreeSpin && (
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
      )}

      {/* 啟用開關 */}
      <div className="bg-surface-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-surface-300 flex items-center gap-2">
            🎰 Free Spin 功能
          </h4>
          <button
            onClick={() => handleConfigChange('enabled', !freeSpinConfig.enabled)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              freeSpinConfig.enabled ? 'bg-green-600' : 'bg-surface-600'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                freeSpinConfig.enabled ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>
        
        {!freeSpinConfig.enabled && (
          <p className="text-surface-500 text-sm">
            啟用後可配置 Scatter 觸發、Free Spin 次數等設定
          </p>
        )}
      </div>

      {/* Free Spin 配置（僅在啟用時顯示） */}
      {freeSpinConfig.enabled && (
        <>
          {/* 觸發條件 */}
          <div className="bg-surface-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
              🎯 觸發條件
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-surface-400 block mb-1">
                  Scatter 觸發數量
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5].map(count => (
                    <button
                      key={count}
                      onClick={() => handleConfigChange('triggerCount', count)}
                      className={`flex-1 py-2 rounded text-sm font-semibold transition-all ${
                        freeSpinConfig.triggerCount === count
                          ? 'bg-primary-600 text-white'
                          : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                      }`}
                    >
                      {count}個
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 基礎次數 */}
          <div className="bg-surface-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
              🔢 基礎 Free Spin 次數
            </h4>
            <div className="flex gap-2 mb-2">
              {[5, 8, 10, 12, 15].map(count => (
                <button
                  key={count}
                  onClick={() => handleConfigChange('baseSpinCount', count)}
                  className={`flex-1 py-2 rounded text-sm font-semibold transition-all ${
                    freeSpinConfig.baseSpinCount === count
                      ? 'bg-purple-600 text-white'
                      : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={freeSpinConfig.baseSpinCount}
              onChange={(e) => handleConfigChange('baseSpinCount', Math.max(1, parseInt(e.target.value) || 10))}
              className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-sm text-surface-100"
              min={1}
              max={100}
            />
          </div>

          {/* Retrigger */}
          <div className="bg-surface-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-surface-300 flex items-center gap-2">
                🔄 Retrigger（再觸發）
              </h4>
              <button
                onClick={() => handleConfigChange('enableRetrigger', !freeSpinConfig.enableRetrigger)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  freeSpinConfig.enableRetrigger ? 'bg-green-600' : 'bg-surface-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    freeSpinConfig.enableRetrigger ? 'left-6' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            
            {freeSpinConfig.enableRetrigger && (
              <div>
                <label className="text-xs text-surface-400 block mb-1">
                  Retrigger 額外次數
                </label>
                <div className="flex gap-2">
                  {[3, 5, 8, 10].map(count => (
                    <button
                      key={count}
                      onClick={() => handleConfigChange('retriggerSpinCount', count)}
                      className={`flex-1 py-2 rounded text-sm font-semibold transition-all ${
                        freeSpinConfig.retriggerSpinCount === count
                          ? 'bg-blue-600 text-white'
                          : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                      }`}
                    >
                      +{count}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Multiplier */}
          <div className="bg-surface-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-surface-300 flex items-center gap-2">
                ✨ Multiplier（倍率加成）
              </h4>
              <button
                onClick={() => handleConfigChange('enableMultiplier', !freeSpinConfig.enableMultiplier)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  freeSpinConfig.enableMultiplier ? 'bg-green-600' : 'bg-surface-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    freeSpinConfig.enableMultiplier ? 'left-6' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            
            {freeSpinConfig.enableMultiplier && (
              <div>
                <label className="text-xs text-surface-400 block mb-1">
                  Multiplier 倍率
                </label>
                <div className="flex gap-2">
                  {[2, 3, 5, 10].map(value => (
                    <button
                      key={value}
                      onClick={() => handleConfigChange('multiplierValue', value)}
                      className={`flex-1 py-2 rounded text-sm font-semibold transition-all ${
                        freeSpinConfig.multiplierValue === value
                          ? 'bg-yellow-600 text-white'
                          : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                      }`}
                    >
                      {value}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 配置摘要 */}
          <div className="bg-surface-900/50 rounded-lg p-4 border border-surface-700">
            <h4 className="text-sm font-semibold text-surface-400 mb-3">
              📋 配置摘要
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-500">觸發條件:</span>
                <span className="text-surface-200">
                  {freeSpinConfig.triggerCount}+ Scatter
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">基礎次數:</span>
                <span className="text-surface-200">
                  {freeSpinConfig.baseSpinCount} 次
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Retrigger:</span>
                <span className={freeSpinConfig.enableRetrigger ? 'text-green-400' : 'text-surface-500'}>
                  {freeSpinConfig.enableRetrigger ? `+${freeSpinConfig.retriggerSpinCount} 次` : '停用'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Multiplier:</span>
                <span className={freeSpinConfig.enableMultiplier ? 'text-yellow-400' : 'text-surface-500'}>
                  {freeSpinConfig.enableMultiplier ? `${freeSpinConfig.multiplierValue}x` : '停用'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

