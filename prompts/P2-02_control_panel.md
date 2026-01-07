# P2-02 左側 Control Panel 架構

## 目標 (Objective)

完成左側 Control Panel 的完整架構，包括：
- 數值設定 Tab（Outcomes、Symbols、Pay Lines）
- 視覺設定 Tab（動畫、佈局、素材）
- Pool Tab（盤面模式、Build、狀態）

---

## 範圍 (Scope)

需要修改的檔案：
- `src/ide/layout/ControlPanel.tsx`

需要整合的現有面板：
- `src/ide/panels/OutcomePanel.tsx`
- `src/ide/panels/SymbolPanel.tsx`
- `src/ide/panels/LinesPanel.tsx`
- `src/ide/panels/AnimationPanel.tsx`
- `src/ide/panels/LayoutPanel.tsx`
- `src/ide/panels/AssetPanel.tsx`

需要新增的檔案：
- `src/ide/panels/PoolPanel.tsx`

依賴：
- P2-01（三欄式佈局骨架）

---

## 實作細節 (Implementation Details)

### ControlPanel.tsx 完整實作

```tsx
import React, { useState } from 'react';
import { OutcomePanel } from '../panels/OutcomePanel';
import { SymbolPanel } from '../panels/SymbolPanel';
import { LinesPanel } from '../panels/LinesPanel';
import { AnimationPanel } from '../panels/AnimationPanel';
import { LayoutPanel } from '../panels/LayoutPanel';
import { AssetPanel } from '../panels/AssetPanel';
import { PoolPanel } from '../panels/PoolPanel';

type ControlPanelTab = 'numeric' | 'visual' | 'pool';

export function ControlPanel() {
  const [activeTab, setActiveTab] = useState<ControlPanelTab>('numeric');

  return (
    <div className="control-panel">
      {/* Tab 切換器 */}
      <div className="control-panel-tabs">
        <button 
          className={`tab ${activeTab === 'numeric' ? 'active' : ''}`}
          onClick={() => setActiveTab('numeric')}
        >
          🔢 數值設定
        </button>
        <button 
          className={`tab ${activeTab === 'visual' ? 'active' : ''}`}
          onClick={() => setActiveTab('visual')}
        >
          🎨 視覺設定
        </button>
        <button 
          className={`tab ${activeTab === 'pool' ? 'active' : ''}`}
          onClick={() => setActiveTab('pool')}
        >
          🎲 Pool
        </button>
      </div>

      {/* Tab 內容 */}
      <div className="control-panel-content">
        {activeTab === 'numeric' && <NumericSettingsTab />}
        {activeTab === 'visual' && <VisualSettingsTab />}
        {activeTab === 'pool' && <PoolTab />}
      </div>
    </div>
  );
}

/**
 * 數值設定 Tab
 */
function NumericSettingsTab() {
  const [expandedSection, setExpandedSection] = useState<string | null>('outcomes');

  return (
    <div className="numeric-settings">
      {/* Outcomes Section */}
      <CollapsibleSection
        title="📊 Outcomes"
        isExpanded={expandedSection === 'outcomes'}
        onToggle={() => setExpandedSection(expandedSection === 'outcomes' ? null : 'outcomes')}
      >
        <OutcomePanel />
      </CollapsibleSection>

      {/* Symbols Section */}
      <CollapsibleSection
        title="🎰 Symbols"
        isExpanded={expandedSection === 'symbols'}
        onToggle={() => setExpandedSection(expandedSection === 'symbols' ? null : 'symbols')}
      >
        <SymbolPanel />
      </CollapsibleSection>

      {/* Pay Lines Section */}
      <CollapsibleSection
        title="📏 Pay Lines"
        isExpanded={expandedSection === 'lines'}
        onToggle={() => setExpandedSection(expandedSection === 'lines' ? null : 'lines')}
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

  return (
    <div className="visual-settings">
      {/* Animation Section */}
      <CollapsibleSection
        title="🎬 動畫參數"
        isExpanded={expandedSection === 'animation'}
        onToggle={() => setExpandedSection(expandedSection === 'animation' ? null : 'animation')}
      >
        <AnimationPanel />
      </CollapsibleSection>

      {/* Layout Section */}
      <CollapsibleSection
        title="📐 盤面佈局"
        isExpanded={expandedSection === 'layout'}
        onToggle={() => setExpandedSection(expandedSection === 'layout' ? null : 'layout')}
      >
        <LayoutPanel />
      </CollapsibleSection>

      {/* Assets Section */}
      <CollapsibleSection
        title="🖼️ 素材上傳"
        isExpanded={expandedSection === 'assets'}
        onToggle={() => setExpandedSection(expandedSection === 'assets' ? null : 'assets')}
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
    <div className="pool-settings">
      <PoolPanel />
    </div>
  );
}

/**
 * 可收合區塊元件
 */
interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, isExpanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className={`collapsible-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button className="section-header" onClick={onToggle}>
        <span className="section-title">{title}</span>
        <span className="section-toggle">{isExpanded ? '▼' : '▶'}</span>
      </button>
      {isExpanded && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );
}
```

### PoolPanel.tsx 新增

```tsx
import React, { useState } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore';
import type { BoardRows } from '../../types/board';

