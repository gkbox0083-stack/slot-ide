import { useRef, useMemo, useState, useEffect } from 'react';
import { SlotMachine } from '../../runtime/index.js';
import type { SlotMachineRef } from '../../runtime/index.js';
import type { SpinPacket } from '../../types/spin-packet.js';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { LeftSidebar } from './LeftSidebar.js';
import { GameControlV2 } from './GameControlV2.js';
import { GameControlBar } from './GameControlBar.js';
import { StatisticsPanelV2 } from './StatisticsPanelV2.js';

/**
 * 生成預設展示用 SpinPacket（無需執行 spin）
 * 顯示固定的展示盤面，讓用戶了解產品功能
 */
function createDemoSpinPacket(
  symbols: { id: string }[],
  visualConfig: SpinPacket['visual'],
  assets: SpinPacket['assets'],
  boardConfig: { cols: 5; rows: 3 | 4 }
): SpinPacket {
  const { cols, rows } = boardConfig;

  // 建立展示用盤面：均勻分布各種符號
  const reels: string[][] = [];
  for (let col = 0; col < cols; col++) {
    const reel: string[] = [];
    for (let row = 0; row < rows; row++) {
      // 輪流使用各種符號，讓用戶看到完整的符號集
      const symbolIndex = (col * rows + row) % symbols.length;
      reel.push(symbols[symbolIndex].id);
    }
    reels.push(reel);
  }

  return {
    version: '3',
    board: { reels, cols, rows },
    visual: visualConfig,
    assets: assets && Object.keys(assets).length > 0 ? assets : undefined,
    isDemo: true,  // 標記為展示模式，不觸發 spin 動畫
  };
}


/**
 * IDE 主佈局 V2（新版三欄式）
 * 
 * 結構：
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Header                                                         │
 * ├────┬─────────────────────────────────────────────┬──────────────┤
 * │    │                                             │              │
 * │ L  │              SlotMachine                    │    Right     │
 * │ e  │               (中央)                        │    Panel     │
 * │ f  │                                             │   (Tabs)     │
 * │ t  │    ┌────────────────────────────────┐      │              │
 * │    │    │   GameControlBar (底部)         │      │              │
 * │ S  │    └────────────────────────────────┘      │              │
 * │ i  │                                             │              │
 * │ d  │                                             │              │
 * │ e  │                                             │              │
 * │ b  │                                             │              │
 * │ a  │                                             │              │
 * │ r  │                                             │              │
 * ├────┴─────────────────────────────────────────────┴──────────────┤
 * │  Statistics Panel (可收合)                                       │
 * └─────────────────────────────────────────────────────────────────┘
 */
export function IDELayoutV2() {
  const slotMachineRef = useRef<SlotMachineRef>(null);
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(true);
  const isInitializedRef = useRef(false);

  const {
    currentSpinPacket,
    visualConfig,
    assets,
    gameName,
    symbols,  // 符號設定
    boardConfig,
    setCurrentSpinPacket,
  } = useGameConfigStore();

  // 首次進入頁面時顯示預設展示盤面（不執行 spin）
  useEffect(() => {
    // 使用 ref 確保只執行一次（避免 React 18 StrictMode double render）
    if (isInitializedRef.current) return;

    // 如果已經有 SpinPacket，不重複初始化
    if (currentSpinPacket) {
      isInitializedRef.current = true;
      return;
    }

    isInitializedRef.current = true;

    // 建立靜態展示用 SpinPacket（不需要 Pool，不執行 spin）
    const demoPacket = createDemoSpinPacket(symbols, visualConfig, assets, boardConfig);
    setCurrentSpinPacket(demoPacket);
  }, []);

  // 提取符號 ID 列表（用於 Reel 生成 Dummy）
  const availableSymbolIds = useMemo(() => symbols.map(s => s.id), [symbols]);

  // 提取符號視覺權重映射（appearanceWeight）
  const symbolWeights = useMemo(() => {
    const weights: Record<string, number> = {};
    for (const s of symbols) {
      weights[s.id] = s.appearanceWeight;
    }
    return weights;
  }, [symbols]);

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

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* 左側 Icon 導航欄（佔位） */}
        <LeftSidebar />

        {/* 中間 Slot Machine */}
        <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950 p-4 relative">
          {/* 裝飾背景 */}
          <div className="absolute inset-0 -m-8 bg-gradient-to-br from-primary-900/20 to-purple-900/20 rounded-3xl blur-xl pointer-events-none" />

          {/* Slot Machine */}
          <div className="relative z-10">
            <SlotMachine
              ref={slotMachineRef}
              spinPacket={displaySpinPacket}
              availableSymbols={availableSymbolIds}
              symbolWeights={symbolWeights}
              onSpinComplete={() => {
                // Spin complete callback
              }}
              onSkip={() => {
                // Spin skipped callback
              }}
            />
          </div>

          {/* 底部控制欄 */}
          <GameControlBar />
        </section>

        {/* 右側 Game Control (合併所有設定 Tab) */}
        <aside className="w-[400px] min-w-[400px] max-w-[400px] bg-surface-900 border-l border-surface-700 overflow-hidden">
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
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isStatsPanelOpen ? 'max-h-[320px]' : 'max-h-0'
            }`}
        >
          <StatisticsPanelV2 />
        </div>
      </footer>
    </div>
  );
}
