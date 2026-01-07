# P2-01 三欄式佈局骨架

## 目標 (Objective)

重構 IDE 主佈局為三欄式架構：
- 左側 Control Panel (25%)
- 中間 Slot Machine (50%)
- 右側 Game Control (25%)
- 底部 Statistics Panel (可收合)

---

## 範圍 (Scope)

需要修改的檔案：
- `src/ide/layout/IDELayout.tsx`
- `src/App.tsx`（如需要）

需要新增的檔案：
- `src/ide/layout/ControlPanel.tsx`
- `src/ide/layout/GameControl.tsx`
- `src/ide/layout/StatisticsPanel.tsx`

依賴：
- Phase 1 完成

---

## 實作細節 (Implementation Details)

### 佈局結構

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header                                                              │
├──────────────────┬────────────────────────────┬──────────────────────┤
│                  │                            │                      │
│  ControlPanel    │      SlotMachine           │    GameControl       │
│     (25%)        │         (50%)              │       (25%)          │
│                  │                            │                      │
│                  │                            │                      │
│                  │                            │                      │
│                  │                            │                      │
├──────────────────┴────────────────────────────┴──────────────────────┤
│  StatisticsPanel (可收合)                                             │
└──────────────────────────────────────────────────────────────────────┘
```

### IDELayout.tsx 重構

```tsx
import React, { useState } from 'react';
import { ControlPanel } from './ControlPanel';
import { GameControl } from './GameControl';
import { StatisticsPanel } from './StatisticsPanel';
import { SlotMachine } from '../../runtime/SlotMachine';
import { useGameConfigStore } from '../../store/useGameConfigStore';

export function IDELayout() {
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(true);
  const currentSpinPacket = useGameConfigStore((state) => state.currentSpinPacket);

  return (
    <div className="ide-layout">
      {/* Header */}
      <header className="ide-header">
        <div className="ide-logo">🎰 slot-ide</div>
        <div className="ide-template-selector">
          {/* 模板選擇器（Phase 3 實作） */}
        </div>
        <div className="ide-user-area">
          {/* 用戶區域（Phase 3 實作） */}
        </div>
      </header>

      {/* Main Content */}
      <main className="ide-main">
        {/* 左側 Control Panel */}
        <aside className="ide-control-panel">
          <ControlPanel />
        </aside>

        {/* 中間 Slot Machine */}
        <section className="ide-slot-machine">
          <SlotMachine packet={currentSpinPacket} />
        </section>

        {/* 右側 Game Control */}
        <aside className="ide-game-control">
          <GameControl />
        </aside>
      </main>

      {/* 底部 Statistics Panel */}
      <footer className={`ide-statistics ${isStatsPanelOpen ? 'open' : 'closed'}`}>
        <button 
          className="ide-stats-toggle"
          onClick={() => setIsStatsPanelOpen(!isStatsPanelOpen)}
        >
          {isStatsPanelOpen ? '▼ 收合統計' : '▲ 展開統計'}
        </button>
        {isStatsPanelOpen && <StatisticsPanel />}
      </footer>
    </div>
  );
}
```

### CSS 樣式（Tailwind 或自訂）

```css
/* src/index.css 或新增 src/ide/layout/IDELayout.css */

.ide-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.ide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  height: 48px;
  background: #1a1a2e;
  border-bottom: 1px solid #333;
}

.ide-logo {
  font-size: 1.25rem;
  font-weight: bold;
  color: #fff;
}

.ide-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.ide-control-panel {
  width: 25%;
  min-width: 280px;
  max-width: 400px;
  background: #16162a;
  border-right: 1px solid #333;
  overflow-y: auto;
}

.ide-slot-machine {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f0f1a;
  padding: 1rem;
}

.ide-game-control {
  width: 25%;
  min-width: 280px;
  max-width: 400px;
  background: #16162a;
  border-left: 1px solid #333;
  overflow-y: auto;
}

.ide-statistics {
  background: #1a1a2e;
  border-top: 1px solid #333;
  transition: height 0.3s ease;
}

.ide-statistics.open {
  height: 250px;
}

.ide-statistics.closed {
  height: 40px;
}

.ide-stats-toggle {
  width: 100%;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  text-align: center;
}

