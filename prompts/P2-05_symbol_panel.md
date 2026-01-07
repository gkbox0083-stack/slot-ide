# P2-05 SymbolPanel 擴展（Wild/Scatter UI）

## 目標 (Objective)

擴展 SymbolPanel 支援 Wild 和 Scatter 符號的 UI 設定，包括：
- 符號類別選擇（normal/wild/scatter）
- Wild 選擇後顯示 WildConfig 設定
- Scatter 選擇後顯示 ScatterConfig 設定
- ngWeight/fgWeight 雙欄顯示
- 新增/刪除符號功能

---

## 範圍 (Scope)

需要修改的檔案：
- `src/ide/panels/SymbolPanel.tsx`

依賴：
- P1-01（型別定義擴展）
- P1-02（Symbol 系統擴展）
- P2-02（左側 Control Panel）

---

## 實作細節 (Implementation Details)

### SymbolPanel.tsx 完整重構

```tsx
import React, { useState } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore';
import type { 
  SymbolDefinition, 
  SymbolType, 
  SymbolCategory,
  WildConfig,
  ScatterConfig 
} from '../../types/symbol';

export function SymbolPanel() {
  const { symbols, updateSymbol, addSymbol, removeSymbol } = useGameConfigStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="symbol-panel">
      {/* 符號列表 */}
      <div className="symbol-list">
        {symbols.map((symbol) => (
          <SymbolItem
            key={symbol.id}
            symbol={symbol}
            isEditing={editingId === symbol.id}
            onEdit={() => setEditingId(symbol.id)}
            onSave={(updated) => {
              updateSymbol(updated);
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
            onDelete={() => removeSymbol(symbol.id)}
          />
        ))}
      </div>

      {/* 新增符號 */}
      {showAddForm ? (
        <AddSymbolForm
          onAdd={(symbol) => {
            addSymbol(symbol);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button 
          className="add-symbol-btn"
          onClick={() => setShowAddForm(true)}
        >
          + 新增 Symbol
        </button>
      )}
    </div>
  );
}

/**
 * 單個符號項目
 */
interface SymbolItemProps {
  symbol: SymbolDefinition;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (symbol: SymbolDefinition) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function SymbolItem({ symbol, isEditing, onEdit, onSave, onCancel, onDelete }: SymbolItemProps) {
  const [editedSymbol, setEditedSymbol] = useState(symbol);

  if (!isEditing) {
    return (
      <div className="symbol-item">
        <div className="symbol-header">
          <span className="symbol-id">{symbol.id}</span>
          <span className="symbol-name">{symbol.name}</span>
          <span className={`symbol-type type-${symbol.type}`}>{symbol.type}</span>
        </div>
        <div className="symbol-info">
          <span>3連: {symbol.payouts.match3}</span>
          <span>4連: {symbol.payouts.match4}</span>
          <span>5連: {symbol.payouts.match5}</span>
        </div>
        <div className="symbol-weights">
          <span>NG: {symbol.ngWeight}</span>
          <span>FG: {symbol.fgWeight}</span>
        </div>
        <div className="symbol-actions">
          <button onClick={onEdit}>編輯</button>
          <button onClick={onDelete} className="delete">刪除</button>
        </div>
      </div>
    );
  }

  return (
    <div className="symbol-item editing">
      {/* 基本資訊 */}
      <div className="form-row">
        <label>ID</label>
        <input
          value={editedSymbol.id}
          onChange={(e) => setEditedSymbol({ ...editedSymbol, id: e.target.value })}
        />
      </div>
      <div className="form-row">
        <label>名稱</label>
        <input
          value={editedSymbol.name}
          onChange={(e) => setEditedSymbol({ ...editedSymbol, name: e.target.value })}
        />
      </div>

      {/* 類別選擇 */}
      <div className="form-row">
        <label>類型</label>
        <select
          value={editedSymbol.type}
          onChange={(e) => {
            const type = e.target.value as SymbolType;
            const updated = { ...editedSymbol, type };
            
            // 根據類型添加預設配置
            if (type === 'wild' && !updated.wildConfig) {
              updated.wildConfig = {
                canReplaceNormal: true,
                canReplaceSpecial: false,
              };
            } else if (type === 'scatter' && !updated.scatterConfig) {
              updated.scatterConfig = {
                triggerCount: 3,
                freeSpinCount: 10,
                enableRetrigger: true,
                enableMultiplier: true,
                multiplierValue: 2,
              };
            }
            
            setEditedSymbol(updated);
          }}
        >
          <option value="normal">一般符號</option>
          <option value="wild">Wild 百搭</option>
          <option value="scatter">Scatter 分散</option>
        </select>
      </div>

      {/* 一般符號的 Category */}
      {editedSymbol.type === 'normal' && (
        <div className="form-row">
          <label>分類</label>
          <select
            value={editedSymbol.category}
            onChange={(e) => setEditedSymbol({ 
              ...editedSymbol, 
              category: e.target.value as SymbolCategory 
            })}
          >
            <option value="high">高分符號</option>
            <option value="low">低分符號</option>
          </select>
        </div>
      )}

      {/* Payouts */}
      <div className="form-section">
        <h5>賠付設定</h5>
        <div className="form-row">
          <label>3 連線</label>
          <input
            type="number"
            value={editedSymbol.payouts.match3}
            onChange={(e) => setEditedSymbol({
              ...editedSymbol,
              payouts: { ...editedSymbol.payouts, match3: Number(e.target.value) }
            })}
          />
        </div>
        <div className="form-row">
          <label>4 連線</label>
          <input
            type="number"
            value={editedSymbol.payouts.match4}
            onChange={(e) => setEditedSymbol({
              ...editedSymbol,
              payouts: { ...editedSymbol.payouts, match4: Number(e.target.value) }
            })}
          />
        </div>
        <div className="form-row">
          <label>5 連線</label>
          <input
            type="number"
            value={editedSymbol.payouts.match5}
            onChange={(e) => setEditedSymbol({
              ...editedSymbol,
              payouts: { ...editedSymbol.payouts, match5: Number(e.target.value) }
            })}
          />
        </div>
      </div>

      {/* 權重設定 */}
      <div className="form-section">
        <h5>權重設定</h5>
        <div className="weight-row">
          <div className="form-row">
            <label>NG 權重</label>
            <input
              type="number"
              value={editedSymbol.ngWeight}
              onChange={(e) => setEditedSymbol({
                ...editedSymbol,
                ngWeight: Number(e.target.value)
              })}
            />
          </div>
          <div className="form-row">
            <label>FG 權重</label>
            <input
              type="number"
              value={editedSymbol.fgWeight}
              onChange={(e) => setEditedSymbol({
                ...editedSymbol,
                fgWeight: Number(e.target.value)
              })}
            />
          </div>
        </div>
        <p className="hint">視覺權重: {editedSymbol.appearanceWeight}（僅影響滾動動畫）</p>
      </div>

      {/* Wild 設定 */}
      {editedSymbol.type === 'wild' && editedSymbol.wildConfig && (
        <div className="form-section wild-config">
          <h5>⚙️ Wild 設定</h5>
          <div className="form-row checkbox">
            <label>
              <input
                type="checkbox"
                checked={editedSymbol.wildConfig.canReplaceNormal}
                onChange={(e) => setEditedSymbol({
                  ...editedSymbol,
                  wildConfig: {
                    ...editedSymbol.wildConfig!,
                    canReplaceNormal: e.target.checked
                  }
                })}
              />
              替代一般符號
            </label>
          </div>
          <div className="form-row checkbox">
            <label>
              <input
                type="checkbox"
                checked={editedSymbol.wildConfig.canReplaceSpecial}
                onChange={(e) => setEditedSymbol({
                  ...editedSymbol,
                  wildConfig: {
                    ...editedSymbol.wildConfig!,
                    canReplaceSpecial: e.target.checked
                  }
                })}
              />
              替代特殊符號
            </label>
          </div>
        </div>
      )}

      {/* Scatter 設定 */}
      {editedSymbol.type === 'scatter' && editedSymbol.scatterConfig && (
        <div className="form-section scatter-config">
          <h5>⚙️ Scatter 設定</h5>
          <div className="form-row">
            <label>觸發數量</label>
            <select
              value={editedSymbol.scatterConfig.triggerCount}
              onChange={(e) => setEditedSymbol({
                ...editedSymbol,
                scatterConfig: {
                  ...editedSymbol.scatterConfig!,
                  triggerCount: Number(e.target.value)
                }
              })}
            >
              {[2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n} 個</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Free Spin 次數</label>
            <input
              type="number"
              value={editedSymbol.scatterConfig.freeSpinCount}
              onChange={(e) => setEditedSymbol({
                ...editedSymbol,
                scatterConfig: {
                  ...editedSymbol.scatterConfig!,
                  freeSpinCount: Number(e.target.value)
                }
              })}
            />
          </div>
          <div className="form-row checkbox">
            <label>
              <input
                type="checkbox"
                checked={editedSymbol.scatterConfig.enableRetrigger}
                onChange={(e) => setEditedSymbol({
                  ...editedSymbol,
                  scatterConfig: {
                    ...editedSymbol.scatterConfig!,
                    enableRetrigger: e.target.checked
                  }
                })}
              />
              啟用 Retrigger
            </label>
          </div>
          <div className="form-row checkbox">
            <label>
              <input
                type="checkbox"
                checked={editedSymbol.scatterConfig.enableMultiplier}
                onChange={(e) => setEditedSymbol({
                  ...editedSymbol,
                  scatterConfig: {
                    ...editedSymbol.scatterConfig!,
                    enableMultiplier: e.target.checked
                  }
                })}
              />
              啟用 Multiplier
            </label>
          </div>
          {editedSymbol.scatterConfig.enableMultiplier && (
            <div className="form-row">
              <label>倍率</label>
              <select
                value={editedSymbol.scatterConfig.multiplierValue}
                onChange={(e) => setEditedSymbol({
                  ...editedSymbol,
                  scatterConfig: {
                    ...editedSymbol.scatterConfig!,
                    multiplierValue: Number(e.target.value)
                  }
                })}
              >
                {[2, 3, 5, 10].map(n => (
                  <option key={n} value={n}>{n}x</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="form-actions">
        <button onClick={() => onSave(editedSymbol)}>儲存</button>
        <button onClick={onCancel} className="cancel">取消</button>
      </div>
    </div>
  );
}

/**
 * 新增符號表單
 */
interface AddSymbolFormProps {
  onAdd: (symbol: Omit<SymbolDefinition, 'id'>) => void;
  onCancel: () => void;
}

function AddSymbolForm({ onAdd, onCancel }: AddSymbolFormProps) {
  const [newSymbol, setNewSymbol] = useState<Partial<SymbolDefinition>>({
    name: '',
    type: 'normal',
    category: 'high',
    payouts: { match3: 10, match4: 20, match5: 40 },
    appearanceWeight: 20,
    ngWeight: 20,
    fgWeight: 20,
  });

  const handleAdd = () => {
    if (!newSymbol.name) return;
    
    onAdd({
      ...newSymbol,
      id: `SYM_${Date.now()}`,
    } as Omit<SymbolDefinition, 'id'>);
  };

  return (
    <div className="add-symbol-form">
      <h4>新增符號</h4>
      <div className="form-row">
        <label>名稱</label>
        <input
          value={newSymbol.name || ''}
          onChange={(e) => setNewSymbol({ ...newSymbol, name: e.target.value })}
          placeholder="輸入符號名稱"
        />
      </div>
      <div className="form-row">
        <label>類型</label>
        <select
          value={newSymbol.type}
          onChange={(e) => setNewSymbol({ ...newSymbol, type: e.target.value as SymbolType })}
        >
          <option value="normal">一般符號</option>
          <option value="wild">Wild 百搭</option>
          <option value="scatter">Scatter 分散</option>
        </select>
      </div>
      <div className="form-actions">
        <button onClick={handleAdd}>新增</button>
        <button onClick={onCancel} className="cancel">取消</button>
      </div>
    </div>
  );
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 符號類別選擇正常（normal/wild/scatter）
- [ ] Wild 選擇後顯示 WildConfig 設定
- [ ] Scatter 選擇後顯示 ScatterConfig 設定
- [ ] ngWeight/fgWeight 雙欄顯示
- [ ] 新增符號功能正常
- [ ] 刪除符號功能正常
- [ ] 編輯符號功能正常
- [ ] `npm run build` 成功

