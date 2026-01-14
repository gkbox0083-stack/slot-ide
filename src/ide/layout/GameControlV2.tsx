import { useState, type ReactNode } from 'react';
import { OutcomePanel } from '../panels/OutcomePanel.js';
import { SymbolPanel } from '../panels/SymbolPanel.js';
import { LinesPanel } from '../panels/LinesPanel.js';
import { AnimationPanel } from '../panels/AnimationPanel.js';
import { LayoutPanel } from '../panels/LayoutPanel.js';
import { AssetPanel } from '../panels/AssetPanel.js';
import { PoolPanel } from '../panels/PoolPanel.js';
import { SimulationPanel } from '../panels/SimulationPanel.js';
import { HistoryPanel } from '../panels/HistoryPanel.js';

type RightPanelTab = 'numeric' | 'visual' | 'pool' | 'sim' | 'history';

/**
 * 可收合區塊元件
 */
interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function CollapsibleSection({ title, isExpanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="mb-2 border border-surface-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-surface-800 hover:bg-surface-700 transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-surface-200">
          <span>{title}</span>
        </span>
        <span className={`text-surface-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px]' : 'max-h-0'}`}>
        <div className="p-3 bg-surface-900/50">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * 數值設定 Tab
 */
function NumericSettingsTab() {
  const [expandedSection, setExpandedSection] = useState<string | null>('outcomes');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="p-2">
      <CollapsibleSection
        title="Outcomes"
        isExpanded={expandedSection === 'outcomes'}
        onToggle={() => toggleSection('outcomes')}
      >
        <OutcomePanel />
      </CollapsibleSection>

      <CollapsibleSection
        title="符號設定"
        isExpanded={expandedSection === 'symbols'}
        onToggle={() => toggleSection('symbols')}
      >
        <SymbolPanel />
      </CollapsibleSection>

      <CollapsibleSection
        title="Pay Lines"
        isExpanded={expandedSection === 'lines'}
        onToggle={() => toggleSection('lines')}
      >
        <LinesPanel />
      </CollapsibleSection>
    </div>
  );
}

/**
 * 視覺設定 Tab
 */
function VisualSettingsTab() {
  const [expandedSection, setExpandedSection] = useState<string | null>('animation');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="p-2">
      <CollapsibleSection
        title="動畫參數"
        isExpanded={expandedSection === 'animation'}
        onToggle={() => toggleSection('animation')}
      >
        <AnimationPanel />
      </CollapsibleSection>

      <CollapsibleSection
        title="盤面佈局"
        isExpanded={expandedSection === 'layout'}
        onToggle={() => toggleSection('layout')}
      >
        <LayoutPanel />
      </CollapsibleSection>

      <CollapsibleSection
        title="素材上傳"
        isExpanded={expandedSection === 'assets'}
        onToggle={() => toggleSection('assets')}
      >
        <AssetPanel />
      </CollapsibleSection>
    </div>
  );
}

/**
 * Pool Tab
 */
function PoolTab() {
  return (
    <div className="p-2">
      <PoolPanel />
    </div>
  );
}

/**
 * 右側遊戲控制面板（V3 簡化版）
 * 移除了 FS Tab
 */
export function GameControlV2() {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('numeric');

  const tabs: { id: RightPanelTab; label: string }[] = [
    { id: 'numeric', label: '數值' },
    { id: 'visual', label: '視覺' },
    { id: 'pool', label: 'Pool' },
    { id: 'sim', label: 'Sim' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="flex flex-col h-full bg-surface-900">
      {/* Tab 切換器 */}
      <div className="flex border-b border-surface-700 shrink-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex-1 min-w-[60px] px-2 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
              ? 'text-primary-400 bg-surface-800 border-b-2 border-primary-500'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
              }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 內容 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'numeric' && <NumericSettingsTab />}
        {activeTab === 'visual' && <VisualSettingsTab />}
        {activeTab === 'pool' && <PoolTab />}
        {activeTab === 'sim' && <SimulationPanel />}
        {activeTab === 'history' && <HistoryPanel />}
      </div>
    </div>
  );
}
