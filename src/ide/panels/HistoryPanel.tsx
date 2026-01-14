import { useSimulationStore } from '../../store/useSimulationStore.js';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { calculateActualRTPFromStats, calculateAdditionalStats, calculateTheoreticalRTPBreakdown } from '../../engine/rtp-calculator.js';

/**
 * History 面板（V3 簡化版）
 * 顯示關鍵指標、RTP 分解、模擬歷史
 */
export function HistoryPanel() {
  const { results, mode } = useSimulationStore();
  const { symbols, outcomes, boardConfig } = useGameConfigStore();

  // 計算理論 RTP（V3 簡化版）
  const theoreticalRTP = calculateTheoreticalRTPBreakdown(
    symbols,
    outcomes,
    boardConfig
  );

  // 計算累計統計（V3 簡化版）
  const cumulativeStats = results.reduce((acc, r) => ({
    totalSpins: acc.totalSpins + r.totalSpins,
    totalBet: acc.totalBet + r.totalBet,
    totalWin: acc.totalWin + r.totalWin,
    lineWin: acc.lineWin + r.lineWin,
    scatterWin: acc.scatterWin + r.scatterWin,
    hitCount: acc.hitCount + r.hitCount,
    maxWin: Math.max(acc.maxWin, r.maxWin),
  }), {
    totalSpins: 0,
    totalBet: 0, totalWin: 0, lineWin: 0, scatterWin: 0,
    hitCount: 0, maxWin: 0,
  });

  const rtpBreakdown = calculateActualRTPFromStats(cumulativeStats);
  const additionalStats = calculateAdditionalStats(cumulativeStats);
  const netProfit = cumulativeStats.totalWin - cumulativeStats.totalBet;

  return (
    <div className="space-y-4 p-4">
      {/* 關鍵指標 */}
      <div className="bg-surface-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          📈 關鍵指標
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="實際 RTP"
            value={`${rtpBreakdown.totalRTP.toFixed(2)}%`}
            comparison={theoreticalRTP.totalRTP}
            type="percentage"
          />
          <StatCard
            label="Hit Rate"
            value={`${additionalStats.hitRate.toFixed(1)}%`}
            type="neutral"
          />
          <StatCard
            label="平均獲勝"
            value={`${additionalStats.avgWin.toFixed(2)}x`}
            type="neutral"
          />
          <StatCard
            label="最大獲勝"
            value={`${cumulativeStats.maxWin.toFixed(2)}x`}
            type="neutral"
          />
          <StatCard
            label="總 Spins"
            value={cumulativeStats.totalSpins.toLocaleString()}
            type="neutral"
          />
          <StatCard
            label="Scatter 獲勝"
            value={cumulativeStats.scatterWin.toLocaleString()}
            type="neutral"
          />
        </div>
      </div>

      {/* RTP 分解（V3 簡化版） */}
      <div className="bg-surface-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          🔬 RTP 分解
        </h4>
        <div className="space-y-3">
          <RTPRow
            label="Line RTP"
            actual={rtpBreakdown.lineRTP}
            theoretical={theoreticalRTP.lineRTP}
          />
          <RTPRow
            label="Scatter RTP"
            actual={rtpBreakdown.scatterRTP}
            theoretical={theoreticalRTP.scatterRTP}
          />
          <div className="border-t border-surface-700 pt-3">
            <RTPRow
              label="總 RTP"
              actual={rtpBreakdown.totalRTP}
              theoretical={theoreticalRTP.totalRTP}
              isTotal
            />
          </div>
        </div>
      </div>

      {/* 損益統計 */}
      <div className="bg-surface-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          💰 損益統計
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-400">總投注:</span>
            <span className="text-surface-200">${cumulativeStats.totalBet.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-400">連線獲勝:</span>
            <span className="text-green-400">${cumulativeStats.lineWin.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-400">Scatter 獲勝:</span>
            <span className="text-green-400">${cumulativeStats.scatterWin.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-surface-700 border-double">
            <span className="text-surface-300 font-bold uppercase tracking-tighter">總淨損益:</span>
            <span className={`font-bold text-base ${netProfit >= 0 ? 'text-green-400 underline decoration-double' : 'text-red-400'}`}>
              {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 波動性指標 */}
      <div className="bg-surface-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          📊 波動性
        </h4>
        <div className="flex items-center justify-center gap-2">
          <span className={`text-xl font-bold ${additionalStats.volatility === '高' ? 'text-red-400' :
            additionalStats.volatility === '中' ? 'text-yellow-400' : 'text-green-400'
            }`}>
            {additionalStats.volatility}
          </span>
          <span className="text-surface-400 text-sm">
            ({additionalStats.hitRate.toFixed(1)}% Hit Rate)
          </span>
        </div>
        <div className="mt-2 h-2 bg-surface-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${additionalStats.volatility === '高' ? 'bg-red-500 w-1/3' :
              additionalStats.volatility === '中' ? 'bg-yellow-500 w-2/3' : 'bg-green-500 w-full'
              }`}
          />
        </div>
        <div className="flex justify-between text-xs text-surface-500 mt-1">
          <span>低</span>
          <span>中</span>
          <span>高</span>
        </div>
      </div>

      {/* 比較模式歷史 */}
      {mode === 'compare' && results.length > 1 && (
        <div className="bg-surface-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
            📋 比較歷史
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {results.map((result, index) => {
              const rtp = (result.totalWin / result.totalBet) * 100;
              return (
                <div
                  key={index}
                  className="p-2 bg-surface-900 rounded flex justify-between items-center text-sm"
                >
                  <span className="text-surface-400">Run #{index + 1}</span>
                  <span className="text-surface-200">{result.totalSpins.toLocaleString()} spins</span>
                  <span className={`font-semibold ${rtp > theoreticalRTP.totalRTP * 1.05 ? 'text-red-400' :
                    rtp < theoreticalRTP.totalRTP * 0.95 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                    {rtp.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 無數據提示 */}
      {results.length === 0 && (
        <div className="bg-surface-800/50 rounded-lg p-8 text-center">
          <p className="text-surface-500 text-lg mb-2">📊 尚無模擬數據</p>
          <p className="text-surface-600 text-sm">
            前往 Simulation Tab 開始模擬
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 統計卡片元件
 */
interface StatCardProps {
  label: string;
  value: string;
  comparison?: number;
  type: 'percentage' | 'neutral';
}

function StatCard({ label, value, comparison, type }: StatCardProps) {
  const numValue = parseFloat(value);
  let colorClass = 'text-surface-200';

  if (type === 'percentage' && comparison !== undefined) {
    if (numValue > comparison * 1.05) {
      colorClass = 'text-red-400';
    } else if (numValue < comparison * 0.95) {
      colorClass = 'text-yellow-400';
    } else {
      colorClass = 'text-green-400';
    }
  }

  return (
    <div className="p-3 bg-surface-900 rounded-lg">
      <div className="text-xs text-surface-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}

/**
 * RTP 行元件
 */
interface RTPRowProps {
  label: string;
  actual: number;
  theoretical: number;
  precision?: number;
  isTotal?: boolean;
}

function RTPRow({ label, actual, theoretical, precision = 2, isTotal }: RTPRowProps) {
  const diff = actual - theoretical;
  const diffPercent = theoretical > 0 ? (diff / theoretical) * 100 : 0;

  let diffColor = 'text-surface-500';
  if (Math.abs(diffPercent) > 5) {
    diffColor = diff > 0 ? 'text-red-400' : 'text-yellow-400';
  } else {
    diffColor = 'text-green-400';
  }

  return (
    <div className={`flex items-center justify-between text-sm ${isTotal ? 'font-semibold' : ''}`}>
      <span className={isTotal ? 'text-yellow-400' : 'text-surface-400'}>{label}</span>
      <div className="flex items-center gap-3">
        <span className={`${isTotal ? 'text-white' : 'text-surface-200'}`}>
          {actual.toFixed(precision)}%
        </span>
        <span className="text-surface-600">
          (理論: {theoretical.toFixed(precision)}%)
        </span>
        <span className={`${diffColor} text-xs`}>
          {diff >= 0 ? '+' : ''}{diff.toFixed(precision)}%
        </span>
      </div>
    </div>
  );
}
