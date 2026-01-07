# P2-07 Pay Lines 視覺化編輯器

## 目標 (Objective)

實作 Pay Lines 視覺化編輯器，包括：
- 盤面格子顯示（5×3 或 5×4）
- 點擊/拖拉設定線路
- 線路預覽
- 新增/刪除線路
- 最多 50 條線限制

---

## 範圍 (Scope)

需要修改的檔案：
- `src/ide/panels/LinesPanel.tsx`

依賴：
- P1-05（Board 5x4 支援）
- P2-02（左側 Control Panel）

---

## 實作細節 (Implementation Details)

### LinesPanel.tsx 完整重構

```tsx
import React, { useState, useCallback } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore';
import type { LinePattern } from '../../types/lines';

const MAX_LINES = 50;

export function LinesPanel() {
  const { boardConfig, linesConfig, setLinesConfig } = useGameConfigStore();
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPositions, setEditingPositions] = useState<[number, number][]>([]);

  const { cols, rows } = boardConfig;

  // 開始編輯線路
  const startEditLine = (index: number | null) => {
    if (index === null) {
      // 新增線路
      setEditingPositions([]);
    } else {
      // 編輯現有線路
      setEditingPositions([...linesConfig.patterns[index].positions]);
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

  return (
    <div className="lines-panel">
      {/* 線數顯示 */}
      <div className="lines-info">
        <span>線數: {linesConfig.count} / {MAX_LINES}</span>
      </div>

      {/* 視覺化編輯器 */}
      <div className="lines-editor">
        <div 
          className="board-grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
        >
          {Array.from({ length: rows }, (_, row) =>
            Array.from({ length: cols }, (_, col) => {
              const isInEditingLine = editingPositions.some(
                ([c, r]) => c === col && r === row
              );
              const lineIndex = editingPositions.findIndex(([c]) => c === col);
              
              return (
                <div
                  key={`${col}-${row}`}
                  className={`grid-cell ${isInEditingLine ? 'selected' : ''} ${isEditing ? 'editable' : ''}`}
                  onClick={() => handleCellClick(col, row)}
                >
                  <span className="cell-coord">[{col},{row}]</span>
                  {isInEditingLine && (
                    <span className="cell-order">{lineIndex + 1}</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 線路連線預覽 */}
        {isEditing && editingPositions.length > 1 && (
          <svg className="line-preview" viewBox={`0 0 ${cols * 50} ${rows * 50}`}>
            <polyline
              points={editingPositions.map(([col, row]) => 
                `${col * 50 + 25},${row * 50 + 25}`
              ).join(' ')}
              fill="none"
              stroke="#6366f1"
              strokeWidth="3"
            />
          </svg>
        )}
      </div>

      {/* 編輯操作 */}
      {isEditing ? (
        <div className="edit-actions">
          <p className="edit-hint">
            點擊格子設定線路，線路必須經過每一列
          </p>
          <p className="edit-progress">
            已設定: {editingPositions.length} / {cols} 列
          </p>
          <div className="button-group">
            <button onClick={saveLine} disabled={editingPositions.length !== cols}>
              儲存
            </button>
            <button onClick={cancelEdit} className="cancel">取消</button>
          </div>
        </div>
      ) : (
        <div className="add-actions">
          <button 
            onClick={() => startEditLine(null)}
            disabled={linesConfig.patterns.length >= MAX_LINES}
          >
            + 新增線路
          </button>
        </div>
      )}

      {/* 線路列表 */}
      <div className="lines-list">
        <h4>線路列表</h4>
        {linesConfig.patterns.map((pattern, index) => (
          <div 
            key={pattern.id}
            className={`line-item ${selectedLineIndex === index ? 'selected' : ''}`}
            onClick={() => !isEditing && setSelectedLineIndex(index)}
          >
            <span className="line-id">線 {pattern.id}</span>
            <span className="line-positions">
              {pattern.positions.map(([c, r]) => `[${c},${r}]`).join(' → ')}
            </span>
            <div className="line-actions">
              <button onClick={() => startEditLine(index)} disabled={isEditing}>
                編輯
              </button>
              <button 
                onClick={() => deleteLine(index)} 
                className="delete"
                disabled={isEditing}
              >
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 重置按鈕 */}
      <button 
        className="reset-btn"
        onClick={() => {
          // 重置為預設配置
          // 根據 boardConfig.rows 選擇預設
        }}
        disabled={isEditing}
      >
        重置為預設
      </button>
    </div>
  );
}
```

### CSS 樣式

```css
.lines-editor {
  position: relative;
  margin: 1rem 0;
}

.board-grid {
  display: grid;
  gap: 4px;
  background: #1a1a2e;
  padding: 8px;
  border-radius: 8px;
}

.grid-cell {
  aspect-ratio: 1;
  background: #2a2a4e;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #666;
  cursor: default;
  transition: all 0.2s;
}

.grid-cell.editable {
  cursor: pointer;
}

.grid-cell.editable:hover {
  background: #3a3a6e;
}

.grid-cell.selected {
  background: #6366f1;
  color: #fff;
}

.cell-order {
  font-size: 1rem;
  font-weight: bold;
}

.line-preview {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  pointer-events: none;
}

.lines-list {
  max-height: 200px;
  overflow-y: auto;
}

.line-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid #333;
}

.line-item.selected {
  background: rgba(99, 102, 241, 0.1);
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 盤面格子根據 boardConfig 正確顯示
- [ ] 點擊格子可設定線路
- [ ] 線路預覽正確顯示連線
- [ ] 新增線路功能正常
- [ ] 編輯線路功能正常
- [ ] 刪除線路功能正常
- [ ] 最多 50 條線限制正常
- [ ] 線路必須經過每一列的驗證
- [ ] `npm run build` 成功

