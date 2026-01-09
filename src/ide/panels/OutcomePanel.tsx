import { useState } from 'react';
import { useGameConfigStore, defaultOutcomeConfig } from '../../store/useGameConfigStore.js';
import type { Outcome, GamePhase } from '../../types/outcome.js';

/**
 * OutcomePanel Outcome 設定面板（V2 擴展版）
 * 支援 NG/FG 切換
 */
export function OutcomePanel() {
  const [activePhase, setActivePhase] = useState<GamePhase>('ng');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const { outcomeConfig, addOutcome, updateOutcome, removeOutcome, setOutcomeConfig } = useGameConfigStore();

  const outcomes = activePhase === 'ng'
    ? outcomeConfig.ngOutcomes
    : outcomeConfig.fgOutcomes;

  // 計算機率
  const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
  const getProbability = (weight: number) => totalWeight > 0 ? (weight / totalWeight) * 100 : 0;

  // Reset function
  const handleReset = () => {
    if (confirm('確定要重置所有 Outcome 設定嗎？此動作無法復原。')) {
      // Create a deep copy to ensure new object references
      const resetConfig = JSON.parse(JSON.stringify(defaultOutcomeConfig));
      setOutcomeConfig(resetConfig);
      setEditingId(null);
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Reset */}
      <div className="flex justify-between items-center">
        {/* NG/FG 切換器 */}
        <div className="flex rounded-lg overflow-hidden border border-surface-700">
          <button
            onClick={() => setActivePhase('ng')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${activePhase === 'ng'
                ? 'bg-blue-600 text-white'
                : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
              }`}
          >
            NG
          </button>
          <button
            onClick={() => setActivePhase('fg')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${activePhase === 'fg'
                ? 'bg-purple-600 text-white'
                : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
              }`}
          >
            FG
          </button>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-surface-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>↺</span> 全部重置
        </button>
      </div>

      {/* 總計資訊 */}
      <div className="p-3 bg-surface-900/50 rounded-lg text-xs">
        <div className="flex justify-between text-surface-400">
          <span>Outcomes: {outcomes.length}</span>
          <span>總權重: {totalWeight}</span>
        </div>
      </div>

      {/* Outcome 列表 */}
      <div className="space-y-2">
        {outcomes.map((outcome) => (
          <OutcomeItem
            key={outcome.id}
            outcome={outcome}
            probability={getProbability(outcome.weight)}
            isEditing={editingId === outcome.id}
            onEdit={() => setEditingId(outcome.id)}
            onSave={(updated) => {
              updateOutcome(updated);
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
            onDelete={() => {
              if (outcomes.length > 1) {
                removeOutcome(outcome.id);
              }
            }}
            canDelete={outcomes.length > 1}
          />
        ))}
      </div>

      {/* 新增 Outcome */}
      {showAddForm ? (
        <AddOutcomeForm
          phase={activePhase}
          onAdd={(newOutcome) => {
            addOutcome(newOutcome);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${activePhase === 'ng'
              ? 'bg-blue-600 text-white hover:bg-blue-500'
              : 'bg-purple-600 text-white hover:bg-purple-500'
            }`}
        >
          + 新增 {activePhase === 'ng' ? 'NG' : 'FG'} Outcome
        </button>
      )}

      {/* 機率分佈預覽 */}
      <ProbabilityDistribution outcomes={outcomes} />
    </div>
  );
}

/**
 * 單個 Outcome 項目
 */
interface OutcomeItemProps {
  outcome: Outcome;
  probability: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (outcome: Outcome) => void;
  onCancel: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

function OutcomeItem({
  outcome,
  probability,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  canDelete
}: OutcomeItemProps) {
  const [edited, setEdited] = useState(outcome);
  const isValid = edited.multiplierRange.min <= edited.multiplierRange.max;

  if (!isEditing) {
    return (
      <div className="p-3 bg-surface-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-surface-200">{outcome.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${outcome.phase === 'ng' ? 'bg-blue-900 text-blue-300' : 'bg-purple-900 text-purple-300'
              }`}>
              {outcome.phase.toUpperCase()}
            </span>
          </div>
          <div className="flex gap-1">
            <button onClick={onEdit} className="px-2 py-1 text-xs bg-surface-700 text-surface-300 rounded hover:bg-surface-600">
              編輯
            </button>
            <button
              onClick={onDelete}
              disabled={!canDelete}
              className="px-2 py-1 text-xs bg-red-900/50 text-red-300 rounded hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              刪除
            </button>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-surface-400">
          <span>倍率: {outcome.multiplierRange.min}x - {outcome.multiplierRange.max}x</span>
          <span>權重: {outcome.weight}</span>
          <span className="text-green-400">機率: {probability.toFixed(1)}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface-700 rounded-lg border border-primary-500/50">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="col-span-2">
          <label className="text-xs text-surface-400 block mb-1">名稱</label>
          <input
            value={edited.name}
            onChange={(e) => setEdited({ ...edited, name: e.target.value })}
            className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
          />
        </div>
        <div>
          <label className="text-xs text-surface-400 block mb-1">最小倍率</label>
          <input
            type="number"
            value={edited.multiplierRange.min}
            onChange={(e) => setEdited({
              ...edited,
              multiplierRange: { ...edited.multiplierRange, min: Number(e.target.value) }
            })}
            className={`w-full px-2 py-1.5 bg-surface-900 border ${!isValid ? 'border-red-500' : 'border-surface-600'} rounded text-sm text-surface-200`}
          />
        </div>
        <div>
          <label className="text-xs text-surface-400 block mb-1">最大倍率</label>
          <input
            type="number"
            value={edited.multiplierRange.max}
            onChange={(e) => setEdited({
              ...edited,
              multiplierRange: { ...edited.multiplierRange, max: Number(e.target.value) }
            })}
            className={`w-full px-2 py-1.5 bg-surface-900 border ${!isValid ? 'border-red-500' : 'border-surface-600'} rounded text-sm text-surface-200`}
          />
        </div>
        {!isValid && (
          <div className="col-span-2 text-xs text-red-400">
            最小倍率必須小於等於最大倍率
          </div>
        )}
        <div className="col-span-2">
          <label className="text-xs text-surface-400 block mb-1">權重</label>
          <input
            type="number"
            value={edited.weight}
            onChange={(e) => setEdited({ ...edited, weight: Number(e.target.value) })}
            className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(edited)}
          disabled={!isValid}
          className="flex-1 py-2 bg-primary-600 text-white rounded text-sm font-semibold hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
 * 新增 Outcome 表單
 */
interface AddOutcomeFormProps {
  phase: GamePhase;
  onAdd: (outcome: Omit<Outcome, 'id'>) => void;
  onCancel: () => void;
}

function AddOutcomeForm({ phase, onAdd, onCancel }: AddOutcomeFormProps) {
  const [newOutcome, setNewOutcome] = useState({
    name: '',
    multiplierRange: { min: 0, max: 0 },
    weight: 100,
  });

  const isValid = newOutcome.multiplierRange.min <= newOutcome.multiplierRange.max;

  const handleAdd = () => {
    if (!newOutcome.name || !isValid) return;
    onAdd({ ...newOutcome, phase });
  };

  return (
    <div className={`p-4 rounded-lg border ${phase === 'ng'
        ? 'bg-blue-900/20 border-blue-500/50'
        : 'bg-purple-900/20 border-purple-500/50'
      }`}>
      <h5 className={`text-sm font-semibold mb-3 ${phase === 'ng' ? 'text-blue-400' : 'text-purple-400'
        }`}>
        新增 {phase === 'ng' ? 'NG' : 'FG'} Outcome
      </h5>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="col-span-2">
          <label className="text-xs text-surface-400 block mb-1">名稱</label>
          <input
            value={newOutcome.name}
            onChange={(e) => setNewOutcome({ ...newOutcome, name: e.target.value })}
            placeholder="輸入 Outcome 名稱"
            className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
          />
        </div>
        <div>
          <label className="text-xs text-surface-400 block mb-1">最小倍率</label>
          <input
            type="number"
            value={newOutcome.multiplierRange.min}
            onChange={(e) => setNewOutcome({
              ...newOutcome,
              multiplierRange: { ...newOutcome.multiplierRange, min: Number(e.target.value) }
            })}
            className={`w-full px-2 py-1.5 bg-surface-900 border ${!isValid ? 'border-red-500' : 'border-surface-600'} rounded text-sm text-surface-200`}
          />
        </div>
        <div>
          <label className="text-xs text-surface-400 block mb-1">最大倍率</label>
          <input
            type="number"
            value={newOutcome.multiplierRange.max}
            onChange={(e) => setNewOutcome({
              ...newOutcome,
              multiplierRange: { ...newOutcome.multiplierRange, max: Number(e.target.value) }
            })}
            className={`w-full px-2 py-1.5 bg-surface-900 border ${!isValid ? 'border-red-500' : 'border-surface-600'} rounded text-sm text-surface-200`}
          />
        </div>
        {!isValid && (
          <div className="col-span-2 text-xs text-red-400">
            最小倍率必須小於等於最大倍率
          </div>
        )}
        <div className="col-span-2">
          <label className="text-xs text-surface-400 block mb-1">權重</label>
          <input
            type="number"
            value={newOutcome.weight}
            onChange={(e) => setNewOutcome({ ...newOutcome, weight: Number(e.target.value) })}
            className="w-full px-2 py-1.5 bg-surface-900 border border-surface-600 rounded text-sm text-surface-200"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={!isValid || !newOutcome.name}
          className={`flex-1 py-2 text-white rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${phase === 'ng'
              ? 'bg-blue-600 hover:bg-blue-500'
              : 'bg-purple-600 hover:bg-purple-500'
            }`}
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
 * 機率分佈預覽
 */
function ProbabilityDistribution({ outcomes }: { outcomes: Outcome[] }) {
  const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);

  // Calculate Theoretical RTP
  const theoreticalRTP = outcomes.reduce((sum, o) => {
    const probability = totalWeight > 0 ? o.weight / totalWeight : 0;
    const averageMultiplier = (o.multiplierRange.min + o.multiplierRange.max) / 2;
    return sum + (probability * averageMultiplier);
  }, 0) * 100; // Convert to percentage if multiplier is 1x = 100% RTP roughly, but here multiplier is direct payout multiplier
  // Usually RTP = HitFrequency * AverageWin.
  // Here we have average multiplier contribution = Probability * AvgMultiplier.
  // The sum of these is the Expected Value (average return) per spin unit bet.
  // If base bet is 1, and multiplier is "times bet", then this sum IS the RTP ratio.
  // Display as % (e.g., 0.95 -> 95.00%)

  return (
    <div className="bg-surface-900/50 rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-xs font-semibold text-surface-400">機率分佈</h5>
        <span className="text-xs text-surface-300">
          理論 RTP: <span className="text-yellow-400 font-mono">{(theoreticalRTP * 100).toFixed(2)}%</span> (估算值)
        </span>
      </div>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {outcomes.map((outcome) => {
          const probability = totalWeight > 0 ? (outcome.weight / totalWeight) * 100 : 0;

          return (
            <div key={outcome.id} className="flex items-center gap-2 text-xs">
              <span className="w-16 text-surface-300 truncate">{outcome.name}</span>
              <div className="flex-1 h-3 bg-surface-700 rounded overflow-hidden">
                <div
                  className={`h-full ${outcome.phase === 'ng' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}
                  style={{ width: `${probability}%` }}
                />
              </div>
              <span className="w-12 text-right text-surface-500">
                {probability.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

