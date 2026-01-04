import type { SimulationResult } from './simulator.js';

/**
 * 匯出選項
 */
export interface ExportOptions {
  filename?: string;           // 預設 'simulation_YYYYMMDD_HHMMSS'
  includeDetail?: boolean;     // 是否包含詳細資料，預設 true
  includeSummary?: boolean;    // 是否包含摘要，預設 true
}

/**
 * 格式化 CSV 值
 * 處理數字格式化和特殊字元轉義
 */
function formatForCSV(value: number | string): string {
  if (typeof value === 'number') {
    // 保留 2 位小數，整數不顯示小數點
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }
  // 處理包含逗號或引號的字串
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 生成檔名（包含時間戳記）
 * 格式：prefix_YYYYMMDD_HHMMSS.csv
 */
function generateFilename(prefix: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
  
  return `${prefix}_${timestamp}.csv`;
}

/**
 * 下載 CSV 檔案
 */
function downloadCSV(content: string, filename: string): void {
  // 加入 BOM 讓 Excel 正確識別 UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(link.href);
}

/**
 * 生成詳細報表 CSV
 */
export function generateDetailCSV(result: SimulationResult): string {
  const headers = ['Spin', 'Outcome', 'OutcomeName', 'Bet', 'Win', 'Profit', 'CumulativeProfit'];
  const rows = result.spins.map(spin => [
    spin.index,
    spin.outcomeId,
    spin.outcomeName,
    spin.bet,
    spin.win,
    spin.profit,
    spin.cumulativeProfit,
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(formatForCSV).join(',')),
  ].join('\n');
}

/**
 * 生成摘要報表 CSV
 */
export function generateSummaryCSV(result: SimulationResult): string {
  const stats = result.statistics;
  const lines: string[] = [];

  // 模擬摘要
  lines.push('=== Simulation Summary ===');
  lines.push('Metric,Value');
  lines.push(`Total Spins,${stats.totalSpins}`);
  lines.push(`Total Bet,${stats.totalBet}`);
  lines.push(`Total Win,${stats.totalWin}`);
  lines.push(`RTP,${formatForCSV(stats.rtp)}%`);
  lines.push(`Hit Rate,${formatForCSV(stats.hitRate)}%`);
  lines.push(`Hit Count,${stats.hitCount}`);
  lines.push(`Avg Win (per hit),${formatForCSV(stats.avgWin)}`);
  lines.push(`Avg Win (per spin),${formatForCSV(stats.avgWinPerSpin)}`);
  lines.push(`Max Win,${stats.maxWin}`);
  lines.push(`Min Win,${stats.minWin}`);
  lines.push(`Max Profit,${stats.maxProfit >= 0 ? '+' : ''}${stats.maxProfit}`);
  lines.push(`Min Profit,${stats.minProfit}`);
  lines.push(`Duration (ms),${Math.round(result.duration)}`);

  // Outcome 分佈
  lines.push('');
  lines.push('=== Outcome Distribution ===');
  lines.push('Outcome,OutcomeName,Count,Percentage,Expected');
  
  for (const dist of stats.outcomeDistribution) {
    lines.push([
      dist.outcomeId,
      dist.outcomeName,
      dist.count,
      `${formatForCSV(dist.percentage)}%`,
      `${formatForCSV(dist.expectedPercentage)}%`,
    ].join(','));
  }

  return lines.join('\n');
}

/**
 * 生成合併報表 CSV（摘要 + 詳細）
 */
export function generateCombinedCSV(result: SimulationResult): string {
  const summary = generateSummaryCSV(result);
  const detail = generateDetailCSV(result);
  
  return [
    summary,
    '',
    '=== Detailed Results ===',
    detail,
  ].join('\n');
}

/**
 * 匯出詳細報表
 */
export function exportDetailCSV(
  result: SimulationResult,
  options?: ExportOptions
): void {
  const content = generateDetailCSV(result);
  const filename = options?.filename || generateFilename('simulation_detail');
  downloadCSV(content, filename);
}

/**
 * 匯出摘要報表
 */
export function exportSummaryCSV(
  result: SimulationResult,
  options?: ExportOptions
): void {
  const content = generateSummaryCSV(result);
  const filename = options?.filename || generateFilename('simulation_summary');
  downloadCSV(content, filename);
}

/**
 * 匯出合併報表（摘要 + 詳細）
 */
export function exportCombinedCSV(
  result: SimulationResult,
  options?: ExportOptions
): void {
  const content = generateCombinedCSV(result);
  const filename = options?.filename || generateFilename('simulation_combined');
  downloadCSV(content, filename);
}

