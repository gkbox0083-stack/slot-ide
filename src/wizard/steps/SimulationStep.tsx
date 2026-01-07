import { useState, useRef, useEffect } from 'react';
import { NumberInput } from '../../components/form/index.js';
import { useGameConfigStore, useWizardStore } from '../../store/index.js';
import {
  poolBuilder,
  spinExecutor,
  outcomeManager,
  symbolManager,
} from '../../engine/index.js';
import { Simulator } from '../../analytics/simulator.js';

/**
 * Step 6: 數值權重模擬
 */
export function SimulationStep() {
  const { baseBet, visualConfig, symbols, outcomeConfig } = useGameConfigStore();
  const {
    isPoolsBuilt,
    poolStatus,
    setPoolsBuilt,
    isSimulating,
    setIsSimulating,
    simulationProgress,
    setSimulationProgress,
    simulationResult,
    setSimulationResult,
  } = useWizardStore();

  const [poolCap, setPoolCap] = useState(100);
  const [simulationCount, setSimulationCount] = useState(1000);
  const [buildError, setBuildError] = useState<string | null>(null);
  const simulatorRef = useRef<Simulator | null>(null);

  // 合併 NG 和 FG outcomes 用於同步
  const allOutcomes = [...outcomeConfig.ngOutcomes, ...outcomeConfig.fgOutcomes];

  // 同步 Engine 資料
  useEffect(() => {
    // 同步符號
    symbols.forEach((symbol) => {
      symbolManager.update(symbol);
    });

    // 同步 Outcomes
    const currentOutcomes = outcomeManager.getAll();
    const currentIds = currentOutcomes.map((o) => o.id);
    const newIds = allOutcomes.map((o) => o.id);

    // 移除不存在的
    currentIds.forEach((id) => {
      if (!newIds.includes(id)) {
        outcomeManager.remove(id);
      }
    });

    // 更新或新增
    allOutcomes.forEach((outcome) => {
      if (currentIds.includes(outcome.id)) {
        outcomeManager.update(outcome);
      } else {
        outcomeManager.add(outcome);
      }
    });
  }, [symbols, allOutcomes]);

  // 建立盤池
  const handleBuildPools = () => {
    setBuildError(null);

    if (poolCap < 1 || poolCap > 1000) {
      setBuildError('盤池上限必須在 1-1000 之間');
      return;
    }

    try {
      const result = poolBuilder.buildPools(poolCap);

      if (result.success) {
        setPoolsBuilt(true, result.pools);
        if (result.errors.length > 0) {
          setBuildError(result.errors.join('; '));
        }
      } else {
        setBuildError(result.errors.join('; ') || '建立盤池失敗');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setBuildError(errorMessage);
    }
  };

  // 開始模擬
  const handleStartSimulation = async () => {
    if (!isPoolsBuilt || isSimulating) return;

    setIsSimulating(true);
    setSimulationProgress(0);
    setSimulationResult(null);

    const simulator = new Simulator(spinExecutor, outcomeManager);
    simulatorRef.current = simulator;

    try {
      const result = await simulator.runAsync(
        {
          count: simulationCount,
          baseBet,
          visualConfig,
        },
        (progress) => {
          setSimulationProgress(progress);
        }
      );

      setSimulationResult(result);
    } finally {
      setIsSimulating(false);
      simulatorRef.current = null;
    }
  };

  // 停止模擬
  const handleStopSimulation = () => {
    simulatorRef.current?.abort();
  };

  // 格式化數字
  const formatNumber = (n: number) => n.toLocaleString();
  const formatPercent = (n: number) => `${n.toFixed(1)}%`;

  const presetCounts = [100, 1000, 10000];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
          數值權重模擬
        </h2>
        <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
          執行批量模擬並查看統計結果
        </p>
      </div>

      {/* 盤池管理 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">
          🏊 盤池管理
        </h3>

        <div className="space-y-4">
          <NumberInput
            label="盤池上限"
            value={poolCap}
            min={1}
            max={1000}
            onChange={(e) => setPoolCap(Number(e.target.value))}
            hint="每個 Outcome 的盤面數量"
          />

          <button
            type="button"
            onClick={handleBuildPools}
            className="btn-primary w-full"
          >
            🔨 Build Pools
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-surface-600 dark:text-surface-400">狀態:</span>
            <span
              className={`text-sm font-semibold ${
                isPoolsBuilt ? 'text-accent-success' : 'text-accent-error'
              }`}
            >
              {isPoolsBuilt ? '✅ 已建立' : '❌ 未建立'}
            </span>
          </div>

          {buildError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">⚠️ {buildError}</p>
            </div>
          )}

          {isPoolsBuilt && poolStatus.length > 0 && (
            <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3">
              <div className="text-xs font-semibold text-surface-500 dark:text-surface-400 mb-2">
                盤池詳情
              </div>
              <div className="space-y-1">
                {poolStatus.map((pool) => (
                  <div key={pool.outcomeId} className="flex justify-between text-sm">
                    <span className="text-surface-700 dark:text-surface-300">
                      {pool.outcomeName}
                    </span>
                    <span
                      className={`font-semibold ${
                        pool.isFull ? 'text-accent-success' : 'text-accent-warning'
                      }`}
                    >
                      {pool.generated}/{pool.cap} {pool.isFull ? '✅' : '⚠️'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 批次模擬 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">
          📊 批次模擬
        </h3>

        <div className="space-y-4">
          {/* 模擬次數選擇 */}
          <div>
            <label className="label">模擬次數</label>
            <div className="flex gap-2 mb-2">
              {presetCounts.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setSimulationCount(count)}
                  disabled={isSimulating}
                  className={`
                    flex-1 py-2 px-3 text-sm rounded-md transition-colors
                    ${
                      simulationCount === count
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {formatNumber(count)}
                </button>
              ))}
            </div>
            <NumberInput
              placeholder="自訂次數 (10-100000)"
              value={simulationCount}
              min={10}
              max={100000}
              disabled={isSimulating}
              onChange={(e) => setSimulationCount(Number(e.target.value))}
            />
          </div>

          {/* 按鈕組 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleStartSimulation}
              disabled={!isPoolsBuilt || isSimulating}
              className="btn-success flex-1"
            >
              ▶️ 開始模擬
            </button>
            <button
              type="button"
              onClick={handleStopSimulation}
              disabled={!isSimulating}
              className="btn-danger flex-1"
            >
              ⏹️ 停止
            </button>
          </div>

          {/* 進度條 */}
          {(isSimulating || simulationProgress > 0) && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-surface-600 dark:text-surface-400">進度</span>
                <span className="font-semibold text-surface-900 dark:text-surface-100">
                  {Math.round(simulationProgress * 100)}%
                </span>
              </div>
              <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-100"
                  style={{ width: `${simulationProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 統計結果 */}
      {simulationResult && (
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">
              📈 統計結果
            </h3>
            <span className="text-xs text-surface-500 dark:text-surface-400">
              耗時: {(simulationResult.duration / 1000).toFixed(2)} 秒
            </span>
          </div>

          {/* 主要指標 */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3 text-center">
              <div className="text-xs text-surface-500 dark:text-surface-400 mb-1">RTP</div>
              <div className="text-xl font-bold text-accent-success">
                {formatPercent(simulationResult.statistics.rtp)}
              </div>
            </div>
            <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3 text-center">
              <div className="text-xs text-surface-500 dark:text-surface-400 mb-1">Hit Rate</div>
              <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
                {formatPercent(simulationResult.statistics.hitRate)}
              </div>
            </div>
            <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3 text-center">
              <div className="text-xs text-surface-500 dark:text-surface-400 mb-1">Avg Win</div>
              <div className="text-xl font-bold text-accent-error">
                {formatNumber(simulationResult.statistics.avgWin)}
              </div>
            </div>
          </div>

          {/* 詳細數據 */}
          <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-surface-600 dark:text-surface-400">Total Spins</span>
              <span className="font-semibold text-surface-900 dark:text-surface-100">
                {formatNumber(simulationResult.statistics.totalSpins)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600 dark:text-surface-400">Total Bet</span>
              <span className="font-semibold text-surface-900 dark:text-surface-100">
                {formatNumber(simulationResult.statistics.totalBet)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600 dark:text-surface-400">Total Win</span>
              <span className="font-semibold text-surface-900 dark:text-surface-100">
                {formatNumber(simulationResult.statistics.totalWin)}
              </span>
            </div>
            <div className="border-t border-surface-200 dark:border-surface-600 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-surface-600 dark:text-surface-400">Max Win</span>
                <span className="font-semibold text-accent-success">
                  {formatNumber(simulationResult.statistics.maxWin)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-600 dark:text-surface-400">Min Win</span>
                <span className="font-semibold text-surface-900 dark:text-surface-100">
                  {formatNumber(simulationResult.statistics.minWin)}
                </span>
              </div>
            </div>
          </div>

          {/* Outcome 分佈 */}
          <div className="mt-4">
            <div className="text-xs font-semibold text-surface-500 dark:text-surface-400 mb-2">
              Outcome 分佈
            </div>
            <div className="space-y-2">
              {simulationResult.statistics.outcomeDistribution.map((dist) => (
                <div key={dist.outcomeId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-surface-700 dark:text-surface-300">{dist.outcomeName}</span>
                    <span className="text-surface-500 dark:text-surface-400">
                      {formatNumber(dist.count)} ({formatPercent(dist.percentage)})
                    </span>
                  </div>
                  <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500"
                      style={{ width: `${Math.min(dist.percentage * 2, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                    預期: {formatPercent(dist.expectedPercentage)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
