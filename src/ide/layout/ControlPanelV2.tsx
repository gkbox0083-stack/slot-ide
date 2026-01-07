import { useState } from 'react';
import { GameParamsPanel } from '../panels/GameParamsPanel.js';
import { OutcomePanel } from '../panels/OutcomePanel.js';
import { SymbolPanel } from '../panels/SymbolPanel.js';
import { LinesPanel } from '../panels/LinesPanel.js';
import { AnimationPanel } from '../panels/AnimationPanel.js';
import { LayoutPanel } from '../panels/LayoutPanel.js';
import { AssetPanel } from '../panels/AssetPanel.js';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { poolBuilder, symbolManager } from '../../engine/index.js';

type ControlPanelTab = 'numeric' | 'visual' | 'pool';

/**
 * 左側控制面板（V2 三欄式佈局）
 * Tab 切換：數值設定、視覺設定、Pool 管理
 */
export function ControlPanelV2() {
  const [activeTab, setActiveTab] = useState<ControlPanelTab>('numeric');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [poolStatus, setPoolStatus] = useState<{ outcomeId: string; outcomeName: string; generated: number; cap: number; isFull: boolean }[]>([]);
  
  const { boardConfig, symbols, outcomeConfig, freeSpinConfig } = useGameConfigStore();

  const handleBuildPools = async () => {
    setIsBuilding(true);
    setBuildError(null);
    
    try {
      // 更新 PoolBuilder 的盤面配置
      poolBuilder.setBoardConfig(boardConfig);
      
      // 同步符號（使用 SymbolManager 的 update）
      symbols.forEach((symbol) => {
        symbolManager.update(symbol);
      });
      
      // 建立盤池
      const result = poolBuilder.buildPools(100);
      
      if (result.success) {
        setPoolStatus(result.pools);
      } else {
        setBuildError(result.errors.join('; ') || '建立盤池失敗');
        setPoolStatus(result.pools);
      }
    } catch (error) {
      setBuildError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsBuilding(false);
    }
  };

  const renderNumericTab = () => (
    <div className="flex flex-col gap-4 p-4">
      <GameParamsPanel />
      <OutcomePanel />
      <SymbolPanel />
      <LinesPanel />
    </div>
  );

  const renderVisualTab = () => (
    <div className="flex flex-col gap-4 p-4">
      <AnimationPanel />
      <LayoutPanel />
      <AssetPanel />
    </div>
  );

  const renderPoolTab = () => (
    <div className="flex flex-col gap-4 p-4">
      {/* 盤面配置顯示 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          📐 盤面配置
        </h3>
        <div className="text-sm text-surface-600 dark:text-surface-400">
          <p>盤面尺寸：{boardConfig.cols} × {boardConfig.rows}</p>
          <p>符號數量：{symbols.length}</p>
          <p>NG Outcomes：{outcomeConfig.ngOutcomes.length}</p>
          <p>FG Outcomes：{outcomeConfig.fgOutcomes.length}</p>
          <p>Free Spin：{freeSpinConfig.enabled ? '啟用' : '停用'}</p>
        </div>
      </div>
      
      {/* Build Pools 按鈕 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          🏊 盤池管理
        </h3>
        
        <button
          type="button"
          onClick={handleBuildPools}
          disabled={isBuilding}
          className="btn-primary w-full mb-4"
        >
          {isBuilding ? '🔨 Building...' : '🔨 Build Pools'}
        </button>
        
        {buildError && (
          <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">⚠️ {buildError}</p>
          </div>
        )}
        
        {poolStatus.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400">盤池狀態：</p>
            {poolStatus.map((pool) => (
              <div key={pool.outcomeId} className="flex justify-between text-sm">
                <span className="text-surface-700 dark:text-surface-300">{pool.outcomeName}</span>
                <span className={pool.isFull ? 'text-accent-success font-semibold' : 'text-accent-warning'}>
                  {pool.generated}/{pool.cap} {pool.isFull ? '✅' : '⚠️'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Tab 切換器 */}
      <div className="flex border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'numeric'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 bg-white dark:bg-surface-900'
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
          }`}
          onClick={() => setActiveTab('numeric')}
        >
          🔢 數值
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'visual'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 bg-white dark:bg-surface-900'
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
          }`}
          onClick={() => setActiveTab('visual')}
        >
          🎨 視覺
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'pool'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 bg-white dark:bg-surface-900'
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
          }`}
          onClick={() => setActiveTab('pool')}
        >
          🎲 Pool
        </button>
      </div>

      {/* Tab 內容 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'numeric' && renderNumericTab()}
        {activeTab === 'visual' && renderVisualTab()}
        {activeTab === 'pool' && renderPoolTab()}
      </div>
    </div>
  );
}

