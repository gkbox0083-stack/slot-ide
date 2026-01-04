import { useState, useEffect } from 'react';
import { linesManager } from '../../engine/index.js';
import type { LinePattern } from '../../types/lines.js';

/**
 * LinesPanel Lines 設定面板
 */
export function LinesPanel() {
  const [patterns, setPatterns] = useState<LinePattern[]>([]);
  const [lineCount, setLineCount] = useState<number>(0);
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());

  // 載入 Lines
  const loadLines = () => {
    const config = linesManager.getConfig();
    setPatterns(config.patterns);
    setLineCount(config.count);
  };

  useEffect(() => {
    loadLines();
  }, []);

  // 切換展開/收起
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
    const board: boolean[][] = [];
    for (let row = 0; row < 3; row++) {
      board[row] = [];
      for (let col = 0; col < 5; col++) {
        board[row][col] = false;
      }
    }

    // 標記線條經過的位置
    pattern.positions.forEach(([col, row]) => {
      if (row >= 0 && row < 3 && col >= 0 && col < 5) {
        board[row][col] = true;
      }
    });

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        fontSize: '11px',
        fontFamily: 'monospace',
      }}>
        {/* 列標題 */}
        <div style={{
          display: 'flex',
          gap: '4px',
          paddingLeft: '40px',
        }}>
          {[0, 1, 2, 3, 4].map((col) => (
            <span key={col} style={{ width: '24px', textAlign: 'center', fontSize: '10px', color: '#999' }}>
              Col{col}
            </span>
          ))}
        </div>

        {/* 盤面 */}
        {[0, 1, 2].map((row) => (
          <div key={row} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ width: '36px', fontSize: '10px', color: '#999' }}>Row{row}</span>
            {[0, 1, 2, 3, 4].map((col) => (
              <div
                key={col}
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #ddd',
                  backgroundColor: board[row][col] ? '#3498db' : '#f8f9fa',
                  color: board[row][col] ? 'white' : '#999',
                  borderRadius: '2px',
                  fontSize: '10px',
                  fontWeight: board[row][col] ? 'bold' : 'normal',
                }}
              >
                {board[row][col] ? '●' : ' '}
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
      if (row === 0) return '(上面橫線)';
      if (row === 1) return '(中間橫線)';
      if (row === 2) return '(下面橫線)';
    }

    // 檢查是否為 V 形
    if (positions[0][1] === 0 && positions[2][1] === 2 && positions[4][1] === 0) {
      return '(V 形)';
    }

    // 檢查是否為倒 V 形
    if (positions[0][1] === 2 && positions[2][1] === 0 && positions[4][1] === 2) {
      return '(倒 V 形)';
    }

    // 其他模式
    return '(自訂模式)';
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
      border: '1px solid #ddd',
    }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: '16px',
        fontSize: '16px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        📐 Lines 設定
      </h3>

      {/* 目前線數 */}
      <div style={{
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
      }}>
        目前線數: <strong>{lineCount}</strong> 條
      </div>

      {/* 線條預覽 */}
      <div style={{
        padding: '16px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        marginBottom: '16px',
      }}>
        <h4 style={{
          marginTop: 0,
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          ┌─ 線條預覽 ───────────────────────────────────────────┐
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {patterns.map((pattern) => {
            const isExpanded = expandedLines.has(pattern.id);
            const description = getLineDescription(pattern);

            return (
              <div
                key={pattern.id}
                style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                }}
              >
                {/* 線條標題與展開按鈕 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: isExpanded ? '12px' : 0,
                  cursor: 'pointer',
                }}
                onClick={() => toggleExpand(pattern.id)}
                >
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span>{isExpanded ? '▼' : '▶'}</span>
                    <span>Line {pattern.id}: {description}</span>
                  </div>
                </div>

                {/* 展開的視覺化 */}
                {isExpanded && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}>
                    {renderLineVisualization(pattern)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: '16px',
          fontSize: '12px',
          color: '#666',
        }}>
          └────────────────────────────────────────────────────────┘
        </div>
      </div>

      {/* 提示 */}
      <div style={{
        padding: '12px',
        backgroundColor: '#e3f2fd',
        border: '1px solid #90caf9',
        borderRadius: '4px',
        fontSize: '13px',
        color: '#1565c0',
      }}>
        ℹ️ 線條配置為預設值，Phase 6 可自訂
      </div>
    </div>
  );
}
