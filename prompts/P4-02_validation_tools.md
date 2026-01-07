# P4-02 數值驗證工具

## 目標 (Objective)

實作數值驗證工具，包括：
- 賠率分佈圖
- 實際 vs 理論對比
- 矛盾警示功能
- 警示等級區分（Error/Warning/Info）

---

## 範圍 (Scope)

需要新增的檔案：
- `src/analytics/validation.ts`
- `src/components/ValidationPanel.tsx`

依賴：
- P1-07（RTP Calculator）
- Phase 2（UI）

---

## 實作細節 (Implementation Details)

### validation.ts

```typescript
// src/analytics/validation.ts

import type { SymbolDefinition } from '../types/symbol';
import type { OutcomeConfig } from '../types/outcome';
import type { FreeSpinConfig } from '../types/free-spin';
import type { BoardConfig } from '../types/board';
import { 
  calculateTheoreticalRTPBreakdown, 
  calculateActualRTPFromStats,
  SimulationStats 
} from '../engine/rtp-calculator';

export type AlertLevel = 'error' | 'warning' | 'info';

export interface ValidationAlert {
  level: AlertLevel;
  code: string;
  message: string;
  details?: string;
}

export interface ValidationResult {
  isValid: boolean;
  alerts: ValidationAlert[];
  theoreticalRTP: number;
  actualRTP?: number;
  rtpDeviation?: number;
}

/**
 * 驗證配置
 */
export function validateConfiguration(
  symbols: SymbolDefinition[],
  outcomeConfig: OutcomeConfig,
  freeSpinConfig: FreeSpinConfig,
  boardConfig: BoardConfig,
  simulationStats?: SimulationStats
): ValidationResult {
  const alerts: ValidationAlert[] = [];
  
  // 1. 檢查 Outcome 權重總和
  const ngTotalWeight = outcomeConfig.ngOutcomes.reduce((sum, o) => sum + o.weight, 0);
  const fgTotalWeight = outcomeConfig.fgOutcomes.reduce((sum, o) => sum + o.weight, 0);
  
  if (ngTotalWeight === 0) {
    alerts.push({
      level: 'error',
      code: 'NG_WEIGHT_ZERO',
      message: 'NG Outcomes 總權重為 0',
      details: '請至少設定一個有權重的 NG Outcome',
    });
  }
  
  if (freeSpinConfig.enabled && fgTotalWeight === 0) {
    alerts.push({
      level: 'error',
      code: 'FG_WEIGHT_ZERO',
      message: 'FG Outcomes 總權重為 0',
      details: 'Free Spin 已啟用，但 FG Outcomes 沒有權重',
    });
  }
  
  // 2. 檢查符號權重
  const hasZeroNgWeight = symbols.some(s => s.ngWeight === 0 && s.type === 'normal');
  const hasZeroFgWeight = symbols.some(s => s.fgWeight === 0 && s.type === 'normal');
  
  if (hasZeroNgWeight) {
    alerts.push({
      level: 'warning',
      code: 'SYMBOL_NG_WEIGHT_ZERO',
      message: '部分一般符號 NG 權重為 0',
      details: '這些符號在 NG Pool 中不會出現',
    });
  }
  
  if (freeSpinConfig.enabled && hasZeroFgWeight) {
    alerts.push({
      level: 'warning',
      code: 'SYMBOL_FG_WEIGHT_ZERO',
      message: '部分一般符號 FG 權重為 0',
      details: '這些符號在 FG Pool 中不會出現',
    });
  }
  
  // 3. 檢查 Scatter 設定
  const scatterSymbol = symbols.find(s => s.type === 'scatter');
  if (freeSpinConfig.enabled && !scatterSymbol) {
    alerts.push({
      level: 'error',
      code: 'SCATTER_MISSING',
      message: 'Free Spin 已啟用但沒有 Scatter 符號',
      details: '請新增一個 Scatter 類型的符號',
    });
  }
  
  // 4. 檢查 Scatter 觸發條件
  if (scatterSymbol && freeSpinConfig.enabled) {
    const totalCells = boardConfig.cols * boardConfig.rows;
    if (freeSpinConfig.triggerCount > totalCells) {
      alerts.push({
        level: 'error',
        code: 'SCATTER_TRIGGER_IMPOSSIBLE',
        message: 'Scatter 觸發條件不可能達成',
        details: `需要 ${freeSpinConfig.triggerCount} 個，但盤面只有 ${totalCells} 格`,
      });
    }
  }
  
  // 5. 計算理論 RTP
  const breakdown = calculateTheoreticalRTPBreakdown(
    symbols,
    outcomeConfig,
    freeSpinConfig,
    boardConfig
  );
  
  // 6. RTP 範圍檢查
  if (breakdown.totalRTP < 80) {
    alerts.push({
      level: 'warning',
      code: 'RTP_TOO_LOW',
      message: `理論 RTP 過低 (${breakdown.totalRTP.toFixed(2)}%)`,
      details: '大多數遊戲 RTP 在 90-98% 之間',
    });
  }
  
  if (breakdown.totalRTP > 100) {
    alerts.push({
      level: 'error',
      code: 'RTP_OVER_100',
      message: `理論 RTP 超過 100% (${breakdown.totalRTP.toFixed(2)}%)`,
      details: '這將導致遊戲虧損',
    });
  }
  
  // 7. 實際 vs 理論對比（如有模擬結果）
  let actualRTP: number | undefined;
  let rtpDeviation: number | undefined;
  
  if (simulationStats) {
    const actualBreakdown = calculateActualRTPFromStats(simulationStats);
    actualRTP = actualBreakdown.totalRTP;
    rtpDeviation = Math.abs(actualRTP - breakdown.totalRTP);
    
    if (rtpDeviation > 5 && simulationStats.totalSpins >= 1000) {
      alerts.push({
        level: 'warning',
        code: 'RTP_DEVIATION',
        message: `實際 RTP 偏離理論值 ${rtpDeviation.toFixed(2)}%`,
        details: `理論: ${breakdown.totalRTP.toFixed(2)}%, 實際: ${actualRTP.toFixed(2)}%`,
      });
    }
    
    if (rtpDeviation > 10 && simulationStats.totalSpins >= 10000) {
      alerts.push({
        level: 'error',
        code: 'RTP_DEVIATION_SEVERE',
        message: `實際 RTP 嚴重偏離理論值 ${rtpDeviation.toFixed(2)}%`,
        details: '這可能表示配置有問題，請檢查 Pool 是否正確生成',
      });
    }
  }
  
  return {
    isValid: !alerts.some(a => a.level === 'error'),
    alerts,
    theoreticalRTP: breakdown.totalRTP,
    actualRTP,
    rtpDeviation,
  };
}
```

