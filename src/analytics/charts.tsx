import { useRef, useEffect } from 'react';
import type { SpinResult, SimulationResult } from './simulator.js';

/**
 * 資料抽樣函數（效能優化）
 */
function sampleData(spins: SpinResult[], maxPoints: number): SpinResult[] {
  if (spins.length <= maxPoints) return spins;

  const step = Math.ceil(spins.length / maxPoints);
  const sampled: SpinResult[] = [];

  for (let i = 0; i < spins.length; i += step) {
    sampled.push(spins[i]);
  }

  // 確保最後一個點
  if (sampled[sampled.length - 1] !== spins[spins.length - 1]) {
    sampled.push(spins[spins.length - 1]);
  }

  return sampled;
}

/**
 * 累積盈虧折線圖 Props
 */
export interface ProfitLineChartProps {
  spins: SpinResult[];
  width?: number;
  height?: number;
}

/**
 * 累積盈虧折線圖
 */
export function ProfitLineChart({ spins, width = 400, height = 200 }: ProfitLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || spins.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除畫布
    ctx.clearRect(0, 0, width, height);

    // 計算資料範圍
    const profits = spins.map(s => s.cumulativeProfit);
    const minProfit = Math.min(...profits, 0);
    const maxProfit = Math.max(...profits, 0);
    const range = maxProfit - minProfit || 1;

    // 設定邊距
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 抽樣資料（效能優化）
    const maxPoints = chartWidth;
    const sampledSpins = sampleData(spins, maxPoints);

    // 繪製背景（正負區域）
    if (minProfit < 0 && maxProfit > 0) {
      const zeroY = padding.top + ((maxProfit / range) * chartHeight);
      
      // 正值區域（綠色背景）
      ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
      ctx.fillRect(padding.left, padding.top, chartWidth, zeroY - padding.top);
      
      // 負值區域（紅色背景）
      ctx.fillStyle = 'rgba(244, 67, 54, 0.1)';
      ctx.fillRect(padding.left, zeroY, chartWidth, height - padding.bottom - zeroY);
    } else if (minProfit >= 0) {
      // 全正值（綠色背景）
      ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
      ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);
    } else {
      // 全負值（紅色背景）
      ctx.fillStyle = 'rgba(244, 67, 54, 0.1)';
      ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);
    }

    // 繪製座標軸
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // 繪製零線
    if (minProfit < 0 && maxProfit > 0) {
      const zeroY = padding.top + ((maxProfit / range) * chartHeight);
      ctx.strokeStyle = '#999';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, zeroY);
      ctx.lineTo(width - padding.right, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 繪製折線
    ctx.lineWidth = 1.5;
    
    sampledSpins.forEach((spin, i) => {
      const x = padding.left + (i / (sampledSpins.length - 1 || 1)) * chartWidth;
      const y = padding.top + ((maxProfit - spin.cumulativeProfit) / range) * chartHeight;

      if (i === 0) {
        // 第一個點：根據值設定顏色並開始路徑
        ctx.strokeStyle = spin.cumulativeProfit >= 0 ? '#4CAF50' : '#f44336';
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        const prevSpin = sampledSpins[i - 1];
        const prevX = padding.left + ((i - 1) / (sampledSpins.length - 1 || 1)) * chartWidth;
        const prevProfit = prevSpin.cumulativeProfit;
        const currentProfit = spin.cumulativeProfit;

        // 如果顏色改變，先 stroke 當前線段，再開始新線段
        if ((prevProfit >= 0) !== (currentProfit >= 0)) {
          // 計算零線交點
          const zeroY = padding.top + ((maxProfit / range) * chartHeight);
          const t = -prevProfit / (currentProfit - prevProfit);
          const zeroX = prevX + (x - prevX) * t;
          
          // 完成當前線段到零線
          ctx.lineTo(zeroX, zeroY);
          ctx.stroke();
          
          // 開始新線段（從零線開始）
          ctx.strokeStyle = currentProfit >= 0 ? '#4CAF50' : '#f44336';
          ctx.beginPath();
          ctx.moveTo(zeroX, zeroY);
          ctx.lineTo(x, y);
        } else {
          // 顏色相同，繼續繪製
          ctx.lineTo(x, y);
        }
      }
    });

    // 完成最後一段線
    ctx.stroke();

    // 繪製 Y 軸標籤
    ctx.fillStyle = '#333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // 零線標籤
    if (minProfit < 0 && maxProfit > 0) {
      const zeroY = padding.top + ((maxProfit / range) * chartHeight);
      ctx.fillText('0', padding.left - 8, zeroY);
    }

    // 最大值標籤
    ctx.fillText(Math.round(maxProfit).toString(), padding.left - 8, padding.top + 8);
    
    // 最小值標籤
    ctx.fillText(Math.round(minProfit).toString(), padding.left - 8, height - padding.bottom - 8);

    // 繪製 X 軸標籤
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('0', padding.left, height - padding.bottom + 8);
    
    if (spins.length > 1) {
      const midX = padding.left + chartWidth / 2;
      const midIndex = Math.floor(spins.length / 2);
      ctx.fillText(midIndex.toString(), midX, height - padding.bottom + 8);
      
      const lastX = width - padding.right;
      ctx.fillText(spins.length.toString(), lastX, height - padding.bottom + 8);
    }

    // 繪製標題
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('累積盈虧', padding.left, padding.top - 8);

  }, [spins, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: '1px solid #eee', borderRadius: '4px', display: 'block' }}
    />
  );
}

