import { useRef, useMemo, useState } from 'react';
import { SlotMachine } from '../../runtime/index.js';
import type { SlotMachineRef } from '../../runtime/index.js';
import type { SpinPacket } from '../../types/spin-packet.js';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { ControlPanelV2 } from './ControlPanelV2.js';
import { GameControlV2 } from './GameControlV2.js';
import { StatisticsPanelV2 } from './StatisticsPanelV2.js';

/**
 * IDE 主佈局 V2（三欄式）
 * 
 * 結構：
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Header                                                         │
 * ├─────────────┬─────────────────────────────┬─────────────────────┤
 * │             │                             │                     │
 * │  Control    │      SlotMachine            │    GameControl      │
 * │   Panel     │         (50%)               │      Panel          │
 * │   (25%)     │                             │      (25%)          │
 * │             │                             │                     │
 * ├─────────────┴─────────────────────────────┴─────────────────────┤
 * │  Statistics Panel (可收合)                                       │
 * └─────────────────────────────────────────────────────────────────┘
 */
export function IDELayoutV2() {
  const slotMachineRef = useRef<SlotMachineRef>(null);
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(true);
  
  const { 
    currentSpinPacket, 
    visualConfig, 
    assets,
    gameName 
  } = useGameConfigStore();

  // 同步 visualConfig 和 assets 到 currentSpinPacket
  const displaySpinPacket = useMemo<SpinPacket | undefined>(() => {
    if (!currentSpinPacket) {
      return undefined;
    }
    
    const visualChanged = JSON.stringify(currentSpinPacket.visual) !== JSON.stringify(visualConfig);
    const assetsChanged = JSON.stringify(currentSpinPacket.assets) !== JSON.stringify(assets);
    
    if (visualChanged || assetsChanged) {
      return {
        ...currentSpinPacket,
        visual: visualConfig,
        assets: Object.keys(assets).length > 0 ? assets : undefined,
      };
    }
    return currentSpinPacket;
  }, [currentSpinPacket, visualConfig, assets]);

  return (
    <div className="flex flex-col h-screen bg-surface-950 text-white overflow-hidden">
      {/* Header */}
      <header className="h-12 px-4 flex items-center justify-between bg-surface-900 border-b border-surface-700 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎰</span>
          <span className="font-bold text-lg">slot-ide</span>
          <span className="text-surface-400 text-sm">v2.0</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-surface-400">
            {gameName || '未命名專案'}
          </span>
          {/* Phase 3 實作：用戶區域 */}
          <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-sm">
            👤
          </div>
        </div>
      </header>

      {/* Main Content - 三欄式 */}
      <main className="flex flex-1 overflow-hidden">
        {/* 左側 Control Panel (25%) */}
        <aside className="w-1/4 min-w-[280px] max-w-[400px] bg-surface-900 border-r border-surface-700 overflow-hidden">
          <ControlPanelV2 />
        </aside>

        {/* 中間 Slot Machine (50%) */}
        <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950 p-4">
          <div className="relative">
            {/* 裝飾背景 */}
            <div className="absolute inset-0 -m-8 bg-gradient-to-br from-primary-900/20 to-purple-900/20 rounded-3xl blur-xl" />
            
            {/* Slot Machine */}
            <div className="relative">
              <SlotMachine
                ref={slotMachineRef}
                spinPacket={displaySpinPacket}
                onSpinComplete={() => {
                  console.log('Spin complete');
                }}
                onSkip={() => {
                  console.log('Spin skipped');
                }}
              />
            </div>
          </div>
        </section>

        {/* 右側 Game Control (25%) */}
        <aside className="w-1/4 min-w-[280px] max-w-[400px] bg-surface-900 border-l border-surface-700 overflow-hidden">
          <GameControlV2 />
        </aside>
      </main>

      {/* 底部 Statistics Panel (可收合) */}
      <footer className="shrink-0 border-t border-surface-700 bg-surface-900">
        {/* 收合/展開按鈕 */}
        <button
          type="button"
          onClick={() => setIsStatsPanelOpen(!isStatsPanelOpen)}
          className="w-full py-2 px-4 flex items-center justify-center gap-2 text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors text-sm"
        >
          <span className={`transition-transform duration-200 ${isStatsPanelOpen ? '' : 'rotate-180'}`}>
            ▼
          </span>
          <span>{isStatsPanelOpen ? '收合統計' : '展開統計'}</span>
        </button>
        
        {/* 統計內容 - 可收合區域 */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isStatsPanelOpen ? 'max-h-[300px]' : 'max-h-0'
          }`}
        >
          <StatisticsPanelV2 />
        </div>
      </footer>
    </div>
  );
}

