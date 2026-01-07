import { useState, type ReactNode } from 'react';
import { GameParamsPanel } from '../panels/GameParamsPanel.js';
import { OutcomePanel } from '../panels/OutcomePanel.js';
import { SymbolPanel } from '../panels/SymbolPanel.js';
import { LinesPanel } from '../panels/LinesPanel.js';
import { AnimationPanel } from '../panels/AnimationPanel.js';
import { LayoutPanel } from '../panels/LayoutPanel.js';
import { AssetPanel } from '../panels/AssetPanel.js';
import { PoolPanel } from '../panels/PoolPanel.js';

type ControlPanelTab = 'numeric' | 'visual' | 'pool';

/**
 * 可收合區塊元件
 */
interface CollapsibleSectionProps {
  title: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function CollapsibleSection({ title, icon, isExpanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="mb-2 border border-surface-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-surface-800 hover:bg-surface-700 transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-surface-200">
          <span>{icon}</span>
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
  const [expandedSection, setExpandedSection] = useState<string | null>('params');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="p-2">
      <CollapsibleSection
        title="遊戲參數"
        icon="⚙️"
        isExpanded={expandedSection === 'params'}
        onToggle={() => toggleSection('params')}
      >
        <GameParamsPanel />
      </CollapsibleSection>

      <CollapsibleSection
        title="Outcomes (NG/FG)"
        icon="📊"
        isExpanded={expandedSection === 'outcomes'}
        onToggle={() => toggleSection('outcomes')}
      >
        <OutcomePanel />
      </CollapsibleSection>

      <CollapsibleSection
        title="符號設定"
        icon="🎰"
        isExpanded={expandedSection === 'symbols'}
        onToggle={() => toggleSection('symbols')}
      >
        <SymbolPanel />
      </CollapsibleSection>

      <CollapsibleSection
        title="Pay Lines"
        icon="📏"
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
        icon="🎬"
        isExpanded={expandedSection === 'animation'}
        onToggle={() => toggleSection('animation')}
      >
        <AnimationPanel />
      </CollapsibleSection>

      <CollapsibleSection
        title="盤面佈局"
        icon="📐"
        isExpanded={expandedSection === 'layout'}
        onToggle={() => toggleSection('layout')}
      >
        <LayoutPanel />
      </CollapsibleSection>

      <CollapsibleSection
        title="素材上傳"
        icon="🖼️"
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
 * 左側控制面板（V2 三欄式佈局）
 * Tab 切換：數值設定、視覺設定、Pool 管理
 */
export function ControlPanelV2() {
  const [activeTab, setActiveTab] = useState<ControlPanelTab>('numeric');

  return (
    <div className="flex flex-col h-full bg-surface-900">
      {/* Tab 切換器 */}
      <div className="flex border-b border-surface-700 shrink-0">
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'numeric'
              ? 'text-primary-400 bg-surface-800 border-b-2 border-primary-500'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
          }`}
          onClick={() => setActiveTab('numeric')}
        >
          <span className="mr-1.5">🔢</span>
          數值
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'visual'
              ? 'text-primary-400 bg-surface-800 border-b-2 border-primary-500'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
          }`}
          onClick={() => setActiveTab('visual')}
        >
          <span className="mr-1.5">🎨</span>
          視覺
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'pool'
              ? 'text-primary-400 bg-surface-800 border-b-2 border-primary-500'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
          }`}
          onClick={() => setActiveTab('pool')}
        >
          <span className="mr-1.5">🎲</span>
          Pool
        </button>
      </div>

      {/* Tab 內容 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'numeric' && <NumericSettingsTab />}
        {activeTab === 'visual' && <VisualSettingsTab />}
        {activeTab === 'pool' && <PoolTab />}
      </div>
    </div>
  );
}