.ide-stats-toggle:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}
```

### ControlPanel.tsx 骨架

```tsx
import React, { useState } from 'react';

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
          🔢 數值
        </button>
        <button 
          className={`tab ${activeTab === 'visual' ? 'active' : ''}`}
          onClick={() => setActiveTab('visual')}
        >
          🎨 視覺
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
        {activeTab === 'numeric' && (
          <div className="tab-content">
            {/* P2-02 實作 */}
            <p>數值設定面板</p>
          </div>
        )}
        {activeTab === 'visual' && (
          <div className="tab-content">
            {/* P2-02 實作 */}
            <p>視覺設定面板</p>
          </div>
        )}
        {activeTab === 'pool' && (
          <div className="tab-content">
            {/* P2-02 實作 */}
            <p>Pool 管理面板</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### GameControl.tsx 骨架

```tsx
import React, { useState } from 'react';

type GameControlTab = 'betting' | 'simulation' | 'history' | 'freespin';

export function GameControl() {
  const [activeTab, setActiveTab] = useState<GameControlTab>('betting');
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);

  const handleSpin = () => {
    // 單次 Spin
  };

  const handleSimulation = () => {
    // 開始 Simulation
  };

  const handleAutoSpin = () => {
    setIsAutoSpinning(!isAutoSpinning);
    // Auto Spin 邏輯
  };

  return (
    <div className="game-control">
      {/* 頂部快捷鍵 */}
      <div className="quick-actions">
        <button className="action-btn spin" onClick={handleSpin}>
          🎰 SPIN
        </button>
        <button className="action-btn sim" onClick={handleSimulation}>
          📊 SIM
        </button>
        <button 
          className={`action-btn auto ${isAutoSpinning ? 'active' : ''}`}
          onClick={handleAutoSpin}
        >
          {isAutoSpinning ? '⏹️ STOP' : '🔄 AUTO'}
        </button>
      </div>

      {/* Tab 切換器 */}
      <div className="game-control-tabs">
        <button 
          className={`tab ${activeTab === 'betting' ? 'active' : ''}`}
          onClick={() => setActiveTab('betting')}
        >
          Betting
        </button>
        <button 
          className={`tab ${activeTab === 'simulation' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulation')}
        >
          Simulation
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button 
          className={`tab ${activeTab === 'freespin' ? 'active' : ''}`}
          onClick={() => setActiveTab('freespin')}
        >
          Free Spin
        </button>
      </div>

      {/* Tab 內容 */}
      <div className="game-control-content">
        {activeTab === 'betting' && <div>Betting Panel（P2-03 實作）</div>}
        {activeTab === 'simulation' && <div>Simulation Panel（P2-03 實作）</div>}
        {activeTab === 'history' && <div>History Panel（P2-03 實作）</div>}
        {activeTab === 'freespin' && <div>Free Spin Panel（P2-08 實作）</div>}
      </div>
    </div>
  );
}
```

### StatisticsPanel.tsx 骨架

```tsx
import React from 'react';

export function StatisticsPanel() {
  return (
    <div className="statistics-panel">
      <div className="chart-container">
        <div className="chart">
          {/* Winnings 柱狀圖（P2-04 實作） */}
          <p>Winnings Chart</p>
        </div>
        <div className="chart">
          {/* Balance History 折線圖（P2-04 實作） */}
          <p>Balance History</p>
        </div>
        <div className="chart">
          {/* Symbol Distribution 圓餅圖（P2-04 實作） */}
          <p>Symbol Distribution</p>
        </div>
      </div>
      <div className="export-actions">
        <button>匯出 CSV</button>
      </div>
    </div>
  );
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 三欄式佈局正確顯示
- [ ] 左側 25% / 中間 50% / 右側 25% 比例正確
- [ ] 底部統計區可收合/展開
- [ ] 響應式佈局在不同螢幕尺寸下正常
- [ ] Tab 切換器可正常切換
- [ ] 頂部快捷鍵顯示正確
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/ide/layout/IDELayout.tsx` 完整程式碼
2. `src/ide/layout/ControlPanel.tsx` 完整程式碼
3. `src/ide/layout/GameControl.tsx` 完整程式碼
4. `src/ide/layout/StatisticsPanel.tsx` 完整程式碼
5. CSS 樣式檔案
6. 螢幕截圖或預覽