### ValidationPanel.tsx

```tsx
// src/components/ValidationPanel.tsx

import React from 'react';
import { useGameConfigStore } from '../store/useGameConfigStore';
import { useSimulationStore } from '../store/useSimulationStore';
import { validateConfiguration } from '../analytics/validation';

export function ValidationPanel() {
  const { symbols, outcomeConfig, freeSpinConfig, boardConfig } = useGameConfigStore();
  const { results } = useSimulationStore();
  
  const stats = results.length > 0 ? results[0] : undefined;
  const validation = validateConfiguration(
    symbols,
    outcomeConfig,
    freeSpinConfig,
    boardConfig,
    stats
  );

  const errorCount = validation.alerts.filter(a => a.level === 'error').length;
  const warningCount = validation.alerts.filter(a => a.level === 'warning').length;
  const infoCount = validation.alerts.filter(a => a.level === 'info').length;

  return (
    <div className="validation-panel">
      {/* 狀態摘要 */}
      <div className={`validation-status ${validation.isValid ? 'valid' : 'invalid'}`}>
        <span className="status-icon">
          {validation.isValid ? '✅' : '❌'}
        </span>
        <span className="status-text">
          {validation.isValid ? '配置有效' : '配置有問題'}
        </span>
      </div>

      {/* RTP 摘要 */}
      <div className="rtp-summary">
        <div className="rtp-item">
          <span className="label">理論 RTP</span>
          <span className="value">{validation.theoreticalRTP.toFixed(2)}%</span>
        </div>
        {validation.actualRTP !== undefined && (
          <>
            <div className="rtp-item">
              <span className="label">實際 RTP</span>
              <span className="value">{validation.actualRTP.toFixed(2)}%</span>
            </div>
            <div className="rtp-item">
              <span className="label">偏差</span>
              <span className={`value ${validation.rtpDeviation! > 5 ? 'warning' : ''}`}>
                ±{validation.rtpDeviation?.toFixed(2)}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* 警示計數 */}
      <div className="alert-counts">
        {errorCount > 0 && (
          <span className="count error">{errorCount} 錯誤</span>
        )}
        {warningCount > 0 && (
          <span className="count warning">{warningCount} 警告</span>
        )}
        {infoCount > 0 && (
          <span className="count info">{infoCount} 提示</span>
        )}
      </div>

      {/* 警示列表 */}
      <div className="alert-list">
        {validation.alerts.map((alert, index) => (
          <div key={index} className={`alert-item ${alert.level}`}>
            <div className="alert-header">
              <span className="alert-icon">
                {alert.level === 'error' ? '❌' : 
                 alert.level === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <span className="alert-code">{alert.code}</span>
            </div>
            <div className="alert-message">{alert.message}</div>
            {alert.details && (
              <div className="alert-details">{alert.details}</div>
            )}
          </div>
        ))}
        
        {validation.alerts.length === 0 && (
          <div className="no-alerts">
            👍 沒有發現問題
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 驗證功能正確檢測配置問題
- [ ] 警示等級正確區分
- [ ] 實際 vs 理論 RTP 對比正確
- [ ] 偏差警示正確觸發
- [ ] UI 正確顯示驗證結果
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/analytics/validation.ts` 完整程式碼
2. `src/components/ValidationPanel.tsx` 完整程式碼
3. 驗證功能測試截圖

