# P2-04 底部統計區

## 目標 (Objective)

完成底部統計區的完整功能，包括：
- Winnings 柱狀圖
- Balance History 折線圖
- Symbol Distribution 圓餅圖
- CSV 匯出功能
- 可收合/展開

---

## 範圍 (Scope)

需要修改的檔案：
- `src/ide/layout/StatisticsPanel.tsx`
- `src/analytics/charts.tsx`

依賴：
- P2-01（三欄式佈局骨架）

---

## 實作細節 (Implementation Details)

參考現有的 `src/analytics/charts.tsx`，使用 Recharts 實作三個圖表。

### StatisticsPanel.tsx 完整實作

```tsx
import React from 'react';
import { 
  WinningsChart, 
  BalanceHistoryChart, 
  SymbolDistributionChart 
} from '../../analytics/charts';
import { exportToCSV } from '../../analytics/csv-export';
import { useSimulationStore } from '../../store/useSimulationStore';

export function StatisticsPanel() {
  const { results } = useSimulationStore();

  const handleExportCSV = () => {
    exportToCSV(results);
  };

  return (
    <div className="statistics-panel">
      <div className="charts-container">
        <div className="chart-wrapper">
          <h4>Winnings Distribution</h4>
          <WinningsChart data={results} />
        </div>
        <div className="chart-wrapper">
          <h4>Balance History</h4>
          <BalanceHistoryChart data={results} />
        </div>
        <div className="chart-wrapper">
          <h4>Symbol Distribution</h4>
          <SymbolDistributionChart data={results} />
        </div>
      </div>
      <div className="export-actions">
        <button onClick={handleExportCSV}>📥 匯出 CSV</button>
      </div>
    </div>
  );
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 三個圖表正確顯示
- [ ] 可收合/展開功能正常
- [ ] CSV 匯出功能正常
- [ ] 響應式佈局
- [ ] `npm run build` 成功

