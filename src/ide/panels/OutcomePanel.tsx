import { useState, useCallback, useMemo } from 'react';
import { useGameConfigStore, defaultOutcomes } from '../../store/useGameConfigStore.js';
import type { Outcome } from '../../types/outcome.js';
import {
  estimateScoreDistribution,
  calculateOutcomeCoverage,
  type ScoreDistribution,
  type OutcomeCoverage,
} from '../../engine/score-distribution.js';

/**
 * OutcomePanel Outcome 設定面板（V3 簡化版）
 * 移除 NG/FG 切換、統一 Outcome 列表
 */
export function OutcomePanel() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const { outcomes, addOutcome, updateOutcome, removeOutcome, setOutcomes } = useGameConfigStore();

  // 計算機率
  const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
  const getProbability = (weight: number) => totalWeight > 0 ? (weight / totalWeight) * 100 : 0;

  // Reset function
  const handleReset = () => {
    if (confirm('確定要重置所有 Outcome 設定嗎？此動作無法復原。')) {
      const resetOutcomes = JSON.parse(JSON.stringify(defaultOutcomes));
      setOutcomes(resetOutcomes);
      setEditingId(null);
      setShowAddForm(false);
      setScoreDistribution(null);
    }
  };

  // Score distribution for coverage warnings
  const { symbols, linesConfig, boardConfig } = useGameConfigStore();
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution | null>(null);
  const [isCalculatingCoverage, setIsCalculatingCoverage] = useState(false);

  const handleCalculateCoverage = useCallback(() => {
    setIsCalculatingCoverage(true);
    setTimeout(() => {
      const distribution = estimateScoreDistribution(symbols, linesConfig, boardConfig, 1000);
      setScoreDistribution(distribution);
      setIsCalculatingCoverage(false);
    }, 10);
  }, [symbols, linesConfig, boardConfig]);

  // Calculate coverage for current outcomes
  const coverageMap = useMemo(() => {
    if (!scoreDistribution) return new Map<string, OutcomeCoverage>();
    const coverage = calculateOutcomeCoverage(scoreDistribution, outcomes);
    return new Map(coverage.map(c => [c.outcomeId, c]));
  }, [scoreDistribution, outcomes]);

  return (
    <div className="space-y-4">
      {/* Header with Reset */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-surface-300">Outcomes 設定</h4>
        <button
          onClick={handleReset}
          className="text-xs text-surface-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>↺</span> 全部重置
        </button>
      </div>

      {/* 分數覆蓋預警 */}
      <div className="p-3 bg-surface-900/50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-surface-400">分數覆蓋狀態</span>
          <button
            onClick={handleCalculateCoverage}
            disabled={isCalculatingCoverage}
            className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-500 disabled:opacity-50"
          >
            {isCalculatingCoverage ? '計算中...' : '更新覆蓋率'}
          </button>
        </div>
        {scoreDistribution ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-surface-500">分數範圍:</span>
            <span className="font-mono">{scoreDistribution.min}x ~ {scoreDistribution.max}x</span>
            <span className="text-surface-500">| 平均:</span>
            <span className="font-mono">{scoreDistribution.avg.toFixed(1)}x</span>
          </div>
        ) : (
          <p className="text-xs text-surface-500">
            點擊「更新覆蓋率」查看各 Outcome 的分數覆蓋狀態
          </p>
        )}
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
            coverage={coverageMap.get(outcome.id)}
          />
        ))}
      </div>

      {/* 新增 Outcome */}
      {showAddForm ? (
        <AddOutcomeForm
          onAdd={(newOutcome) => {
            addOutcome(newOutcome);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-2 rounded-lg text-sm font-semibold transition-colors bg-primary-600 text-white hover:bg-primary-500"
        >
          + 新增 Outcome
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
  coverage?: OutcomeCoverage;
}

function OutcomeItem({
  outcome,
  probability,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  canDelete,
  coverage
}: OutcomeItemProps) {
  const [edited, setEdited] = useState(outcome);
  const isValid = edited.multiplierRange.min <= edited.multiplierRange.max;

  if (!isEditing) {
    return (
      <div className="p-3 bg-surface-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm text-surface-200">{outcome.name}</span>
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
          {coverage && (
            <span
              className={`px-1.5 py-0.5 rounded text-xs font-medium ${coverage.status === 'ok'
                ? 'bg-green-900/50 text-green-400'
                : coverage.status === 'low'
                  ? 'bg-yellow-900/50 text-yellow-400'
                  : 'bg-red-900/50 text-red-400'
                }`}
              title={`覆蓋率: ${coverage.percentage.toFixed(1)}%`}
            >
              {coverage.status === 'ok'
                ? '✅ 可建池'
                : coverage.status === 'low'
                  ? '⚠️ 低覆蓋'
                  : '❌ 無盤面'}
            </span>
          )}
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
  onAdd: (outcome: Omit<Outcome, 'id'>) => void;
  onCancel: () => void;
}

function AddOutcomeForm({ onAdd, onCancel }: AddOutcomeFormProps) {
  const [newOutcome, setNewOutcome] = useState({
    name: '',
    multiplierRange: { min: 0, max: 0 },
    weight: 100,
  });

  const isValid = newOutcome.multiplierRange.min <= newOutcome.multiplierRange.max;

  const handleAdd = () => {
    if (!newOutcome.name || !isValid) return;
    onAdd(newOutcome);
  };

  return (
    <div className="p-4 rounded-lg border bg-primary-900/20 border-primary-500/50">
      <h5 className="text-sm font-semibold mb-3 text-primary-400">新增 Outcome</h5>
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
          className="flex-1 py-2 text-white rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 hover:bg-primary-500"
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

  const theoreticalRTP = outcomes.reduce((sum, o) => {
    const probability = totalWeight > 0 ? o.weight / totalWeight : 0;
    const averageMultiplier = (o.multiplierRange.min + o.multiplierRange.max) / 2;
    return sum + (probability * averageMultiplier);
  }, 0) * 100;

  return (
    <div className="bg-surface-900/50 rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-xs font-semibold text-surface-400">機率分佈</h5>
        <span className="text-xs text-surface-300">
          理論 Line RTP: <span className="text-yellow-400 font-mono">{theoreticalRTP.toFixed(2)}%</span>
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
                  className="h-full bg-primary-500"
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
