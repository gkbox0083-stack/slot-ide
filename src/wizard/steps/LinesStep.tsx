import { useState } from 'react';
import { useGameConfigStore } from '../../store/index.js';
import type { LinePattern } from '../../types/lines.js';

/**
 * Step 4: 線型設定
 */
export function LinesStep() {
  const { linesConfig } = useGameConfigStore();
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());

  const toggleExpand = (lineId: number) => {
    const newExpanded = new Set(expandedLines);
    if (newExpanded.has(lineId)) {
      newExpanded.delete(lineId);
    } else {
      newExpanded.add(lineId);
    }
    setExpandedLines(newExpanded);
  };

  // 渲染單條線的視覺化
  const renderLineVisualization = (pattern: LinePattern) => {
    // 建立 5x3 的盤面
    const board: boolean[][] = Array(3)
      .fill(null)
      .map(() => Array(5).fill(false));

    // 標記線條經過的位置
    pattern.positions.forEach(([col, row]) => {
      if (row >= 0 && row < 3 && col >= 0 && col < 5) {
        board[row][col] = true;
      }
    });

    return (
      <div className="space-y-1">
        {/* 列標題 */}
        <div className="flex gap-1 pl-12">
          {[0, 1, 2, 3, 4].map((col) => (
            <span
              key={col}
              className="w-8 text-center text-xs text-surface-500 dark:text-surface-400"
            >
              {col + 1}
            </span>
          ))}
        </div>

        {/* 盤面 */}
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex items-center gap-1">
            <span className="w-10 text-xs text-surface-500 dark:text-surface-400">
              Row {row + 1}
            </span>
            {[0, 1, 2, 3, 4].map((col) => (
              <div
                key={col}
                className={`
                  w-8 h-8 rounded flex items-center justify-center
                  transition-colors duration-150
                  ${
                    board[row][col]
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-400'
                  }
                `}
              >
                {board[row][col] ? '●' : '○'}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // 取得線條描述
  const getLineDescription = (pattern: LinePattern): string => {
    const positions = pattern.positions;

    // 檢查是否為橫線
    const allSameRow = positions.every(([, row]) => row === positions[0][1]);
    if (allSameRow) {
      const row = positions[0][1];
      if (row === 0) return '上面橫線';
      if (row === 1) return '中間橫線';
      if (row === 2) return '下面橫線';
    }

    // 檢查是否為 V 形
    if (
      positions[0][1] === 0 &&
      positions[2][1] === 2 &&
      positions[4][1] === 0
    ) {
      return 'V 形';
    }

    // 檢查是否為倒 V 形
    if (
      positions[0][1] === 2 &&
      positions[2][1] === 0 &&
      positions[4][1] === 2
    ) {
      return '倒 V 形';
    }

    return '自訂模式';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
          線型設定
        </h2>
        <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
          查看與確認遊戲的連線模式
        </p>
      </div>

      {/* 目前線數 */}
      <div className="panel p-4">
        <div className="flex items-center justify-between">
          <span className="text-surface-700 dark:text-surface-300">目前線數</span>
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {linesConfig.count} 條
          </span>
        </div>
      </div>

      {/* 線條列表 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">
          線條預覽
        </h3>

        <div className="space-y-3">
          {linesConfig.patterns.map((pattern) => {
            const isExpanded = expandedLines.has(pattern.id);
            const description = getLineDescription(pattern);

            return (
              <div
                key={pattern.id}
                className="bg-surface-50 dark:bg-surface-700/50 rounded-lg overflow-hidden"
              >
                {/* 線條標題 */}
                <button
                  type="button"
                  onClick={() => toggleExpand(pattern.id)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg transition-transform duration-200">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <span className="font-semibold text-surface-900 dark:text-surface-100">
                      Line {pattern.id}
                    </span>
                    <span className="text-sm text-surface-500 dark:text-surface-400">
                      ({description})
                    </span>
                  </div>
                </button>

                {/* 展開的視覺化 */}
                {isExpanded && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <div className="p-4 bg-white dark:bg-surface-800 rounded-lg">
                      {renderLineVisualization(pattern)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 提示 */}
      <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
              線型配置為預設值
            </p>
            <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
              目前版本使用固定的 20 條線配置，未來版本將支援自訂線型。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

