import { useState, useEffect } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { poolBuilder, symbolManager, outcomeManager, linesManager } from '../../engine/index.js';
import type { BoardRows } from '../../types/board.js';

/**
 * Pool 管理面板
 * 包含：盤面模式選擇、Build Pools、Pool 狀態顯示
 */
export function PoolPanel() {
  const {
    boardConfig,
    setBoardConfig,
    symbols,
    outcomeConfig,
    linesConfig,
    isPoolsBuilt,
    setIsPoolsBuilt,
  } = useGameConfigStore();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRows, setPendingRows] = useState<BoardRows | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [poolStatus, setPoolStatus] = useState<{ outcomeId: string; outcomeName: string; generated: number; cap: number; isFull: boolean }[]>([]);
  const [poolCap, setPoolCap] = useState(100);

  // 同步 store 的 isPoolsBuilt 與本地狀態
  useEffect(() => {
    if (!isPoolsBuilt) {
      setPoolStatus([]);
      setBuildError(null);
    }
  }, [isPoolsBuilt]);

  const handleBoardRowsChange = (rows: BoardRows) => {
    if (isPoolsBuilt) {
      setPendingRows(rows);
      setShowConfirmDialog(true);
    } else {
      setBoardConfig({ cols: 5, rows });
    }
  };

  const confirmBoardChange = () => {
    if (pendingRows) {
      // 清空 Pool
      poolBuilder.clearPools();
      setPoolStatus([]);
      setIsPoolsBuilt(false); // 更新 store
      setBuildError(null);
      // 更新盤面配置
      setBoardConfig({ cols: 5, rows: pendingRows });
    }
    setShowConfirmDialog(false);
    setPendingRows(null);
  };

  const cancelBoardChange = () => {
    setShowConfirmDialog(false);
    setPendingRows(null);
  };

  const handleBuildPools = async () => {
    setIsBuilding(true);
    setBuildError(null);

    try {
      // 同步盤面配置
      poolBuilder.setBoardConfig(boardConfig);

      // 同步符號（完整替換）
      symbolManager.setSymbols(symbols);

      // 同步 Outcomes（完整替換）
      const allOutcomes = [...outcomeConfig.ngOutcomes, ...outcomeConfig.fgOutcomes];
      outcomeManager.setOutcomes(allOutcomes);

      // 同步線路配置 (Fix: Pay Lines Not Updating)
      linesManager.setLinesConfig(linesConfig);

      // 建立盤池
      const result = poolBuilder.buildPools(poolCap);

      if (result.success) {
        setPoolStatus(result.pools);
        setIsPoolsBuilt(true); // 更新 store
      } else {
        setBuildError(result.errors.join('; ') || '建立盤池失敗');
        setPoolStatus(result.pools);
        const hasAnyPool = result.pools.some(p => p.generated > 0);
        setIsPoolsBuilt(hasAnyPool); // 更新 store
      }
    } catch (error) {
      setBuildError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsBuilding(false);
    }
  };

  const handleClearPools = () => {
    poolBuilder.clearPools();
    setPoolStatus([]);
    setIsPoolsBuilt(false); // 更新 store
    setBuildError(null);
  };

  return (
    <div className="space-y-4">
      {/* 盤面模式選擇 */}
      <div className="p-4 bg-surface-800 rounded-lg">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          📐 盤面模式
        </h4>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleBoardRowsChange(3)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${boardConfig.rows === 3
              ? 'bg-primary-600 text-white ring-2 ring-primary-400'
              : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
              }`}
          >
            5 × 3
          </button>
          <button
            type="button"
            onClick={() => handleBoardRowsChange(4)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${boardConfig.rows === 4
              ? 'bg-primary-600 text-white ring-2 ring-primary-400'
              : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
              }`}
          >
            5 × 4
          </button>
        </div>
        {isPoolsBuilt && (
          <p className="mt-2 text-xs text-yellow-500">
            ⚠️ 切換模式將清空現有 Pool
          </p>
        )}
      </div>

      {/* Pool Cap 設定 */}
      <div className="p-4 bg-surface-800 rounded-lg">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          🎚️ Pool 容量
        </h4>
        <div className="flex gap-2 mb-2">
          {[50, 100, 200, 500].map(cap => (
            <button
              key={cap}
              onClick={() => setPoolCap(cap)}
              className={`flex-1 py-2 text-sm rounded ${poolCap === cap
                ? 'bg-primary-600 text-white'
                : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                }`}
            >
              {cap}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={poolCap}
          onChange={(e) => setPoolCap(Math.max(1, Math.min(1000, parseInt(e.target.value) || 100)))}
          className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-sm text-surface-100"
          min={1}
          max={1000}
        />
        <p className="mt-1 text-xs text-surface-500">每個 Outcome 的盤面數量 (1-1000)</p>
      </div>

      {/* Build Pools */}
      <div className="p-4 bg-surface-800 rounded-lg">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          🏊 盤池管理
        </h4>

        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={handleBuildPools}
            disabled={isBuilding}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isBuilding ? '🔨 Building...' : '🔨 Build Pools'}
          </button>

          {isPoolsBuilt && (
            <button
              type="button"
              onClick={handleClearPools}
              className="py-3 px-4 bg-surface-700 text-surface-300 font-semibold rounded-lg hover:bg-surface-600 transition-all"
            >
              🗑️
            </button>
          )}
        </div>

        {/* 狀態指示 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-surface-400">狀態:</span>
          <span className={`text-sm font-semibold ${isPoolsBuilt ? 'text-green-400' : 'text-red-400'}`}>
            {isPoolsBuilt ? '✅ 已建立' : '❌ 未建立'}
          </span>
        </div>

        {/* 錯誤訊息 */}
        {buildError && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg mb-3">
            <p className="text-sm text-red-300">⚠️ {buildError}</p>
          </div>
        )}

        {/* Pool 配置摘要 */}
        <div className="p-3 bg-surface-900 rounded-lg text-sm space-y-1">
          <div className="flex justify-between text-surface-400">
            <span>盤面尺寸:</span>
            <span className="text-surface-200">{boardConfig.cols} × {boardConfig.rows}</span>
          </div>
          <div className="flex justify-between text-surface-400">
            <span>符號數量:</span>
            <span className="text-surface-200">{symbols.length}</span>
          </div>
          <div className="flex justify-between text-surface-400">
            <span>NG Outcomes:</span>
            <span className="text-surface-200">{outcomeConfig.ngOutcomes.length}</span>
          </div>
          <div className="flex justify-between text-surface-400">
            <span>FG Outcomes:</span>
            <span className="text-surface-200">{outcomeConfig.fgOutcomes.length}</span>
          </div>
          <div className="flex justify-between text-surface-400">
            <span>Free Spin:</span>
            <span className={symbols.some(s => s.type === 'scatter') ? 'text-green-400' : 'text-surface-500'}>
              {symbols.some(s => s.type === 'scatter') ? '✅ 已設定 Scatter' : '❌ 無 Scatter'}
            </span>
          </div>
        </div>
      </div>

      {/* Pool 狀態列表 */}
      {poolStatus.length > 0 && (
        <div className="p-4 bg-surface-800 rounded-lg">
          <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
            📊 Pool 狀態
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {poolStatus.map((pool) => (
              <div
                key={pool.outcomeId}
                className={`p-2 rounded flex justify-between items-center ${pool.isFull
                  ? 'bg-green-900/20 border border-green-700'
                  : 'bg-yellow-900/20 border border-yellow-700'
                  }`}
              >
                <span className="text-sm text-surface-300">{pool.outcomeName}</span>
                <span className={`text-sm font-semibold ${pool.isFull ? 'text-green-400' : 'text-yellow-400'}`}>
                  {pool.generated}/{pool.cap} {pool.isFull ? '✅' : '⚠️'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 確認對話框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-surface-800 p-6 rounded-xl max-w-md border border-surface-600 shadow-2xl">
            <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
              ⚠️ 確認切換盤面模式
            </h3>
            <p className="text-surface-300 mb-3">
              你即將從 <span className="font-bold text-white">5×{boardConfig.rows}</span> 切換到 <span className="font-bold text-white">5×{pendingRows}</span> 模式。
            </p>
            <div className="bg-surface-900 p-3 rounded-lg mb-4">
              <p className="text-sm text-surface-400 mb-2">此操作將會：</p>
              <ul className="text-sm text-red-400 space-y-1">
                <li>• 清空所有已建立的 Pool</li>
                <li>• 需要重新 Build Pools</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelBoardChange}
                className="px-4 py-2 bg-surface-700 text-surface-300 rounded-lg hover:bg-surface-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmBoardChange}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                確認切換
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

