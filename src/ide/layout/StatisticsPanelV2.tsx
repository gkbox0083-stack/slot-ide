import { useRef, useEffect } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore.js';

import type { SimulationStats } from '../../engine/rtp-calculator.js';

/**
 * 底部統計區（V3 簡化版）
 * 包含：Winnings 柱狀圖、Balance History 折線圖、Symbol Distribution 圓餅圖
 */
export function StatisticsPanelV2() {
  const { results, balanceHistory } = useSimulationStore();

  const handleExportCSV = () => {
    if (results.length === 0) return;

    // 計算累計統計（V3 簡化版）
    const total = results.reduce((acc, r) => ({
      totalSpins: acc.totalSpins + r.totalSpins,
      totalBet: acc.totalBet + r.totalBet,
      totalWin: acc.totalWin + r.totalWin,
      lineWin: acc.lineWin + r.lineWin,
      scatterWin: acc.scatterWin + r.scatterWin,
      hitCount: acc.hitCount + r.hitCount,
      maxWin: Math.max(acc.maxWin, r.maxWin),
    }), {
      totalSpins: 0,
      totalBet: 0, totalWin: 0, lineWin: 0, scatterWin: 0,
      hitCount: 0, maxWin: 0,
    });

    // CSV 內容
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Spins', total.totalSpins],
      ['Total Bet', total.totalBet],
      ['Total Win', total.totalWin],
      ['Line Win', total.lineWin],
      ['Scatter Win', total.scatterWin],
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

        {/* Balance History 折線圖 (New) */}
        <div className="flex-1 min-w-[280px] bg-surface-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
            💵 Balance
          </h4>
          <BalanceHistoryChart history={balanceHistory} />
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
 * Winnings 柱狀圖（V3 簡化版）
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

    const dpr = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_WIDTH * dpr;
    canvas.height = LOGICAL_HEIGHT * dpr;
    canvas.style.width = `${LOGICAL_WIDTH}px`;
    canvas.style.height = `${LOGICAL_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    const width = LOGICAL_WIDTH;
    const height = LOGICAL_HEIGHT;

    ctx.clearRect(0, 0, width, height);

    if (results.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('尚無數據', width / 2, height / 2);
      return;
    }

    // V3: 使用 lineWin 和 scatterWin
    const total = results.reduce((acc, r) => ({
      lineWin: acc.lineWin + r.lineWin,
      scatterWin: acc.scatterWin + r.scatterWin,
      totalBet: acc.totalBet + r.totalBet,
    }), { lineWin: 0, scatterWin: 0, totalBet: 0 });

    const data = [
      { label: 'Line Win', value: total.lineWin, color: '#4CAF50' },
      { label: 'Scatter Win', value: total.scatterWin, color: '#9C27B0' },
      { label: 'Total Bet', value: total.totalBet, color: '#2196F3' },
    ];

    const maxValue = Math.max(...data.map(d => d.value), 1);
    const padding = { top: 20, right: 20, bottom: 40, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / data.length - 20;

    data.forEach((d, i) => {
      const x = padding.left + i * (barWidth + 20) + 10;
      const barHeight = (d.value / maxValue) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      ctx.fillStyle = d.color;
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = '#ccc';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barWidth / 2, height - padding.bottom + 15);

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

    const dpr = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_WIDTH * dpr;
    canvas.height = LOGICAL_HEIGHT * dpr;
    canvas.style.width = `${LOGICAL_WIDTH}px`;
    canvas.style.height = `${LOGICAL_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    const width = LOGICAL_WIDTH;
    const height = LOGICAL_HEIGHT;

    ctx.clearRect(0, 0, width, height);

    if (results.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('尚無數據', width / 2, height / 2);
      return;
    }

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

    ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
    ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);

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

    if (rtpData.length > 0) {
      const lastRTP = rtpData[rtpData.length - 1];
      const lastX = width - padding.right;
      const lastY = padding.top + ((maxRTP - lastRTP) / range) * chartHeight;

      ctx.fillStyle = lastRTP >= 100 ? '#4CAF50' : '#f44336';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${lastRTP.toFixed(2)}%`, lastX - 8, lastY - 8);
    }

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
 * Balance History 折線圖
 */
function BalanceHistoryChart({ history }: { history: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const LOGICAL_WIDTH = 260;
  const LOGICAL_HEIGHT = 160;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_WIDTH * dpr;
    canvas.height = LOGICAL_HEIGHT * dpr;
    canvas.style.width = `${LOGICAL_WIDTH}px`;
    canvas.style.height = `${LOGICAL_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    const width = LOGICAL_WIDTH;
    const height = LOGICAL_HEIGHT;

    ctx.clearRect(0, 0, width, height);

    if (history.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('尚無紀錄', width / 2, height / 2);
      return;
    }

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Downsampling if too many points
    let displayData = history;
    const maxPoints = chartWidth; // One point per pixel
    if (history.length > maxPoints) {
      const step = Math.ceil(history.length / maxPoints);
      displayData = history.filter((_, i) => i % step === 0);
    }

    const minBalance = Math.min(...displayData);
    const maxBalance = Math.max(...displayData);
    const range = maxBalance - minBalance || 100;

    // Background
    ctx.fillStyle = 'rgba(76, 175, 80, 0.05)';
    ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);

    // Initial Balance Line (optional, but good for reference)
    const initialBalance = history[0];
    const initialY = padding.top + chartHeight - ((initialBalance - minBalance) / range) * chartHeight;

    if (initialY >= padding.top && initialY <= height - padding.bottom) {
      ctx.strokeStyle = '#444';
      ctx.setLineDash([2, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, initialY);
      ctx.lineTo(width - padding.right, initialY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Line
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();

    displayData.forEach((balance, i) => {
      const x = padding.left + (i / (displayData.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((balance - minBalance) / range) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Last Value Dot
    if (displayData.length > 0) {
      const lastBalance = displayData[displayData.length - 1];
      const lastX = width - padding.right;
      const lastY = padding.top + chartHeight - ((lastBalance - minBalance) / range) * chartHeight;

      ctx.fillStyle = lastBalance >= initialBalance ? '#4CAF50' : '#f44336';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label with current balance
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${lastBalance.toLocaleString()}`, lastX - 8, lastY - 8);
    }

    // Y-Axis Labels (Min/Max)
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`$${Math.round(maxBalance).toLocaleString()}`, padding.left - 4, padding.top + 10);
    ctx.fillText(`$${Math.round(minBalance).toLocaleString()}`, padding.left - 4, height - padding.bottom);

  }, [history]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full h-auto mx-auto block"
    />
  );
}
