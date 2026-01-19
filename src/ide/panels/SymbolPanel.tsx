import React, { useState } from 'react';
import { useGameConfigStore, defaultSymbols } from '../../store/useGameConfigStore.js';
import type {
  SymbolDefinition,
  SymbolType,
  SymbolCategory,
} from '../../types/symbol.js';


/**
 * SymbolPanel Symbol 設定面板（V3 簡化版）
 * 支援 Wild 配置、Scatter 直接賦值設定
 */
export function SymbolPanel() {
  const { symbols, updateSymbol, addSymbol, removeSymbol, setSymbols } = useGameConfigStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // 按類別分組
  const normalSymbols = symbols.filter(s => s.type === 'normal');
  const specialSymbols = symbols.filter(s => s.type === 'wild' || s.type === 'scatter');

  // Reset function
  const handleReset = () => {
    if (confirm('確定要重置所有符號設定嗎？此動作無法復原。')) {
      // Deep copy to reset
      setSymbols(JSON.parse(JSON.stringify(defaultSymbols)));
      setEditingId(null);
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Reset */}
      <div className="flex justify-between items-center px-1">
        <span className="text-sm font-semibold text-surface-200">符號列表</span>
        <button
          onClick={handleReset}
          className="text-xs text-surface-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>↺</span> 全部重置
        </button>
      </div>

      {/* 一般符號 */}
      <div className="bg-surface-900/50 rounded-lg p-3">
        <h5 className="text-xs font-semibold text-surface-400 mb-2">一般符號</h5>
        <div className="space-y-2" role="list" aria-label="一般符號列表">
          {normalSymbols.map((symbol) => (
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
      </div>

      {/* 特殊符號 */}
      <div className="bg-surface-900/50 rounded-lg p-3">
        <h5 className="text-xs font-semibold text-purple-400 mb-2">特殊符號</h5>
        <div className="space-y-2" role="list" aria-label="特殊符號列表">
          {specialSymbols.map((symbol) => (
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
          onClick={() => setShowAddForm(true)}
          className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors text-sm font-semibold"
        >
          + 新增符號
        </button>
      )}



      {/* 權重分佈預覽 */}
      <WeightDistribution symbols={symbols} />
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

  // 使用 useEffect 同步 props 到 state（避免在 render 中直接呼叫 setState）
  React.useEffect(() => {
    if (!isEditing) {
      setEditedSymbol(symbol);
    }
  }, [symbol, isEditing]);

  if (!isEditing) {
    return (
      <div className="p-3 bg-surface-800 rounded-lg" role="listitem" aria-label={`符號 ${symbol.id}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span role="text" aria-label={`ID: ${symbol.id}`} className="font-mono text-sm font-bold text-surface-200">{symbol.id}</span>
            <span role="text" aria-label={`名稱: ${symbol.name}`} className="text-sm text-surface-400">{symbol.name}</span>
            <span
              role="text"
              aria-label={`類型: ${symbol.type}`}
              className={`text-xs px-2 py-0.5 rounded ${symbol.type === 'wild' ? 'bg-yellow-700 text-yellow-200' :
                symbol.type === 'scatter' ? 'bg-purple-700 text-purple-200' :
                  'bg-surface-600 text-surface-300'
                }`}
            >
              {symbol.type}
            </span>
          </div>
          <div className="flex gap-1">
            <button onClick={onEdit} className="px-2 py-1 text-xs bg-surface-700 text-surface-300 rounded hover:bg-surface-600">
              編輯
            </button>
            <button onClick={onDelete} className="px-2 py-1 text-xs bg-red-900/50 text-red-300 rounded hover:bg-red-800">
              刪除
            </button>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-surface-400" role="group" aria-label="賠付與權重">
          {symbol.type !== 'scatter' && (
            <>
              <span role="text">3連:{symbol.payouts.match3}</span>
              <span role="text">4連:{symbol.payouts.match4}</span>
              <span role="text">5連:{symbol.payouts.match5}</span>
            </>
          )}
          <span role="text" className="text-green-400">視覺權重:{symbol.appearanceWeight}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface-700 rounded-lg border border-primary-500/50">
      {/* 基本資訊 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-surface-400 block mb-1">ID</label>
          <input
            value={editedSymbol.id}
            onChange={(e) => setEditedSymbol({ ...editedSymbol, id: e.target.value })}
            className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
          />
        </div>
        <div>
          <label className="text-xs text-surface-400 block mb-1">名稱</label>
          <input
            value={editedSymbol.name}
            onChange={(e) => setEditedSymbol({ ...editedSymbol, name: e.target.value })}
            className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
          />
        </div>
      </div>

      {/* 類別選擇 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-surface-400 block mb-1">類型</label>
          <select
            value={editedSymbol.type}
            onChange={(e) => {
              const type = e.target.value as SymbolType;
              const updated = { ...editedSymbol, type };

              if (type === 'wild' && !updated.wildConfig) {
                updated.wildConfig = { canReplaceNormal: true, canReplaceSpecial: false };
              } else if (type === 'scatter' && !updated.scatterPayoutConfig) {
                // V3: 使用 Scatter 直接賦值，不再觸發 Free Spin
                updated.scatterPayoutConfig = {
                  minCount: 3,
                  payoutByCount: { 3: 25, 4: 50, 5: 100, 6: 200 }
                };
              }
              setEditedSymbol(updated);
            }}
            className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
          >
            <option value="normal">一般符號</option>
            <option value="wild">Wild 百搭</option>
            <option value="scatter">Scatter 分散</option>
          </select>
        </div>
        {editedSymbol.type === 'normal' && (
          <div>
            <label className="text-xs text-surface-400 block mb-1">分類</label>
            <select
              value={editedSymbol.category}
              onChange={(e) => setEditedSymbol({ ...editedSymbol, category: e.target.value as SymbolCategory })}
              className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
            >
              <option value="high">高分符號</option>
              <option value="low">低分符號</option>
            </select>
          </div>
        )}
      </div>

      {/* 賠付設定 */}
      {editedSymbol.type !== 'scatter' && (
        <div className="mb-3">
          <label className="text-xs text-surface-400 block mb-1">賠付 (3連/4連/5連)</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={editedSymbol.payouts.match3}
              onChange={(e) => setEditedSymbol({
                ...editedSymbol,
                payouts: { ...editedSymbol.payouts, match3: Number(e.target.value) }
              })}
              className="px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200 text-center"
            />
            <input
              type="number"
              value={editedSymbol.payouts.match4}
              onChange={(e) => setEditedSymbol({
                ...editedSymbol,
                payouts: { ...editedSymbol.payouts, match4: Number(e.target.value) }
              })}
              className="px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200 text-center"
            />
            <input
              type="number"
              value={editedSymbol.payouts.match5}
              onChange={(e) => setEditedSymbol({
                ...editedSymbol,
                payouts: { ...editedSymbol.payouts, match5: Number(e.target.value) }
              })}
              className="px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200 text-center"
            />
          </div>
        </div>
      )}

      {/* 視覺權重設定 */}
      <div className="mb-3">
        <label className="text-xs text-surface-400 block mb-1">
          視覺權重
          <span className="text-surface-500 ml-1">(僅影響滾動動畫，不影響中獎)</span>
        </label>
        <input
          type="number"
          min={1}
          value={editedSymbol.appearanceWeight}
          onChange={(e) => {
            const weight = Math.max(1, Number(e.target.value));
            // 同步到所有權重欄位保持一致
            setEditedSymbol({
              ...editedSymbol,
              appearanceWeight: weight,
              ngWeight: weight,
              fgWeight: weight,
            });
          }}
          className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
        />
      </div>

      {/* Wild 設定 */}
      {editedSymbol.type === 'wild' && editedSymbol.wildConfig && (
        <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg mb-3">
          <h6 className="text-xs font-semibold text-yellow-400 mb-2">⚙️ Wild 設定</h6>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-surface-300">
              <input
                type="checkbox"
                checked={editedSymbol.wildConfig.canReplaceNormal}
                onChange={(e) => setEditedSymbol({
                  ...editedSymbol,
                  wildConfig: { ...editedSymbol.wildConfig!, canReplaceNormal: e.target.checked }
                })}
                className="rounded border-surface-600"
              />
              替代一般符號
            </label>
            <label className="flex items-center gap-2 text-sm text-surface-300">
              <input
                type="checkbox"
                checked={editedSymbol.wildConfig.canReplaceSpecial}
                onChange={(e) => setEditedSymbol({
                  ...editedSymbol,
                  wildConfig: { ...editedSymbol.wildConfig!, canReplaceSpecial: e.target.checked }
                })}
                className="rounded border-surface-600"
              />
              替代特殊符號
            </label>
          </div>
        </div>
      )}

      {/* Scatter 直接賦值設定 (V3 簡化版) */}
      {editedSymbol.type === 'scatter' && (
        <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg space-y-3">
          <h6 className="text-xs font-semibold text-purple-400 mb-2">💎 Scatter 直接賦值設定</h6>
          <p className="text-xs text-surface-500 mb-3">
            當盤面出現指定數量的 Scatter 時，直接給予對應倍率的獎金（不觸發 Free Spin）
          </p>

          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-xs">
              <span className="text-surface-400">數量</span>
              <span className="text-surface-400 col-span-3">賠率 (x bet)</span>
            </div>

            {[3, 4, 5, 6].map(count => (
              <div key={count} className="grid grid-cols-4 gap-2 items-center">
                <span className="text-sm text-surface-300 font-semibold">{count} 個</span>
                <input
                  type="number"
                  min={0}
                  value={editedSymbol.scatterPayoutConfig?.payoutByCount[count] ?? (count === 3 ? 25 : count === 4 ? 50 : count === 5 ? 100 : 200)}
                  onChange={(e) => {
                    const value = Math.max(0, Number(e.target.value));
                    const currentConfig = editedSymbol.scatterPayoutConfig ?? {
                      minCount: 3,
                      payoutByCount: { 3: 25, 4: 50, 5: 100, 6: 200 }
                    };
                    setEditedSymbol({
                      ...editedSymbol,
                      scatterPayoutConfig: {
                        ...currentConfig,
                        payoutByCount: {
                          ...currentConfig.payoutByCount,
                          [count]: value
                        }
                      }
                    });
                  }}
                  className="col-span-2 px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200 text-center"
                />
                <span className="text-xs text-surface-500">x</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-purple-700/30">
            <label className="text-xs text-surface-400 block mb-1">最少觸發數量</label>
            <select
              value={editedSymbol.scatterPayoutConfig?.minCount ?? 3}
              onChange={(e) => {
                const minCount = Number(e.target.value);
                const currentConfig = editedSymbol.scatterPayoutConfig ?? {
                  minCount: 3,
                  payoutByCount: { 3: 25, 4: 50, 5: 100, 6: 200 }
                };
                setEditedSymbol({
                  ...editedSymbol,
                  scatterPayoutConfig: {
                    ...currentConfig,
                    minCount
                  }
                });
              }}
              className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
            >
              {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n} 個</option>)}
            </select>
          </div>
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="flex gap-2">
        <button
          onClick={() => onSave(editedSymbol)}
          className="flex-1 py-2 bg-primary-600 text-white rounded text-sm font-semibold hover:bg-primary-500"
        >
          儲存
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-surface-600 text-surface-300 rounded text-sm hover:bg-surface-500"
        >
          取消
        </button>
      </div>
    </div>
  );
}

/**
 * 新增符號表單
 */
interface AddSymbolFormProps {
  onAdd: (symbol: SymbolDefinition) => void;
  onCancel: () => void;
}

function AddSymbolForm({ onAdd, onCancel }: AddSymbolFormProps) {
  const [newSymbol, setNewSymbol] = useState<Partial<SymbolDefinition>>({
    id: '',
    name: '',
    type: 'normal',
    category: 'high',
    payouts: { match3: 10, match4: 20, match5: 40 },
    appearanceWeight: 20,
    ngWeight: 20,
    fgWeight: 20,
  });
  const [idManuallyChanged, setIdManuallyChanged] = useState(false);

  const handleAdd = () => {
    if (!newSymbol.name) return;

    // 如果 ID 為空，則使用 Name (如果用戶刪除了 ID 導致為空的情況)
    const finalId = newSymbol.id || newSymbol.name;

    const symbol: SymbolDefinition = {
      id: finalId,
      name: newSymbol.name || '',
      type: newSymbol.type || 'normal',
      category: newSymbol.category || 'high',
      payouts: newSymbol.payouts || { match3: 10, match4: 20, match5: 40 },
      appearanceWeight: newSymbol.appearanceWeight || 20,
      ngWeight: newSymbol.ngWeight || 20,
      fgWeight: newSymbol.fgWeight || 20,
    };

    if (symbol.type === 'wild') {
      symbol.wildConfig = { canReplaceNormal: true, canReplaceSpecial: false };
    } else if (symbol.type === 'scatter') {
      // V3: 使用 Scatter 直接賦值，不再觸發 Free Spin
      symbol.scatterPayoutConfig = {
        minCount: 3,
        payoutByCount: { 3: 25, 4: 50, 5: 100, 6: 200 }
      };
    }

    onAdd(symbol);
  };

  return (
    <div className="p-4 bg-surface-700 rounded-lg border border-green-500/50">
      <h5 className="text-sm font-semibold text-green-400 mb-3">新增符號</h5>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-surface-400 block mb-1">ID</label>
          <input
            value={newSymbol.id || ''}
            onChange={(e) => {
              setNewSymbol({ ...newSymbol, id: e.target.value });
              setIdManuallyChanged(true);
            }}
            placeholder="ID (預設同名稱)"
            className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
          />
        </div>
        <div>
          <label className="text-xs text-surface-400 block mb-1">名稱</label>
          <input
            value={newSymbol.name || ''}
            onChange={(e) => {
              const name = e.target.value;
              setNewSymbol(prev => ({
                ...prev,
                name,
                // 如果 ID 未被手動修改，則同步為 Name
                id: idManuallyChanged ? prev.id : name
              }));
            }}
            placeholder="輸入符號名稱"
            className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
          />
        </div>
        <div>
          <label className="text-xs text-surface-400 block mb-1">類型</label>
          <select
            value={newSymbol.type}
            onChange={(e) => setNewSymbol({ ...newSymbol, type: e.target.value as SymbolType })}
            className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
          >
            <option value="normal">一般符號</option>
            <option value="wild">Wild 百搭</option>
            <option value="scatter">Scatter 分散</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          className="flex-1 py-2 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-500"
        >
          新增
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-surface-600 text-surface-300 rounded text-sm hover:bg-surface-500"
        >
          取消
        </button>
      </div>
    </div>
  );
}



/**
 * 權重分佈預覽（V3 簡化版）
 * 只顯示視覺權重（appearanceWeight），用於滾動動畫
 */
function WeightDistribution({ symbols }: { symbols: SymbolDefinition[] }) {
  const totalWeight = symbols.reduce((sum, s) => sum + s.appearanceWeight, 0);

  return (
    <div className="bg-surface-900/50 rounded-lg p-3" role="region" aria-label="權重分佈預覽">
      <h5 className="text-xs font-semibold text-surface-400 mb-2">視覺權重分佈</h5>
      <p className="text-xs text-surface-500 mb-2">
        僅影響滾動動畫中符號出現頻率，不影響中獎機率
      </p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto" role="list">
        {symbols.map((symbol) => {
          const rate = totalWeight > 0 ? (symbol.appearanceWeight / totalWeight) * 100 : 0;

          return (
            <div
              key={symbol.id}
              className="flex items-center gap-2 text-xs"
              role="listitem"
              aria-label={`${symbol.id}: ${rate.toFixed(1)}%`}
            >
              <span role="text" className="w-12 font-mono text-surface-300">{symbol.id}</span>
              <div
                className="flex-1 h-3 bg-surface-700 rounded overflow-hidden"
                role="progressbar"
                aria-valuenow={rate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${rate.toFixed(1)}%`}
              >
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${rate}%` }}
                />
              </div>
              <span role="text" className="w-12 text-right text-surface-500">
                {rate.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

