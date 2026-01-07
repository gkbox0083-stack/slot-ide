import { useState } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { calculateTheoreticalRTPBreakdown } from '../../engine/index.js';

/**
 * 底部統計面板（V2 三欄式佈局）
 * 可收合/展開
 */
export function StatisticsPanelV2() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { symbols, outcomeConfig, freeSpinConfig, boardConfig } = useGameConfigStore();
  
  // 計算 RTP 分解
  const rtpBreakdown = calculateTheoreticalRTPBreakdown(
    symbols,
    outcomeConfig,
    freeSpinConfig,
    boardConfig
  );

  return (
    <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'h-64' : 'h-10'}`}>
      {/* 切換按鈕 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full h-10 px-4 flex items-center justify-center gap-2 bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-colors border-t border-surface-700"
      >
        <span>{isExpanded ? '▼' : '▲'}</span>
        <span className="text-sm font-medium">
          {isExpanded ? '收合統計' : '展開統計'}
        </span>
        <span className="text-xs text-surface-500 ml-2">
          RTP: {rtpBreakdown.totalRTP.toFixed(2)}%
        </span>
      </button>
      
      {/* 統計內容 */}
      {isExpanded && (
        <div className="h-[calc(100%-40px)] p-4 bg-surface-900 overflow-hidden">
          <div className="flex gap-4 h-full">
            {/* RTP 分解 */}
            <div className="flex-1 panel-dark p-4">
              <h4 className="text-sm font-semibold text-surface-300 mb-3">📊 RTP 分解</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-surface-500">NG RTP</p>
                  <p className="text-xl font-bold text-blue-400">{rtpBreakdown.ngRTP.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500">FG 貢獻</p>
                  <p className="text-xl font-bold text-purple-400">{rtpBreakdown.fgRTPContribution.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500">總 RTP</p>
                  <p className="text-2xl font-bold text-green-400">{rtpBreakdown.totalRTP.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500">FG 觸發機率</p>
                  <p className="text-xl font-bold text-yellow-400">{rtpBreakdown.fgTriggerProbability.toFixed(4)}%</p>
                </div>
              </div>
            </div>
            
            {/* Outcome 分佈（簡化版） */}
            <div className="flex-1 panel-dark p-4">
              <h4 className="text-sm font-semibold text-surface-300 mb-3">🎯 NG Outcome 分佈</h4>
              <div className="space-y-2">
                {outcomeConfig.ngOutcomes.map(outcome => {
                  const totalWeight = outcomeConfig.ngOutcomes.reduce((sum, o) => sum + o.weight, 0);
                  const percentage = totalWeight > 0 ? (outcome.weight / totalWeight) * 100 : 0;
                  
                  return (
                    <div key={outcome.id} className="flex items-center gap-2">
                      <span className="text-xs text-surface-400 w-16 truncate">{outcome.name}</span>
                      <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-500"
                          style={{ width: `${Math.min(percentage * 2, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-surface-400 w-12 text-right">{percentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Symbol 權重（簡化版） */}
            <div className="flex-1 panel-dark p-4">
              <h4 className="text-sm font-semibold text-surface-300 mb-3">🎰 Symbol 權重</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {symbols.filter(s => s.type === 'normal').slice(0, 6).map(symbol => {
                  const totalWeight = symbols.reduce((sum, s) => sum + s.ngWeight, 0);
                  const percentage = totalWeight > 0 ? (symbol.ngWeight / totalWeight) * 100 : 0;
                  
                  return (
                    <div key={symbol.id} className="flex items-center gap-2">
                      <span className="text-xs text-surface-400 w-8">{symbol.id}</span>
                      <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500"
                          style={{ width: `${Math.min(percentage * 2, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-surface-400 w-10 text-right">{percentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