export function PoolPanel() {
  const { 
    boardConfig, 
    setBoardRows, 
    poolStatus, 
    isPoolsBuilt,
    buildPools,
    clearPools,
  } = useGameConfigStore();
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRows, setPendingRows] = useState<BoardRows | null>(null);

  const handleBoardRowsChange = (rows: BoardRows) => {
    if (isPoolsBuilt) {
      setPendingRows(rows);
      setShowConfirmDialog(true);
    } else {
      setBoardRows(rows);
    }
  };

  const confirmBoardChange = () => {
    if (pendingRows) {
      clearPools();
      setBoardRows(pendingRows);
    }
    setShowConfirmDialog(false);
    setPendingRows(null);
  };

  const cancelBoardChange = () => {
    setShowConfirmDialog(false);
    setPendingRows(null);
  };

  return (
    <div className="pool-panel">
      {/* 盤面模式 */}
      <div className="panel-section">
        <h4>盤面模式</h4>
        <div className="board-mode-selector">
          <label className={boardConfig.rows === 3 ? 'selected' : ''}>
            <input
              type="radio"
              name="boardRows"
              checked={boardConfig.rows === 3}
              onChange={() => handleBoardRowsChange(3)}
            />
            5×3
          </label>
          <label className={boardConfig.rows === 4 ? 'selected' : ''}>
            <input
              type="radio"
              name="boardRows"
              checked={boardConfig.rows === 4}
              onChange={() => handleBoardRowsChange(4)}
            />
            5×4
          </label>
        </div>
        {isPoolsBuilt && (
          <p className="warning-text">⚠️ 切換模式將清空現有 Pool</p>
        )}
      </div>

      {/* Build Pools */}
      <div className="panel-section">
        <h4>Build Pools</h4>
        <button 
          className="build-button"
          onClick={buildPools}
        >
          🔨 Build Pools
        </button>
        <div className="pool-status">
          <span>狀態: {isPoolsBuilt ? '✅ 已建立' : '❌ 未建立'}</span>
        </div>
      </div>

      {/* Pool 狀態 */}
      {poolStatus.length > 0 && (
        <div className="panel-section">
          <h4>Pool 狀態</h4>
          <div className="pool-status-list">
            {poolStatus.map((status) => (
              <div 
                key={status.key} 
                className={`pool-status-item ${status.isComplete ? 'complete' : 'incomplete'}`}
              >
                <span className="pool-name">
                  {status.phase === 'base' ? 'NG' : 'FG'} - {status.outcomeId}
                </span>
                <span className="pool-count">
                  {status.count}/{status.cap}
                </span>
                {!status.isComplete && <span className="warning">⚠️</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 確認對話框 */}
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3>⚠️ 確認切換盤面模式</h3>
            <p>
              你即將從 5×{boardConfig.rows} 切換到 5×{pendingRows} 模式。
            </p>
            <p>此操作將會：</p>
            <ul>
              <li>清空所有已建立的 Pool</li>
              <li>重置 Pay Lines 配置</li>
            </ul>
            <p>確定要繼續嗎？</p>
            <div className="dialog-actions">
              <button onClick={cancelBoardChange}>取消</button>
              <button className="confirm" onClick={confirmBoardChange}>
                確認切換
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### CSS 樣式

```css
/* Control Panel Styles */

.control-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.control-panel-tabs {
  display: flex;
  border-bottom: 1px solid #333;
}

.control-panel-tabs .tab {
  flex: 1;
  padding: 0.75rem;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.control-panel-tabs .tab:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.control-panel-tabs .tab.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 2px solid #6366f1;
}

.control-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

/* Collapsible Section */

.collapsible-section {
  margin-bottom: 0.5rem;
  border: 1px solid #333;
  border-radius: 4px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #fff;
  cursor: pointer;
  text-align: left;
}

.section-header:hover {
  background: rgba(255, 255, 255, 0.1);
}

.section-content {
  padding: 0.75rem;
  border-top: 1px solid #333;
}

/* Pool Panel */

.pool-panel .panel-section {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #333;
}

.board-mode-selector {
  display: flex;
  gap: 1rem;
}

.board-mode-selector label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
}

.board-mode-selector label.selected {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

.warning-text {
  color: #f59e0b;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.build-button {
  width: 100%;
  padding: 0.75rem;
  background: #6366f1;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
}

.build-button:hover {
  background: #4f46e5;
}

/* Confirm Dialog */

.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: #1a1a2e;
  padding: 1.5rem;
  border-radius: 8px;
  max-width: 400px;
  border: 1px solid #333;
}

.confirm-dialog h3 {
  margin-top: 0;
  color: #f59e0b;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.dialog-actions button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.dialog-actions button.confirm {
  background: #ef4444;
  border: none;
  color: #fff;
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 三個 Tab 可正常切換
- [ ] 數值設定 Tab 顯示 Outcomes、Symbols、Pay Lines
- [ ] 視覺設定 Tab 顯示動畫、佈局、素材
- [ ] Pool Tab 顯示盤面模式選擇器
- [ ] 盤面模式切換時彈出確認對話框
- [ ] Pool 狀態正確顯示
- [ ] Build Pools 按鈕可用
- [ ] 可收合區塊正常運作
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/ide/layout/ControlPanel.tsx` 完整程式碼
2. `src/ide/panels/PoolPanel.tsx` 完整程式碼
3. CSS 樣式
4. 螢幕截圖

