import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextInput, NumberInput } from '../../components/form/index.js';
import { useGameConfigStore } from '../../store/index.js';
import { outcomeSchema, type OutcomeFormData } from '../schemas/index.js';
import type { Outcome } from '../../types/outcome.js';

/**
 * Step 3: 賠率設定（V3 簡化版）
 */
export function OutcomeStep() {
  const { outcomes, addOutcome, updateOutcome, removeOutcome } = useGameConfigStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 計算機率
  const probabilities = useMemo(() => {
    const totalWeight = outcomes.reduce((sum: number, o: Outcome) => sum + o.weight, 0);
    return outcomes.map((outcome: Outcome) => ({
      ...outcome,
      probability: totalWeight > 0 ? (outcome.weight / totalWeight) * 100 : 0,
    }));
  }, [outcomes]);

  // 新增表單
  const addForm = useForm<Omit<OutcomeFormData, 'id'>>({
    resolver: zodResolver(outcomeSchema.omit({ id: true })),
    defaultValues: {
      name: '',
      multiplierRange: { min: 0, max: 0 },
      weight: 100,
    },
  });

  const handleAdd = (data: Omit<OutcomeFormData, 'id'>) => {
    addOutcome(data);
    addForm.reset();
    setShowAddForm(false);
  };

  const handleUpdate = (outcome: Outcome, field: keyof Outcome, value: unknown) => {
    if (field === 'multiplierRange') {
      updateOutcome({ ...outcome, multiplierRange: value as Outcome['multiplierRange'] });
    } else {
      updateOutcome({ ...outcome, [field]: value });
    }
  };

  const handleDelete = (id: string) => {
    if (outcomes.length <= 1) {
      alert('至少需要保留 1 個 Outcome');
      return;
    }
    if (confirm('確定要刪除此 Outcome 嗎？')) {
      removeOutcome(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
            賠率設定
          </h2>
          <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
            定義各種獎項的倍率區間與出現機率
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          + 新增 Outcome
        </button>
      </div>

      {/* Outcome 列表 */}
      <div className="space-y-4">
        {probabilities.map((outcome) => {
          const isEditing = editingId === outcome.id;

          return (
            <div key={outcome.id} className="panel p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                    {outcome.name}
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                    {outcome.probability.toFixed(1)}%
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(isEditing ? null : outcome.id)}
                    className="btn-secondary text-sm py-1 px-2"
                  >
                    {isEditing ? '完成' : '編輯'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(outcome.id)}
                    disabled={outcomes.length <= 1}
                    className="btn-danger text-sm py-1 px-2"
                  >
                    刪除
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                  <TextInput
                    label="名稱"
                    value={outcome.name}
                    onChange={(e) => handleUpdate(outcome, 'name', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                      label="最小倍率"
                      value={outcome.multiplierRange.min}
                      min={0}
                      onChange={(e) =>
                        handleUpdate(outcome, 'multiplierRange', {
                          ...outcome.multiplierRange,
                          min: Number(e.target.value),
                        })
                      }
                    />
                    <NumberInput
                      label="最大倍率"
                      value={outcome.multiplierRange.max}
                      min={0}
                      onChange={(e) =>
                        handleUpdate(outcome, 'multiplierRange', {
                          ...outcome.multiplierRange,
                          max: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <NumberInput
                    label="權重"
                    value={outcome.weight}
                    min={0}
                    hint={`機率: ${outcome.probability.toFixed(1)}%`}
                    onChange={(e) => handleUpdate(outcome, 'weight', Number(e.target.value))}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-surface-500 dark:text-surface-400">倍率區間</span>
                    <p className="font-semibold text-surface-900 dark:text-surface-100">
                      {outcome.multiplierRange.min} ~ {outcome.multiplierRange.max}
                    </p>
                  </div>
                  <div>
                    <span className="text-surface-500 dark:text-surface-400">權重</span>
                    <p className="font-semibold text-surface-900 dark:text-surface-100">
                      {outcome.weight}
                    </p>
                  </div>
                  <div>
                    <span className="text-surface-500 dark:text-surface-400">機率</span>
                    <p className="font-semibold text-accent-success">
                      {outcome.probability.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 機率分佈圖 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
          機率分佈預覽
        </h3>
        <div className="space-y-2">
          {probabilities.map((outcome) => (
            <div key={outcome.id} className="flex items-center gap-3">
              <span className="w-20 text-xs text-surface-600 dark:text-surface-400 truncate">
                {outcome.name}
              </span>
              <div className="flex-1 h-5 bg-surface-200 dark:bg-surface-700 rounded overflow-hidden">
                <div
                  className="h-full transition-all duration-300 bg-primary-500"
                  style={{ width: `${Math.min(outcome.probability * 2, 100)}%` }}
                />
              </div>
              <span className="w-14 text-xs font-semibold text-right text-surface-900 dark:text-surface-100">
                {outcome.probability.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 新增對話框 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="panel p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              新增 Outcome
            </h3>
            <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
              <TextInput
                label="名稱"
                error={addForm.formState.errors.name?.message}
                registration={addForm.register('name')}
              />
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  label="最小倍率"
                  error={addForm.formState.errors.multiplierRange?.min?.message}
                  registration={addForm.register('multiplierRange.min', { valueAsNumber: true })}
                />
                <NumberInput
                  label="最大倍率"
                  error={addForm.formState.errors.multiplierRange?.max?.message}
                  registration={addForm.register('multiplierRange.max', { valueAsNumber: true })}
                />
              </div>
              <NumberInput
                label="權重"
                error={addForm.formState.errors.weight?.message}
                registration={addForm.register('weight', { valueAsNumber: true })}
              />
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    addForm.reset();
                    setShowAddForm(false);
                  }}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-success">
                  確定新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
