import { useRef, useEffect } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore.js';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import type { SimulationStats } from '../../engine/rtp-calculator.js';

/**
 * 底部統計區（V2 三欄式佈局）
 * 包含：Winnings 柱狀圖、Balance History 折線圖、Symbol Distribution 圓餅圖
 */
export function StatisticsPanelV2() {
  const { results } = useSimulationStore();
  const { symbols } = useGameConfigStore();

  const handleExportCSV = () => {
    if (results.length === 0) return;

    // 計算累計統計
    const total = results.reduce((acc, r) => ({
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

    // CSV 內容
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Spins', total.totalSpins],
      ['NG Spins', total.ngSpins],
      ['FG Spins', total.fgSpins],
      ['Total Bet', total.totalBet],
      ['Total Win', total.totalWin],
      ['NG Win', total.ngWin],
      ['FG Win', total.fgWin],
      ['FG Trigger Count', total.fgTriggerCount],
      ['Hit Count', total.hitCount],
      ['Max Win', total.maxWin],
      ['RTP', `${((total.totalWin / total.totalBet) * 100).toFixed(2)}%`],
      ['Hit Rate', `${((total.hitCount / total.totalSpins) * 100).toFixed(2)}%`],
    ].map(row => row.join(',')).join('\n');

    // 下載 CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `slot-simulation-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 bg-surface-900">
      <div className="flex gap-4 overflow-x-auto">
        {/* Winnings 柱狀圖 */}
        <div className="flex-1 min-w-[280px] bg-surface-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
            📊 Winnings 分佈
          </h4>
          <WinningsBarChart results={results} />
        </div>

        {/* Balance History 折線圖 */}
        <div className="flex-1 min-w-[280px] bg-surface-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
            📈 RTP 趨勢
          </h4>
          <RTPLineChart results={results} />
        </div>

        {/* Symbol Distribution 圓餅圖 */}
        <div className="flex-1 min-w-[280px] bg-surface-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
            🎰 符號權重
          </h4>
          <SymbolPieChart symbols={symbols} />
        </div>
      </div>

      {/* 匯出按鈕 */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={handleExportCSV}
          disabled={results.length === 0}
          className="px-4 py-2 bg-surface-700 text-surface-300 text-sm rounded-lg hover:bg-surface-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          📥 匯出 CSV
        </button>
      </div>
    </div>
  );
}

/**
 * Winnings 柱狀圖
 */
function WinningsBarChart({ results }: { results: SimulationStats[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const LOGICAL_WIDTH = 260;
  const LOGICAL_HEIGHT = 160;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 支援 HiDPI 螢幕
    const dpr = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_WIDTH * dpr;
    canvas.height = LOGICAL_HEIGHT * dpr;
    canvas.style.width = `${LOGICAL_WIDTH}px`;
    canvas.style.height = `${LOGICAL_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    const width = LOGICAL_WIDTH;
    const height = LOGICAL_HEIGHT;

    // 清除畫布
    ctx.clearRect(0, 0, width, height);

    if (results.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('尚無數據', width / 2, height / 2);
      return;
    }

    // 計算各類型獲勝分佈
    const total = results.reduce((acc, r) => ({
      ngWin: acc.ngWin + r.ngWin,
      fgWin: acc.fgWin + r.fgWin,
      totalBet: acc.totalBet + r.totalBet,
    }), { ngWin: 0, fgWin: 0, totalBet: 0 });

    const data = [
      { label: 'NG Win', value: total.ngWin, color: '#4CAF50' },
      { label: 'FG Win', value: total.fgWin, color: '#9C27B0' },
      { label: 'Total Bet', value: total.totalBet, color: '#2196F3' },
    ];

    const maxValue = Math.max(...data.map(d => d.value), 1);
    const padding = { top: 20, right: 20, bottom: 40, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / data.length - 20;

    // 繪製柱狀圖
    data.forEach((d, i) => {
      const x = padding.left + i * (barWidth + 20) + 10;
      const barHeight = (d.value / maxValue) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      // 繪製柱子
      ctx.fillStyle = d.color;
      ctx.fillRect(x, y, barWidth, barHeight);

      // 繪製標籤
      ctx.fillStyle = '#ccc';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barWidth / 2, height - padding.bottom + 15);

      // 繪製數值
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText(`$${d.value.toLocaleString()}`, x + barWidth / 2, y - 5);
    });
  }, [results]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full h-auto mx-auto block"
    />
  );
}

/**
 * RTP 趨勢折線圖
 */
function RTPLineChart({ results }: { results: SimulationStats[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const LOGICAL_WIDTH = 260;
  const LOGICAL_HEIGHT = 160;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 支援 HiDPI 螢幕
    const dpr = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_WIDTH * dpr;
    canvas.height = LOGICAL_HEIGHT * dpr;
    canvas.style.width = `${LOGICAL_WIDTH}px`;
    canvas.style.height = `${LOGICAL_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    const width = LOGICAL_WIDTH;
    const height = LOGICAL_HEIGHT;

    // 清除畫布
    ctx.clearRect(0, 0, width, height);

    if (results.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('尚無數據', width / 2, height / 2);
      return;
    }

    // 計算累積 RTP
    let cumulativeBet = 0;
    let cumulativeWin = 0;
    const rtpData = results.map(r => {
      cumulativeBet += r.totalBet;
      cumulativeWin += r.totalWin;
      return cumulativeBet > 0 ? (cumulativeWin / cumulativeBet) * 100 : 0;
    });

    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const minRTP = Math.min(...rtpData, 90);
    const maxRTP = Math.max(...rtpData, 110);
    const range = maxRTP - minRTP || 10;

    // 繪製背景
    ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
    ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);

    // 繪製 100% 參考線
    const hundredY = padding.top + ((maxRTP - 100) / range) * chartHeight;
    if (hundredY >= padding.top && hundredY <= height - padding.bottom) {
      ctx.strokeStyle = '#666';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding.left, hundredY);
      ctx.lineTo(width - padding.right, hundredY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 繪製折線
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();

    rtpData.forEach((rtp, i) => {
      const x = padding.left + (i / (rtpData.length - 1 || 1)) * chartWidth;
      const y = padding.top + ((maxRTP - rtp) / range) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // 繪製終點
    if (rtpData.length > 0) {
      const lastRTP = rtpData[rtpData.length - 1];
      const lastX = width - padding.right;
      const lastY = padding.top + ((maxRTP - lastRTP) / range) * chartHeight;

      ctx.fillStyle = lastRTP >= 100 ? '#4CAF50' : '#f44336';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fill();

      // 顯示當前 RTP
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${lastRTP.toFixed(2)}%`, lastX - 8, lastY - 8);
    }

    // 繪製 Y 軸標籤
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${maxRTP.toFixed(0)}%`, padding.left - 4, padding.top + 10);
    ctx.fillText(`${minRTP.toFixed(0)}%`, padding.left - 4, height - padding.bottom);
  }, [results]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full h-auto mx-auto block"
    />
  );
}

/**
 * Symbol 權重圓餅圖
 */
function SymbolPieChart({ symbols }: { symbols: { id: string; name: string; ngWeight: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const LOGICAL_SIZE = 160;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 支援 HiDPI 螢幕
    const dpr = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_SIZE * dpr;
    canvas.height = LOGICAL_SIZE * dpr;
    canvas.style.width = `${LOGICAL_SIZE}px`;
    canvas.style.height = `${LOGICAL_SIZE}px`;
    ctx.scale(dpr, dpr);

    const width = LOGICAL_SIZE;
    const height = LOGICAL_SIZE;

    // 清除畫布
    ctx.clearRect(0, 0, width, height);

    if (symbols.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('尚無符號', width / 2, height / 2);
      return;
    }

    const totalWeight = symbols.reduce((sum, s) => sum + s.ngWeight, 0);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 30;

    // 顏色調色盤
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#7BC225', '#E8E87E',
    ];

    let startAngle = -Math.PI / 2;

    symbols.forEach((symbol, i) => {
      const sliceAngle = (symbol.ngWeight / totalWeight) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      // 繪製扇形
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      // 繪製標籤（只顯示權重 > 5% 的）
      if (symbol.ngWeight / totalWeight > 0.05) {
        const midAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.65;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol.id, labelX, labelY);
      }

      startAngle = endAngle;
    });

    // 繪製中心圓（甜甜圈效果）
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 中心文字
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${symbols.length}`, centerX, centerY - 6);
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.fillText('符號', centerX, centerY + 8);
  }, [symbols]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full h-auto mx-auto block"
    />
  );
}
