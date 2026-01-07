import { useState } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import type { 
  SymbolDefinition, 
  SymbolType, 
  SymbolCategory,
} from '../../types/symbol.js';

/**
 * SymbolPanel Symbol 設定面板（V2 擴展版）
 * 支援 Wild/Scatter 配置、ngWeight/fgWeight 雙欄
 */
export function SymbolPanel() {
  const { symbols, updateSymbol, addSymbol, removeSymbol } = useGameConfigStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // 按類別分組
  const normalSymbols = symbols.filter(s => s.type === 'normal');
  const specialSymbols = symbols.filter(s => s.type === 'wild' || s.type === 'scatter');

  return (
    <div className="space-y-4">
      {/* 一般符號 */}
      <div className="bg-surface-900/50 rounded-lg p-3">
        <h5 className="text-xs font-semibold text-surface-400 mb-2">一般符號</h5>
        <div className="space-y-2">
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
        <div className="space-y-2">
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

  // 更新 editedSymbol 當 symbol prop 變化時
  if (!isEditing && editedSymbol.id !== symbol.id) {
    setEditedSymbol(symbol);
  }

  if (!isEditing) {
    return (
      <div className="p-3 bg-surface-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-surface-200">{symbol.id}</span>
            <span className="text-sm text-surface-400">{symbol.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              symbol.type === 'wild' ? 'bg-yellow-700 text-yellow-200' :
              symbol.type === 'scatter' ? 'bg-purple-700 text-purple-200' :
              'bg-surface-600 text-surface-300'
            }`}>
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
        <div className="flex gap-4 text-xs text-surface-400">
          <span>3連:{symbol.payouts.match3}</span>
          <span>4連:{symbol.payouts.match4}</span>
          <span>5連:{symbol.payouts.match5}</span>
          <span className="text-blue-400">NG:{symbol.ngWeight}</span>
          <span className="text-purple-400">FG:{symbol.fgWeight}</span>
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

      {/* 權重設定 (NG/FG 雙欄) */}
      <div className="mb-3">
        <label className="text-xs text-surface-400 block mb-1">權重 (NG / FG)</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-blue-400">NG:</span>
            <input
              type="number"
              value={editedSymbol.ngWeight}
              onChange={(e) => setEditedSymbol({ ...editedSymbol, ngWeight: Number(e.target.value) })}
              className="flex-1 px-2 py-1.5 bg-surface-900 border border-blue-700 rounded text-sm text-surface-200"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-purple-400">FG:</span>
            <input
              type="number"
              value={editedSymbol.fgWeight}
              onChange={(e) => setEditedSymbol({ ...editedSymbol, fgWeight: Number(e.target.value) })}
              className="flex-1 px-2 py-1.5 bg-surface-900 border border-purple-700 rounded text-sm text-surface-200"
            />
          </div>
        </div>
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

      {/* Scatter 設定 */}
      {editedSymbol.type === 'scatter' && editedSymbol.scatterConfig && (
        <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg mb-3">
          <h6 className="text-xs font-semibold text-purple-400 mb-2">⚙️ Scatter 設定</h6>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs text-surface-400 block mb-1">觸發數量</label>
              <select
                value={editedSymbol.scatterConfig.triggerCount}
                onChange={(e) => setEditedSymbol({
                  ...editedSymbol,
                  scatterConfig: { ...editedSymbol.scatterConfig!, triggerCount: Number(e.target.value) }
                })}
                className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
              >
                {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n} 個</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-surface-400 block mb-1">Free Spin 次數</label>
              <input
                type="number"
                value={editedSymbol.scatterConfig.freeSpinCount}
                onChange={(e) => setEditedSymbol({
                  ...editedSymbol,
                  scatterConfig: { ...editedSymbol.scatterConfig!, freeSpinCount: Number(e.target.value) }
                })}
                className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-surface-300">
              <input
                type="checkbox"
                checked={editedSymbol.scatterConfig.enableRetrigger}
                onChange={(e) => setEditedSymbol({
                  ...editedSymbol,
                  scatterConfig: { ...editedSymbol.scatterConfig!, enableRetrigger: e.target.checked }
                })}
                className="rounded border-surface-600"
              />
              啟用 Retrigger
            </label>
            <label className="flex items-center gap-2 text-sm text-surface-300">
              <input
                type="checkbox"
                checked={editedSymbol.scatterConfig.enableMultiplier}
                onChange={(e) => setEditedSymbol({
                  ...editedSymbol,
                  scatterConfig: { ...editedSymbol.scatterConfig!, enableMultiplier: e.target.checked }
                })}
                className="rounded border-surface-600"
              />
              啟用 Multiplier
              {editedSymbol.scatterConfig.enableMultiplier && (
                <select
                  value={editedSymbol.scatterConfig.multiplierValue}
                  onChange={(e) => setEditedSymbol({
                    ...editedSymbol,
                    scatterConfig: { ...editedSymbol.scatterConfig!, multiplierValue: Number(e.target.value) }
                  })}
                  className="ml-2 px-2 py-0.5 bg-surface-900 border border-surface-600 rounded text-xs text-surface-200"
                >
                  {[2, 3, 5, 10].map(n => <option key={n} value={n}>{n}x</option>)}
                </select>
              )}
            </label>
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
    
    const symbol: SymbolDefinition = {
      id: `SYM_${Date.now()}`,
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
      symbol.scatterConfig = {
        triggerCount: 3,
        freeSpinCount: 10,
        enableRetrigger: true,
        enableMultiplier: true,
        multiplierValue: 2,
      };
    }
    
    onAdd(symbol);
  };

  return (
    <div className="p-4 bg-surface-700 rounded-lg border border-green-500/50">
      <h5 className="text-sm font-semibold text-green-400 mb-3">新增符號</h5>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-surface-400 block mb-1">名稱</label>
          <input
            value={newSymbol.name || ''}
            onChange={(e) => setNewSymbol({ ...newSymbol, name: e.target.value })}
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
 * 權重分佈預覽
 */
function WeightDistribution({ symbols }: { symbols: SymbolDefinition[] }) {
  const totalNGWeight = symbols.reduce((sum, s) => sum + s.ngWeight, 0);
  const totalFGWeight = symbols.reduce((sum, s) => sum + s.fgWeight, 0);

  return (
    <div className="bg-surface-900/50 rounded-lg p-3">
      <h5 className="text-xs font-semibold text-surface-400 mb-2">權重分佈預覽</h5>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {symbols.map((symbol) => {
          const ngRate = totalNGWeight > 0 ? (symbol.ngWeight / totalNGWeight) * 100 : 0;
          const fgRate = totalFGWeight > 0 ? (symbol.fgWeight / totalFGWeight) * 100 : 0;
          
          return (
            <div key={symbol.id} className="flex items-center gap-2 text-xs">
              <span className="w-12 font-mono text-surface-300">{symbol.id}</span>
              <div className="flex-1 flex gap-1">
                <div className="flex-1 h-3 bg-surface-700 rounded overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${ngRate}%` }}
                    title={`NG: ${ngRate.toFixed(1)}%`}
                  />
                </div>
                <div className="flex-1 h-3 bg-surface-700 rounded overflow-hidden">
                  <div 
                    className="h-full bg-purple-500" 
                    style={{ width: `${fgRate}%` }}
                    title={`FG: ${fgRate.toFixed(1)}%`}
                  />
                </div>
              </div>
              <span className="w-16 text-right text-surface-500">
                {ngRate.toFixed(1)}% / {fgRate.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-4 mt-2 text-xs text-surface-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-500 rounded"></span> NG
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-purple-500 rounded"></span> FG
        </span>
      </div>
    </div>
  );
}
