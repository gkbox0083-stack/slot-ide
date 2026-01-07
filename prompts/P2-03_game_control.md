# P2-03 右側 Game Control 架構

## 目標 (Objective)

完成右側 Game Control 的完整架構，包括：
- 頂部快捷鍵（SPIN、SIM、AUTO SPIN）
- Betting Tab
- Simulation Tab
- History Tab
- Free Spin Tab（骨架）

---

## 範圍 (Scope)

需要修改的檔案：
- `src/ide/layout/GameControl.tsx`

需要新增的檔案：
- `src/ide/panels/BettingPanel.tsx`
- `src/ide/panels/SimulationPanel.tsx`
- `src/ide/panels/HistoryPanel.tsx`

依賴：
- P2-01（三欄式佈局骨架）
- Phase 1（核心機制）

---

## 實作細節 (Implementation Details)

### GameControl.tsx 完整實作

```tsx
import React, { useState, useRef, useCallback } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore';
import { useFreeSpinStore } from '../../store/useFreeSpinStore';
import { BettingPanel } from '../panels/BettingPanel';
import { SimulationPanel } from '../panels/SimulationPanel';
import { HistoryPanel } from '../panels/HistoryPanel';
import { FreeSpinPanel } from '../panels/FreeSpinPanel';
import { executeSpin } from '../../engine/spin-executor';

type GameControlTab = 'betting' | 'simulation' | 'history' | 'freespin';

export function GameControl() {
  const [activeTab, setActiveTab] = useState<GameControlTab>('betting');
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const autoSpinRef = useRef(false);

  const {
    symbols,
    outcomeConfig,
    linesConfig,
    visualConfig,
    baseBet,
    freeSpinConfig,
    pools,
    setCurrentSpinPacket,
  } = useGameConfigStore();

  const freeSpinState = useFreeSpinStore();

  // 單次 Spin
  const handleSpin = useCallback(async () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    try {
      const result = executeSpin(
        {
          symbols,
          outcomeConfig,
          linesConfig,
          visualConfig,
          baseBet,
          freeSpinConfig,
        },
        pools,
        {
          mode: freeSpinState.mode,
          remainingSpins: freeSpinState.remainingSpins,
          totalSpins: freeSpinState.totalSpins,
          accumulatedWin: freeSpinState.accumulatedWin,
          currentMultiplier: freeSpinState.currentMultiplier,
          triggerCount: freeSpinState.triggerCount,
        }
      );
      
      setCurrentSpinPacket(result.packet);
      
      // 處理 Free Spin 觸發
      if (result.triggeredFreeSpin) {
        freeSpinState.triggerFreeSpin(
          result.packet.meta?.scatterCount || 0,
          freeSpinConfig
        );
      }
      
      // 處理 Retrigger
      if (result.isRetrigger) {
        freeSpinState.retrigger(freeSpinConfig.retriggerSpinCount);
      }
      
      // Free Spin 模式下扣減次數
      if (freeSpinState.mode === 'free') {
        freeSpinState.consumeSpin();
        freeSpinState.addWin(result.packet.meta?.win || 0);
        
        // 檢查是否結束
        if (freeSpinState.remainingSpins <= 1) {
          freeSpinState.endFreeSpin();
        }
      }
      
      // 等待動畫完成
      await new Promise(resolve => setTimeout(resolve, visualConfig.animation.spinDuration + 500));
      
    } catch (error) {
      console.error('Spin error:', error);
    } finally {
      setIsSpinning(false);
    }
  }, [symbols, outcomeConfig, linesConfig, visualConfig, baseBet, freeSpinConfig, pools, freeSpinState, isSpinning]);

  // Auto Spin
  const handleAutoSpin = useCallback(async () => {
    if (isAutoSpinning) {
      // 停止 Auto Spin
      autoSpinRef.current = false;
      setIsAutoSpinning(false);
    } else {
      // 開始 Auto Spin
      autoSpinRef.current = true;
      setIsAutoSpinning(true);
      
      while (autoSpinRef.current) {
        await handleSpin();
        
        // 短暫延遲
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 檢查是否需要停止
        if (!autoSpinRef.current) break;
      }
    }
  }, [isAutoSpinning, handleSpin]);

  // Simulation（委託給 SimulationPanel）
  const handleSimulation = () => {
    setActiveTab('simulation');
  };

  return (
    <div className="game-control">
      {/* 頂部快捷鍵 */}
      <div className="quick-actions">
        <button 
          className={`action-btn spin ${isSpinning ? 'spinning' : ''}`}
          onClick={handleSpin}
          disabled={isSpinning || isAutoSpinning}
        >
          🎰 SPIN
        </button>
        <button 
          className="action-btn sim"
          onClick={handleSimulation}
        >
          📊 SIM
        </button>
        <button 
          className={`action-btn auto ${isAutoSpinning ? 'active' : ''}`}
          onClick={handleAutoSpin}
          disabled={isSpinning && !isAutoSpinning}
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
        {activeTab === 'betting' && <BettingPanel />}
        {activeTab === 'simulation' && <SimulationPanel />}
        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'freespin' && <FreeSpinPanel />}
      </div>
    </div>
  );
}
```