/**
 * 單次結果離散圖 Props
 */
export interface WinScatterChartProps {
  spins: SpinResult[];
  baseBet: number;
  width?: number;
  height?: number;
}

/**
 * 單次結果離散圖
 */
export function WinScatterChart({ spins, baseBet, width = 400, height = 200 }: WinScatterChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || spins.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除畫布
    ctx.clearRect(0, 0, width, height);

    // 計算資料範圍
    const wins = spins.map(s => s.win);
    const maxWin = Math.max(...wins, 1);
    const minWin = 0;

    // 計算平均獲勝
    const avgWin = wins.reduce((sum, w) => sum + w, 0) / wins.length;
    const highWin = baseBet * 100; // 高分閾值（100x）

    // 設定邊距
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 抽樣資料（效能優化）
    const maxPoints = chartWidth;
    const sampledSpins = sampleData(spins, maxPoints);

    // 繪製座標軸
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // 繪製零線
    ctx.strokeStyle = '#eee';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // 繪製點
    sampledSpins.forEach((spin, i) => {
      const x = padding.left + (i / (sampledSpins.length - 1 || 1)) * chartWidth;
      const y = height - padding.bottom - ((spin.win - minWin) / (maxWin - minWin || 1)) * chartHeight;

      // 根據獲勝金額決定顏色
      let color: string;
      if (spin.win === 0) {
        color = '#999'; // 灰色
      } else if (spin.win >= highWin) {
        color = '#FFD700'; // 金色
      } else if (spin.win >= avgWin) {
        color = '#2ecc71'; // 深綠色
      } else {
        color = '#81c784'; // 淺綠色
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 繪製 Y 軸標籤
    ctx.fillStyle = '#333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('0', padding.left - 8, height - padding.bottom);
    ctx.fillText(Math.round(maxWin).toString(), padding.left - 8, padding.top + 8);

    // 繪製 X 軸標籤
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('0', padding.left, height - padding.bottom + 8);
    
    if (spins.length > 1) {
      const midX = padding.left + chartWidth / 2;
      const midIndex = Math.floor(spins.length / 2);
      ctx.fillText(midIndex.toString(), midX, height - padding.bottom + 8);
      
      const lastX = width - padding.right;
      ctx.fillText(spins.length.toString(), lastX, height - padding.bottom + 8);
    }

    // 繪製標題
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('單次獲勝', padding.left, padding.top - 8);

  }, [spins, baseBet, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: '1px solid #eee', borderRadius: '4px', display: 'block' }}
    />
  );
}

/**
 * 圖表容器元件 Props
 */
export interface SimulationChartsProps {
  result: SimulationResult;
  baseBet: number;
  onClose?: () => void;
}

/**
 * 圖表容器元件
 */
export function SimulationCharts({ result, baseBet, onClose }: SimulationChartsProps) {
  const chartWidth = 600;
  const chartHeight = 250;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: '700px',
      maxHeight: '90vh',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
    }}>
      {/* 標題列 */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px 8px 0 0',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          📊 模擬圖表
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '4px 12px',
              fontSize: '14px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕ 關閉
          </button>
        )}
      </div>

      {/* 內容區 */}
      <div style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* 累積盈虧走勢 */}
        <div>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333',
          }}>
            累積盈虧走勢
          </h4>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: '#fafafa',
            padding: '16px',
            borderRadius: '4px',
          }}>
            <ProfitLineChart
              spins={result.spins}
              width={chartWidth}
              height={chartHeight}
            />
          </div>
        </div>

        {/* 單次結果分佈 */}
        <div>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333',
          }}>
            單次結果分佈
          </h4>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: '#fafafa',
            padding: '16px',
            borderRadius: '4px',
          }}>
            <WinScatterChart
              spins={result.spins}
              baseBet={baseBet}
              width={chartWidth}
              height={chartHeight}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

