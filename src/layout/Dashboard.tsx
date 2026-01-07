import { useUIStore, useWizardStore } from '../store/index.js';

/**
 * Dashboard 底部統計儀表板
 */
export function Dashboard() {
  const { isDashboardExpanded, toggleDashboard, chartType, setChartType } = useUIStore();
  const { simulationResult } = useWizardStore();

  // 格式化數字
  const formatNumber = (n: number) => n.toLocaleString();
  const formatPercent = (n: number) => `${n.toFixed(1)}%`;

  const stats = simulationResult?.statistics;

  return (
    <div
      className={`
        dashboard transition-all duration-300
        ${isDashboardExpanded ? 'h-64' : 'h-12'}
      `}
    >
      {/* 標題列 */}
      <button
        type="button"
        onClick={toggleDashboard}
        className="w-full h-12 px-4 flex items-center justify-between hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">
            📊 統計儀表板
          </span>
          {stats && !isDashboardExpanded && (
            <div className="flex items-center gap-4 text-xs">
              <span className="text-surface-500 dark:text-surface-400">
                RTP: <span className="font-semibold text-accent-success">{formatPercent(stats.rtp)}</span>
              </span>
              <span className="text-surface-500 dark:text-surface-400">
                Hit Rate: <span className="font-semibold text-primary-600 dark:text-primary-400">{formatPercent(stats.hitRate)}</span>
              </span>
              <span className="text-surface-500 dark:text-surface-400">
                Avg Win: <span className="font-semibold text-accent-error">{formatNumber(stats.avgWin)}</span>
              </span>
            </div>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-surface-500 transition-transform duration-300 ${
            isDashboardExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* 展開內容 */}
      {isDashboardExpanded && (
        <div className="h-52 px-4 pb-4 overflow-hidden animate-fade-in">
          {stats ? (
            <div className="h-full flex gap-4">
              {/* 左側：主要指標 */}
              <div className="w-48 shrink-0 flex flex-col gap-2">
                <div className="flex-1 panel p-3 flex flex-col justify-center">
                  <div className="text-xs text-surface-500 dark:text-surface-400">RTP</div>
                  <div className="text-2xl font-bold text-accent-success">
                    {formatPercent(stats.rtp)}
                  </div>
                </div>
                <div className="flex-1 panel p-3 flex flex-col justify-center">
                  <div className="text-xs text-surface-500 dark:text-surface-400">Hit Rate</div>
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {formatPercent(stats.hitRate)}
                  </div>
                </div>
                <div className="flex-1 panel p-3 flex flex-col justify-center">
                  <div className="text-xs text-surface-500 dark:text-surface-400">Avg Win</div>
                  <div className="text-2xl font-bold text-accent-error">
                    {formatNumber(stats.avgWin)}
                  </div>
                </div>
              </div>

              {/* 右側：圖表區 */}
              <div className="flex-1 panel p-3">
                {/* 圖表類型切換 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-surface-500 dark:text-surface-400">
                    Outcome 分佈
                  </span>
                  <div className="flex gap-1">
                    {(['line', 'bar', 'scatter'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setChartType(type)}
                        className={`
                          px-2 py-1 text-xs rounded transition-colors
                          ${
                            chartType === type
                              ? 'bg-primary-600 text-white'
                              : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                          }
                        `}
                      >
                        {type === 'line' ? '折線' : type === 'bar' ? '長條' : '散點'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 簡易長條圖 */}
                <div className="h-32 flex items-end gap-2">
                  {stats.outcomeDistribution.map((dist) => {
                    const height = Math.max(dist.percentage * 2, 5);
                    return (
                      <div
                        key={dist.outcomeId}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div
                          className="w-full bg-primary-500 dark:bg-primary-600 rounded-t transition-all duration-300"
                          style={{ height: `${height}%` }}
                          title={`${dist.outcomeName}: ${formatPercent(dist.percentage)}`}
                        />
                        <span className="mt-1 text-xs text-surface-500 dark:text-surface-400 truncate w-full text-center">
                          {dist.outcomeName.slice(0, 4)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 詳細數據 */}
              <div className="w-48 shrink-0 panel p-3 text-xs overflow-y-auto">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Total Spins</span>
                    <span className="font-semibold text-surface-900 dark:text-surface-100">
                      {formatNumber(stats.totalSpins)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Total Bet</span>
                    <span className="font-semibold text-surface-900 dark:text-surface-100">
                      {formatNumber(stats.totalBet)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Total Win</span>
                    <span className="font-semibold text-surface-900 dark:text-surface-100">
                      {formatNumber(stats.totalWin)}
                    </span>
                  </div>
                  <div className="border-t border-surface-200 dark:border-surface-600 my-2" />
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Max Win</span>
                    <span className="font-semibold text-accent-success">
                      {formatNumber(stats.maxWin)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Min Win</span>
                    <span className="font-semibold text-surface-900 dark:text-surface-100">
                      {formatNumber(stats.minWin)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Max Profit</span>
                    <span className="font-semibold text-accent-success">
                      {stats.maxProfit >= 0 ? '+' : ''}{formatNumber(stats.maxProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Min Profit</span>
                    <span className="font-semibold text-accent-error">
                      {formatNumber(stats.minProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
                  尚無模擬數據
                </p>
                <p className="text-xs text-surface-400 dark:text-surface-500">
                  請在最後一步執行模擬
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

