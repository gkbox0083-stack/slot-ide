import { useState, useCallback } from 'react';
import { useGameConfigStore, defaultLinesConfig } from '../../store/useGameConfigStore.js';
import type { LinePattern } from '../../types/lines.js';

const MAX_LINES = 50;

/**
 * LinesPanel Pay Lines 視覺化編輯器（V2）
 * 支援點擊格子設定線路、最多 50 條線
 */
export function LinesPanel() {
  const { boardConfig, linesConfig, setLinesConfig } = useGameConfigStore();
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPositions, setEditingPositions] = useState<[number, number][]>([]);

  const { cols, rows } = boardConfig;

  // Reset function
  const handleReset = () => {
    if (confirm('確定要重置所有 Pay Lines 設定嗎？此動作無法復原。')) {
      // Deep copy
      const resetConfig = JSON.parse(JSON.stringify(defaultLinesConfig));
      setLinesConfig(resetConfig);
      setSelectedLineIndex(null);
      setIsEditing(false);
      setEditingPositions([]);
    }
  };

  // 開始編輯線路
  const startEditLine = (index: number | null) => {
    if (index === null) {
      // 新增線路
      setEditingPositions([]);
    } else {
      // 編輯現有線路
      const pattern = linesConfig.patterns[index];
      if (pattern) {
        setEditingPositions([...pattern.positions] as [number, number][]);
      }
    }
    setSelectedLineIndex(index);
    setIsEditing(true);
  };

  // 點擊格子
  const handleCellClick = useCallback((col: number, row: number) => {
    if (!isEditing) return;

    // 檢查該列是否已有位置
    const existingIndex = editingPositions.findIndex(([c]) => c === col);

    if (existingIndex !== -1) {
      // 更新現有位置
      const newPositions = [...editingPositions];
      newPositions[existingIndex] = [col, row];
      setEditingPositions(newPositions);
    } else {
      // 新增位置（按列排序）
      const newPositions = [...editingPositions, [col, row] as [number, number]];
      newPositions.sort((a, b) => a[0] - b[0]);
      setEditingPositions(newPositions);
    }
  }, [isEditing, editingPositions]);

  // 儲存線路
  const saveLine = () => {
    if (editingPositions.length !== cols) {
      alert(`線路必須經過所有 ${cols} 列`);
      return;
    }

    const newPattern: LinePattern = {
      id: selectedLineIndex !== null
        ? linesConfig.patterns[selectedLineIndex].id
        : linesConfig.patterns.length + 1,
      positions: editingPositions,
    };

    const newPatterns = [...linesConfig.patterns];
    if (selectedLineIndex !== null) {
      newPatterns[selectedLineIndex] = newPattern;
    } else {
      if (newPatterns.length >= MAX_LINES) {
        alert(`最多只能設定 ${MAX_LINES} 條線`);
        return;
      }
      newPatterns.push(newPattern);
    }

    setLinesConfig({
      count: newPatterns.length,
      patterns: newPatterns,
    });

    setIsEditing(false);
    setSelectedLineIndex(null);
    setEditingPositions([]);
  };

  // 刪除線路
  const deleteLine = (index: number) => {
    if (linesConfig.patterns.length <= 1) {
      alert('至少需要保留 1 條線');
      return;
    }

    const newPatterns = linesConfig.patterns.filter((_, i) => i !== index);
    // 重新編號
    newPatterns.forEach((p, i) => { p.id = i + 1; });

    setLinesConfig({
      count: newPatterns.length,
      patterns: newPatterns,
    });
  };

  // 取消編輯
  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedLineIndex(null);
    setEditingPositions([]);
  };

  // 清除編輯中的位置
  const clearEditingPositions = () => {
    setEditingPositions([]);
  };

  // 預覽選中的線路
  const previewLine = selectedLineIndex !== null && !isEditing
    ? linesConfig.patterns[selectedLineIndex]?.positions
    : null;

  return (
    <div className="space-y-4">
      {/* Header with Reset */}
      <div className="flex justify-between items-center px-1">
        <div className="p-3 bg-surface-900/50 rounded-lg flex items-center gap-4">
          <span className="text-sm text-surface-400">
            線數: <span className="text-surface-200 font-semibold">{linesConfig.count}</span> / {MAX_LINES}
          </span>
          <span className="text-xs text-surface-500 border-l border-surface-700 pl-4">
            盤面: {cols}×{rows}
          </span>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-surface-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>↺</span> 全部重置
        </button>
      </div>

      {/* 視覺化編輯器 */}
      <div className="relative bg-surface-900 rounded-lg p-3">
        <h5 className="text-xs font-semibold text-surface-400 mb-2">
          {isEditing ? '🖊️ 編輯中 - 點擊格子設定線路' : '📐 盤面預覽'}
        </h5>

        <div
          className="grid gap-1 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            maxWidth: '280px',
          }}
        >
          {Array.from({ length: rows }, (_, row) =>
            Array.from({ length: cols }, (_, col) => {
              const isInEditingLine = editingPositions.some(
                ([c, r]) => c === col && r === row
              );
              const isInPreviewLine = previewLine?.some(
                ([c, r]) => c === col && r === row
              );
              const editingOrder = editingPositions.findIndex(([c]) => c === col);

              return (
                <div
                  key={`${col}-${row}`}
                  onClick={() => handleCellClick(col, row)}
                  className={`
                    aspect-square rounded flex flex-col items-center justify-center text-xs
                    transition-all duration-150
                    ${isEditing ? 'cursor-pointer hover:bg-surface-600' : 'cursor-default'}
                    ${isInEditingLine
                      ? 'bg-primary-600 text-white'
                      : isInPreviewLine
                        ? 'bg-green-700 text-white'
                        : 'bg-surface-800 text-surface-500'
                    }
                  `}
                >
                  <span className="text-[10px] opacity-60">{col},{row}</span>
                  {isInEditingLine && (
                    <span className="font-bold text-sm">{editingOrder + 1}</span>
                  )}
                </div>
              );
            })
          ).flat()}
        </div>

        {/* 線路連線預覽 SVG */}
        {(isEditing && editingPositions.length > 1) && (
          <svg
            className="absolute inset-3 pointer-events-none"
            viewBox={`0 0 ${cols * 50} ${rows * 50}`}
            preserveAspectRatio="none"
          >
            <polyline
              points={editingPositions.map(([col, row]) =>
                `${col * 50 + 25},${row * 50 + 25}`
              ).join(' ')}
              fill="none"
              stroke="#6366f1"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* 編輯操作 */}
      {isEditing ? (
        <div className="p-3 bg-primary-900/30 border border-primary-700/50 rounded-lg space-y-3">
          <div className="text-sm text-surface-300">
            已設定: <span className={`font-bold ${editingPositions.length === cols ? 'text-green-400' : 'text-yellow-400'
              }`}>
              {editingPositions.length} / {cols}
            </span> 列
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveLine}
              disabled={editingPositions.length !== cols}
              className="flex-1 py-2 bg-primary-600 text-white rounded text-sm font-semibold hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              儲存
            </button>
            <button
              onClick={clearEditingPositions}
              className="py-2 px-3 bg-surface-700 text-surface-300 rounded text-sm hover:bg-surface-600"
            >
              清除
            </button>
            <button
              onClick={cancelEdit}
              className="py-2 px-3 bg-surface-700 text-surface-300 rounded text-sm hover:bg-surface-600"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => startEditLine(null)}
          disabled={linesConfig.patterns.length >= MAX_LINES}
          className="w-full py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + 新增線路
        </button>
      )}

      {/* 線路列表 */}
      <div className="bg-surface-900/50 rounded-lg p-3">
        <h5 className="text-xs font-semibold text-surface-400 mb-2">線路列表</h5>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {linesConfig.patterns.map((pattern, index) => (
            <div
              key={pattern.id}
              onClick={() => !isEditing && setSelectedLineIndex(selectedLineIndex === index ? null : index)}
              className={`
                p-2 rounded flex items-center justify-between text-xs cursor-pointer
                transition-colors
                ${selectedLineIndex === index
                  ? 'bg-primary-900/30 border border-primary-700/50'
                  : 'bg-surface-800 hover:bg-surface-700'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-surface-400">#{pattern.id}</span>
                <span className="text-surface-300 truncate max-w-[120px]">
                  {pattern.positions.map(([c, r]) => `[${c},${r}]`).join('→')}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); startEditLine(index); }}
                  disabled={isEditing}
                  className="px-2 py-1 bg-surface-600 text-surface-300 rounded hover:bg-surface-500 disabled:opacity-50"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteLine(index); }}
                  disabled={isEditing || linesConfig.patterns.length <= 1}
                  className="px-2 py-1 bg-red-900/50 text-red-300 rounded hover:bg-red-800 disabled:opacity-50"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 快速預設 */}
      <div className="bg-surface-900/50 rounded-lg p-3">
        <h5 className="text-xs font-semibold text-surface-400 mb-2">快速設定</h5>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => applyPreset(5, setLinesConfig, rows)}
            disabled={isEditing}
            className="py-2 bg-surface-700 text-surface-300 text-xs rounded hover:bg-surface-600 disabled:opacity-50"
          >
            5 線
          </button>
          <button
            onClick={() => applyPreset(10, setLinesConfig, rows)}
            disabled={isEditing}
            className="py-2 bg-surface-700 text-surface-300 text-xs rounded hover:bg-surface-600 disabled:opacity-50"
          >
            10 線
          </button>
          <button
            onClick={() => applyPreset(20, setLinesConfig, rows)}
            disabled={isEditing}
            className="py-2 bg-surface-700 text-surface-300 text-xs rounded hover:bg-surface-600 disabled:opacity-50"
          >
            20 線
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 套用預設線路配置
 */
function applyPreset(
  count: number,
  setLinesConfig: (config: { count: number; patterns: LinePattern[] }) => void,
  rows: number
) {
  const patterns: LinePattern[] = [];

  // 基本 5 條線（適用於 3 行和 4 行）
  if (count >= 5) {
    // 中間橫線
    patterns.push({
      id: 1, positions: rows === 3
        ? [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]]
        : [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]]
    });
    // 上面橫線
    patterns.push({ id: 2, positions: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] });
    // 下面橫線
    patterns.push({
      id: 3, positions: rows === 3
        ? [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]]
        : [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]]
    });
    // V 形
    patterns.push({
      id: 4, positions: rows === 3
        ? [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]]
        : [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]]
    });
    // 倒 V 形
    patterns.push({
      id: 5, positions: rows === 3
        ? [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]]
        : [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]]
    });
  }

  // 10 條線（加入更多變化）
  if (count >= 10) {
    patterns.push({ id: 6, positions: [[0, 0], [1, 0], [2, 1], [3, 2], [4, 2]] });
    patterns.push({
      id: 7, positions: rows === 3
        ? [[0, 2], [1, 2], [2, 1], [3, 0], [4, 0]]
        : [[0, 2], [1, 2], [2, 1], [3, 0], [4, 0]]
    });
    patterns.push({ id: 8, positions: [[0, 1], [1, 0], [2, 0], [3, 0], [4, 1]] });
    patterns.push({
      id: 9, positions: rows === 3
        ? [[0, 1], [1, 2], [2, 2], [3, 2], [4, 1]]
        : [[0, 1], [1, 2], [2, 2], [3, 2], [4, 1]]
    });
    patterns.push({ id: 10, positions: [[0, 0], [1, 1], [2, 1], [3, 1], [4, 0]] });
  }

  // 20 條線
  if (count >= 20) {
    patterns.push({
      id: 11, positions: rows === 3
        ? [[0, 2], [1, 1], [2, 1], [3, 1], [4, 2]]
        : [[0, 2], [1, 1], [2, 1], [3, 1], [4, 2]]
    });
    patterns.push({
      id: 12, positions: rows === 3
        ? [[0, 1], [1, 0], [2, 1], [3, 2], [4, 1]]
        : [[0, 1], [1, 0], [2, 1], [3, 2], [4, 1]]
    });
    patterns.push({
      id: 13, positions: rows === 3
        ? [[0, 1], [1, 2], [2, 1], [3, 0], [4, 1]]
        : [[0, 1], [1, 2], [2, 1], [3, 0], [4, 1]]
    });
    patterns.push({ id: 14, positions: [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0]] });
    patterns.push({
      id: 15, positions: rows === 3
        ? [[0, 2], [1, 1], [2, 2], [3, 1], [4, 2]]
        : [[0, 2], [1, 1], [2, 2], [3, 1], [4, 2]]
    });
    patterns.push({ id: 16, positions: [[0, 1], [1, 1], [2, 0], [3, 1], [4, 1]] });
    patterns.push({
      id: 17, positions: rows === 3
        ? [[0, 1], [1, 1], [2, 2], [3, 1], [4, 1]]
        : [[0, 1], [1, 1], [2, 2], [3, 1], [4, 1]]
    });
    patterns.push({ id: 18, positions: [[0, 0], [1, 0], [2, 1], [3, 0], [4, 0]] });
    patterns.push({
      id: 19, positions: rows === 3
        ? [[0, 2], [1, 2], [2, 1], [3, 2], [4, 2]]
        : [[0, 2], [1, 2], [2, 1], [3, 2], [4, 2]]
    });
    patterns.push({
      id: 20, positions: rows === 3
        ? [[0, 0], [1, 2], [2, 0], [3, 2], [4, 0]]
        : [[0, 0], [1, 2], [2, 0], [3, 2], [4, 0]]
    });
  }

  setLinesConfig({
    count: patterns.length,
    patterns,
  });
}
