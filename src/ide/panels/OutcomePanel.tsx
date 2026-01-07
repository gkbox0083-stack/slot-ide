import { useState, useEffect } from 'react';
import { outcomeManager } from '../../engine/index.js';
import type { Outcome } from '../../types/outcome.js';

/**
 * 新增 Outcome 表單資料
 */
interface NewOutcomeForm {
  name: string;
  minMultiplier: number;
  maxMultiplier: number;
  weight: number;
}

/**
 * OutcomePanel Outcome 設定面板
 */
export function OutcomePanel() {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [probabilities, setProbabilities] = useState<{ id: string; name: string; probability: number }[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOutcome, setNewOutcome] = useState<NewOutcomeForm>({
    name: '',
    minMultiplier: 0,
    maxMultiplier: 0,
    weight: 100,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // 載入 Outcomes
  const loadOutcomes = () => {
    const allOutcomes = outcomeManager.getAll();
    const allProbabilities = outcomeManager.getAllProbabilities();
    setOutcomes(allOutcomes);
    setProbabilities(allProbabilities);
  };

  useEffect(() => {
    loadOutcomes();
  }, []);

  // 驗證 Outcome
  const validateOutcome = (outcome: Partial<Outcome> | NewOutcomeForm): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!outcome.name || outcome.name.trim() === '') {
      errors.name = '名稱不可為空';
    }

    const min = 'multiplierRange' in outcome ? outcome.multiplierRange?.min : 'minMultiplier' in outcome ? outcome.minMultiplier : undefined;
    const max = 'multiplierRange' in outcome ? outcome.multiplierRange?.max : 'maxMultiplier' in outcome ? outcome.maxMultiplier : undefined;

    if (min === undefined || min < 0) {
      errors.minMultiplier = '最小倍率必須 ≥ 0';
    }

    if (max === undefined || max < 0) {
      errors.maxMultiplier = '最大倍率必須 ≥ 0';
    }

    if (min !== undefined && max !== undefined && min > max) {
      errors.maxMultiplier = '最大倍率必須 ≥ 最小倍率';
    }

    const weight = 'weight' in outcome ? outcome.weight : undefined;
    if (weight === undefined || weight < 0) {
      errors.weight = '權重必須 ≥ 0';
    }

    return errors;
  };

  // 更新 Outcome
  const handleUpdate = (outcome: Outcome, field: string, value: string | number) => {
    const updated: Outcome = { ...outcome };

    if (field === 'name') {
      updated.name = value as string;
    } else if (field === 'minMultiplier') {
      updated.multiplierRange = {
        ...updated.multiplierRange,
        min: value as number,
      };
    } else if (field === 'maxMultiplier') {
      updated.multiplierRange = {
        ...updated.multiplierRange,
        max: value as number,
      };
    } else if (field === 'weight') {
      updated.weight = value as number;
    }

    const errors = validateOutcome(updated);
    if (Object.keys(errors).length > 0) {
      setValidationErrors({ ...validationErrors, [`${outcome.id}_${field}`]: Object.values(errors)[0] });
      return;
    }

    setValidationErrors({});
    const success = outcomeManager.update(updated);
    if (success) {
      setHasChanges(true);
      loadOutcomes();
    }
  };

  // 刪除 Outcome
  const handleDelete = (id: string) => {
    if (outcomes.length <= 1) {
      alert('至少需要保留 1 個 Outcome');
      return;
    }

    if (confirm('確定要刪除此 Outcome 嗎？')) {
      const success = outcomeManager.remove(id);
      if (success) {
        setHasChanges(true);
        loadOutcomes();
      }
    }
  };

  // 新增 Outcome
  const handleAdd = () => {
    const errors = validateOutcome(newOutcome);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    outcomeManager.add({
      name: newOutcome.name,
      multiplierRange: {
        min: newOutcome.minMultiplier,
        max: newOutcome.maxMultiplier,
      },
      weight: newOutcome.weight,
      phase: 'ng', // 預設為 Normal Game
    });

    setHasChanges(true);
    setShowAddForm(false);
    setNewOutcome({
      name: '',
      minMultiplier: 0,
      maxMultiplier: 0,
      weight: 100,
    });
    loadOutcomes();
  };

  // 取消新增
  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewOutcome({
      name: '',
      minMultiplier: 0,
      maxMultiplier: 0,
      weight: 100,
    });
    setValidationErrors({});
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
      border: '1px solid #ddd',
    }}>
      {/* 標題與新增按鈕 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          🎯 Outcome 設定
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          + 新增
        </button>
      </div>

      {/* 修改提示 */}
      {hasChanges && (
        <div style={{
          marginBottom: '16px',
          padding: '8px 12px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          fontSize: '13px',
          color: '#856404',
        }}>
          ⚠️ 修改後需重新 Build Pools
        </div>
      )}

      {/* Outcome 列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {outcomes.map((outcome) => {
          const probability = probabilities.find(p => p.id === outcome.id)?.probability || 0;
          const outcomeErrors = Object.keys(validationErrors)
            .filter(key => key.startsWith(`${outcome.id}_`))
            .reduce((acc, key) => {
              acc[key.replace(`${outcome.id}_`, '')] = validationErrors[key];
              return acc;
            }, {} as Record<string, string>);

          return (
            <div
              key={outcome.id}
              style={{
                padding: '16px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <div style={{
                marginBottom: '12px',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>┌─ {outcome.name} ─────────────────────────────────────────┐</span>
                <button
                  onClick={() => handleDelete(outcome.id)}
                  disabled={outcomes.length <= 1}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: outcomes.length <= 1 ? '#cccccc' : '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: outcomes.length <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  🗑️ 刪除
                </button>
              </div>

              {/* 名稱 */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '13px',
                  color: '#666',
                }}>
                  名稱:
                </label>
                <input
                  type="text"
                  value={outcome.name}
                  onChange={(e) => handleUpdate(outcome, 'name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '13px',
                    border: outcomeErrors.name ? '1px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
                {outcomeErrors.name && (
                  <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '4px' }}>
                    {outcomeErrors.name}
                  </div>
                )}
              </div>

              {/* 倍率區間 */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '13px',
                  color: '#666',
                }}>
                  倍率區間:
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    value={outcome.multiplierRange.min}
                    onChange={(e) => handleUpdate(outcome, 'minMultiplier', parseFloat(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '13px',
                      border: outcomeErrors.minMultiplier ? '1px solid #e74c3c' : '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                  <span style={{ fontSize: '13px', color: '#666' }}>~</span>
                  <input
                    type="number"
                    min="0"
                    value={outcome.multiplierRange.max}
                    onChange={(e) => handleUpdate(outcome, 'maxMultiplier', parseFloat(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '13px',
                      border: outcomeErrors.maxMultiplier ? '1px solid #e74c3c' : '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                {(outcomeErrors.minMultiplier || outcomeErrors.maxMultiplier) && (
                  <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '4px' }}>
                    {outcomeErrors.minMultiplier || outcomeErrors.maxMultiplier}
                  </div>
                )}
              </div>

              {/* 權重與機率 */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '13px',
                  color: '#666',
                }}>
                  權重:
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    value={outcome.weight}
                    onChange={(e) => handleUpdate(outcome, 'weight', parseFloat(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '13px',
                      border: outcomeErrors.weight ? '1px solid #e74c3c' : '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                  <span style={{ fontSize: '13px', color: '#666' }}>→</span>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#2ecc71',
                    minWidth: '80px',
                  }}>
                    機率: {probability.toFixed(1)}%
                  </span>
                </div>
                {outcomeErrors.weight && (
                  <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '4px' }}>
                    {outcomeErrors.weight}
                  </div>
                )}
              </div>

              <div style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#666',
              }}>
                └─────────────────────────────────────────────────┘
              </div>
            </div>
          );
        })}
      </div>

      {/* 機率分佈預覽 */}
      <div style={{
        padding: '16px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        marginBottom: '16px',
      }}>
        <h4 style={{
          marginTop: 0,
          marginBottom: '12px',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          📊 機率分佈預覽
        </h4>
        <div style={{
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          {probabilities.map((prob) => {
            const barWidth = Math.max(prob.probability * 2, 2); // 最小寬度 2px，每 1% = 2px
            return (
              <div
                key={prob.id}
                style={{
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ minWidth: '60px', fontSize: '12px' }}>{prob.name}</span>
                <div style={{
                  flex: 1,
                  height: '20px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '2px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div
                    style={{
                      width: `${barWidth}px`,
                      height: '100%',
                      backgroundColor: '#3498db',
                      borderRadius: '2px',
                    }}
                  />
                </div>
                <span style={{
                  minWidth: '40px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textAlign: 'right',
                }}>
                  {prob.probability.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 新增 Outcome 對話框 */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={handleCancelAdd}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              minWidth: '400px',
              maxWidth: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              marginTop: 0,
              marginBottom: '20px',
              fontSize: '18px',
              fontWeight: 'bold',
            }}>
              新增 Outcome
            </h3>

            {/* 名稱 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                color: '#666',
              }}>
                名稱:
              </label>
              <input
                type="text"
                value={newOutcome.name}
                onChange={(e) => setNewOutcome({ ...newOutcome, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: validationErrors.name ? '1px solid #e74c3c' : '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              {validationErrors.name && (
                <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '4px' }}>
                  {validationErrors.name}
                </div>
              )}
            </div>

            {/* 最小倍率 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                color: '#666',
              }}>
                最小倍率:
              </label>
              <input
                type="number"
                min="0"
                value={newOutcome.minMultiplier}
                onChange={(e) => setNewOutcome({ ...newOutcome, minMultiplier: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: validationErrors.minMultiplier ? '1px solid #e74c3c' : '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              {validationErrors.minMultiplier && (
                <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '4px' }}>
                  {validationErrors.minMultiplier}
                </div>
              )}
            </div>

            {/* 最大倍率 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                color: '#666',
              }}>
                最大倍率:
              </label>
              <input
                type="number"
                min="0"
                value={newOutcome.maxMultiplier}
                onChange={(e) => setNewOutcome({ ...newOutcome, maxMultiplier: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: validationErrors.maxMultiplier ? '1px solid #e74c3c' : '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              {validationErrors.maxMultiplier && (
                <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '4px' }}>
                  {validationErrors.maxMultiplier}
                </div>
              )}
            </div>

            {/* 權重 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                color: '#666',
              }}>
                權重:
              </label>
              <input
                type="number"
                min="0"
                value={newOutcome.weight}
                onChange={(e) => setNewOutcome({ ...newOutcome, weight: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: validationErrors.weight ? '1px solid #e74c3c' : '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              {validationErrors.weight && (
                <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '4px' }}>
                  {validationErrors.weight}
                </div>
              )}
            </div>

            {/* 按鈕 */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={handleCancelAdd}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                確定新增
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
