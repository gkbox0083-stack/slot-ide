# P2-08 Free Spin Panel + Auto Spin

> **⚠️ 已過時 (DEPRECATED)**
>
> 此任務文件已於 V3 簡化版中標記為過時。
> V3 版本移除了 Free Spin 機制，因此 FreeSpinPanel 不再需要。
> 保留此文件僅供歷史參考。

---

## 目標 (Objective)

實作 Free Spin Panel 和 Auto Spin 功能，包括：
- 當前模式顯示（NG/FG）
- Free Spin 剩餘次數顯示
- 累積獎金顯示
- Multiplier 顯示
- 本輪 Free Spin 歷史
- Auto Spin 啟動/停止功能

---

## 範圍 (Scope)

需要新增的檔案：
- `src/ide/panels/FreeSpinPanel.tsx`

需要修改的檔案：
- `src/ide/layout/GameControl.tsx`（Auto Spin 已在 P2-03 實作）

依賴：
- P1-04（Free Spin 機制）
- P2-03（右側 Game Control）

---

## 實作細節 (Implementation Details)

### FreeSpinPanel.tsx 完整實作

```tsx
import React from 'react';
import { useFreeSpinStore } from '../../store/useFreeSpinStore';

export function FreeSpinPanel() {
  const {
    mode,
    remainingSpins,
    totalSpins,
    accumulatedWin,
    currentMultiplier,
    triggerCount,
    history,
    config,
  } = useFreeSpinStore();

  const isInFreeSpin = mode === 'free';

  return (
    <div className="freespin-panel">
      {/* 當前模式 */}
      <div className="panel-section">
        <h4>當前模式</h4>
        <div className={`mode-display ${isInFreeSpin ? 'free' : 'base'}`}>
          {isInFreeSpin ? '🎁 FREE GAME' : '🎰 BASE GAME'}
        </div>
      </div>

      {/* Free Spin 狀態（僅在 FG 模式顯示） */}
      {isInFreeSpin && (
        <>
          <div className="panel-section">
            <h4>Free Spin 狀態</h4>
            <div className="freespin-status">
              <div className="status-item">
                <span className="label">剩餘次數</span>
                <span className="value">{remainingSpins} / {totalSpins}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${((totalSpins - remainingSpins) / totalSpins) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h4>累積獎金</h4>
            <div className="accumulated-win">
              ${accumulatedWin.toLocaleString()}
            </div>
          </div>

          {config.enableMultiplier && (
            <div className="panel-section">
              <h4>Multiplier</h4>
              <div className="multiplier-display">
                {currentMultiplier}x
              </div>
            </div>
          )}

          {/* 本輪歷史 */}
          <div className="panel-section">
            <h4>本輪 Free Spin 歷史</h4>
            <div className="freespin-history">
              {history.length === 0 ? (
                <p className="no-data">尚無紀錄</p>
              ) : (
                history.slice().reverse().map((result, index) => (
                  <div 
                    key={index} 
                    className={`history-item ${result.isRetrigger ? 'retrigger' : ''}`}
                  >
                    <span className="spin-index">#{result.spinIndex}</span>
                    <span className="win">
                      +${result.win.toFixed(2)}
                      {config.enableMultiplier && (
                        <span className="multiplied">
                          ({currentMultiplier}x = ${result.multipliedWin.toFixed(2)})
                        </span>
                      )}
                    </span>
                    {result.isRetrigger && (
                      <span className="retrigger-badge">Retrigger!</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Base Game 時顯示 Free Spin 設定摘要 */}
      {!isInFreeSpin && (
        <div className="panel-section">
          <h4>Free Spin 設定</h4>
          <div className="config-summary">
            <div className="config-item">
              <span>狀態</span>
              <span>{config.enabled ? '✅ 已啟用' : '❌ 已停用'}</span>
            </div>
            <div className="config-item">
              <span>觸發條件</span>
              <span>Scatter ≥ {config.triggerCount}</span>
            </div>
            <div className="config-item">
              <span>Free Spin 次數</span>
              <span>{config.baseSpinCount} 次</span>
            </div>
            <div className="config-item">
              <span>Retrigger</span>
              <span>{config.enableRetrigger ? '✅' : '❌'}</span>
            </div>
            <div className="config-item">
              <span>Multiplier</span>
              <span>
                {config.enableMultiplier ? `${config.multiplierValue}x` : '❌'}
              </span>
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
.freespin-panel {
  padding: 0.5rem;
}

.mode-display {
  padding: 1rem;
  text-align: center;
  font-size: 1.25rem;
  font-weight: bold;
  border-radius: 8px;
}

.mode-display.base {
  background: #2a2a4e;
  color: #888;
}

.mode-display.free {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.freespin-status .status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  transition: width 0.3s ease;
}

.accumulated-win {
  font-size: 2rem;
  font-weight: bold;
  color: #10b981;
  text-align: center;
}

.multiplier-display {
  font-size: 1.5rem;
  font-weight: bold;
  color: #f59e0b;
  text-align: center;
}

.freespin-history {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid #333;
}

.history-item.retrigger {
  background: rgba(245, 158, 11, 0.1);
}

.retrigger-badge {
  background: #f59e0b;
  color: #000;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.config-summary .config-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #333;
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 當前模式正確顯示（NG/FG）
- [ ] Free Spin 剩餘次數正確顯示
- [ ] 累積獎金正確顯示
- [ ] Multiplier 正確顯示
- [ ] 本輪歷史正確記錄
- [ ] Retrigger 正確標示
- [ ] Base Game 模式顯示設定摘要
- [ ] Auto Spin 功能正常（在 GameControl 中）
- [ ] `npm run build` 成功