### BettingPanel.tsx

```tsx
import React from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore';

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];

export function BettingPanel() {
  const { baseBet, setBaseBet } = useGameConfigStore();
  const [balance, setBalance] = React.useState(10000);
  const [recentWins, setRecentWins] = React.useState<Array<{ spin: number; amount: number }>>([]);

  return (
    <div className="betting-panel">
      {/* Bet Amount */}
      <div className="panel-section">
        <h4>Bet Amount</h4>
        <div className="bet-buttons">
          {BET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              className={`bet-btn ${baseBet === amount ? 'selected' : ''}`}
              onClick={() => setBaseBet(amount)}
            >
              ${amount}
            </button>
          ))}
        </div>
        <div className="current-bet">
          當前: <strong>${baseBet}</strong>
        </div>
      </div>

      {/* Balance */}
      <div className="panel-section">
        <h4>Balance</h4>
        <div className="balance-display">
          ${balance.toLocaleString()}
        </div>
      </div>

      {/* Recent Win */}
      <div className="panel-section">
        <h4>Recent Win</h4>
        <div className="recent-wins">
          {recentWins.length === 0 ? (
            <p className="no-data">尚無紀錄</p>
          ) : (
            recentWins.slice(0, 5).map((win, index) => (
              <div key={index} className={`win-item ${win.amount > 0 ? 'positive' : 'negative'}`}>
                <span>Spin #{win.spin}</span>
                <span>{win.amount > 0 ? '+' : ''}{win.amount}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

### SimulationPanel.tsx

```tsx
import React, { useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';

const SPIN_COUNTS = [100, 500, 1000, 5000];

export function SimulationPanel() {
  const [spinCount, setSpinCount] = useState(1000);
  const [customCount, setCustomCount] = useState('');
  
  const {
    isRunning,
    progress,
    mode,
    results,
    setMode,
    startSimulation,
    clearResults,
  } = useSimulationStore();

  const handleStartSimulation = () => {
    const count = customCount ? parseInt(customCount) : spinCount;
    startSimulation(count);
  };

  const totalSpins = results.reduce((sum, r) => sum + r.totalSpins, 0);

  return (
    <div className="simulation-panel">
      {/* 模擬次數 */}
      <div className="panel-section">
        <h4>模擬次數</h4>
        <div className="spin-count-buttons">
          {SPIN_COUNTS.map((count) => (
            <button
              key={count}
              className={`count-btn ${spinCount === count ? 'selected' : ''}`}
              onClick={() => {
                setSpinCount(count);
                setCustomCount('');
              }}
            >
              {count}
            </button>
          ))}
          <input
            type="number"
            placeholder="自訂"
            value={customCount}
            onChange={(e) => setCustomCount(e.target.value)}
            className="custom-input"
          />
        </div>
        <div className="current-count">
          當前: {customCount || spinCount} 次
        </div>
      </div>

      {/* 模擬模式 */}
      <div className="panel-section">
        <h4>模擬模式</h4>
        <div className="mode-selector">
          <label className={mode === 'stack' ? 'selected' : ''}>
            <input
              type="radio"
              checked={mode === 'stack'}
              onChange={() => setMode('stack')}
            />
            堆疊模式
          </label>
          <label className={mode === 'compare' ? 'selected' : ''}>
            <input
              type="radio"
              checked={mode === 'compare'}
              onChange={() => setMode('compare')}
            />
            比較模式
          </label>
        </div>
        <p className="mode-hint">
          💡 {mode === 'stack' 
            ? '堆疊模式: 新結果累加至現有數據' 
            : '比較模式: 保留前次結果並排比較'}
        </p>
      </div>

      {/* 進度 */}
      {isRunning && (
        <div className="panel-section">
          <h4>進度</h4>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">
            {Math.round(progress)}%
          </div>
        </div>
      )}

      {/* 累計統計 */}
      <div className="panel-section">
        <h4>累計統計</h4>
        <div className="cumulative-stats">
          <div>總模擬次數: {totalSpins.toLocaleString()} 次</div>
        </div>
        <button 
          className="clear-btn"
          onClick={clearResults}
          disabled={isRunning}
        >
          清除累計
        </button>
      </div>

      {/* 開始按鈕 */}
      <button
        className="start-simulation-btn"
        onClick={handleStartSimulation}
        disabled={isRunning}
      >
        {isRunning ? '模擬中...' : '開始模擬'}
      </button>
    </div>
  );
}
```

### HistoryPanel.tsx

```tsx
import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { calculateActualRTPFromStats, calculateAdditionalStats } from '../../engine/rtp-calculator';

export function HistoryPanel() {
  const { results } = useSimulationStore();
  
  // 計算累計統計
  const cumulativeStats = results.reduce((acc, r) => ({
    totalSpins: acc.totalSpins + r.totalSpins,
    ngSpins: acc.ngSpins + r.ngSpins,
    fgSpins: acc.fgSpins + r.fgSpins,
    totalBet: acc.totalBet + r.totalBet,
    totalWin: acc.totalWin + r.totalWin,
    ngWin: acc.ngWin + r.ngWin,
    fgWin: acc.fgWin + r.fgWin,
    fgTriggerCount: acc.fgTriggerCount + r.fgTriggerCount,
    hitCount: acc.hitCount + r.hitCount,
    maxWin: Math.max(acc.maxWin, r.maxWin),
  }), {
    totalSpins: 0, ngSpins: 0, fgSpins: 0,
    totalBet: 0, totalWin: 0, ngWin: 0, fgWin: 0,
    fgTriggerCount: 0, hitCount: 0, maxWin: 0,
  });

  const rtpBreakdown = calculateActualRTPFromStats(cumulativeStats);
  const additionalStats = calculateAdditionalStats(cumulativeStats);

  return (
    <div className="history-panel">
      {/* 關鍵指標 */}
      <div className="panel-section">
        <h4>關鍵指標（即時更新）</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">RTP</span>
            <span className="stat-value">{rtpBreakdown.totalRTP.toFixed(2)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Hit Rate</span>
            <span className="stat-value">{additionalStats.hitRate.toFixed(1)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Win</span>
            <span className="stat-value">{additionalStats.avgWin.toFixed(2)}x</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Max Win</span>
            <span className="stat-value">{cumulativeStats.maxWin.toFixed(2)}x</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Spins</span>
            <span className="stat-value">{cumulativeStats.totalSpins.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Bet</span>
            <span className="stat-value">${cumulativeStats.totalBet.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Win</span>
            <span className="stat-value">${cumulativeStats.totalWin.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Net</span>
            <span className={`stat-value ${cumulativeStats.totalWin - cumulativeStats.totalBet >= 0 ? 'positive' : 'negative'}`}>
              ${(cumulativeStats.totalWin - cumulativeStats.totalBet).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* RTP 分解 */}
      <div className="panel-section">
        <h4>RTP 分解</h4>
        <div className="rtp-breakdown">
          <div className="rtp-item">
            <span>NG RTP</span>
            <span>{rtpBreakdown.ngRTP.toFixed(2)}%</span>
          </div>
          <div className="rtp-item">
            <span>FG RTP</span>
            <span>{rtpBreakdown.fgRTPContribution.toFixed(2)}%</span>
          </div>
          <div className="rtp-item">
            <span>FG 觸發機率</span>
            <span>{rtpBreakdown.fgTriggerProbability.toFixed(2)}%</span>
          </div>
          <hr />
          <div className="rtp-item total">
            <span>總 RTP</span>
            <span>{rtpBreakdown.totalRTP.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 頂部快捷鍵顯示正確
- [ ] SPIN 按鈕可執行單次 Spin
- [ ] AUTO SPIN 可啟動/停止持續 Spin
- [ ] SIM 按鈕切換到 Simulation Tab
- [ ] Betting Tab 可設定 Bet Amount
- [ ] Simulation Tab 可選擇模擬次數和模式
- [ ] History Tab 顯示 RTP 分解和統計
- [ ] Tab 切換正常
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/ide/layout/GameControl.tsx` 完整程式碼
2. `src/ide/panels/BettingPanel.tsx` 完整程式碼
3. `src/ide/panels/SimulationPanel.tsx` 完整程式碼
4. `src/ide/panels/HistoryPanel.tsx` 完整程式碼
5. CSS 樣式
6. 螢幕截圖

