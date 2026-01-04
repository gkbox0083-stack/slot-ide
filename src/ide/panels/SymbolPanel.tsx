import { useState, useEffect } from 'react';
import { symbolManager } from '../../engine/index.js';
import type { SymbolDefinition } from '../../types/symbol.js';

/**
 * SymbolPanel Symbol 設定面板
 */
export function SymbolPanel() {
  const [symbols, setSymbols] = useState<SymbolDefinition[]>([]);
  const [appearanceRates, setAppearanceRates] = useState<Record<string, number>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // 載入 Symbols
  const loadSymbols = () => {
    const allSymbols = symbolManager.getAll();
    setSymbols(allSymbols);
    calculateAppearanceRates(allSymbols);
  };

  // 計算出現率
  const calculateAppearanceRates = (symbolList: SymbolDefinition[]) => {
    const totalWeight = symbolList.reduce((sum, s) => sum + s.appearanceWeight, 0);
    const rates: Record<string, number> = {};

    if (totalWeight > 0) {
      symbolList.forEach((symbol) => {
        rates[symbol.id] = (symbol.appearanceWeight / totalWeight) * 100;
      });
    } else {
      symbolList.forEach((symbol) => {
        rates[symbol.id] = 0;
      });
    }

    setAppearanceRates(rates);
  };

  useEffect(() => {
    loadSymbols();
  }, []);

  // 驗證 Symbol
  const validateSymbol = (symbol: SymbolDefinition): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (symbol.payouts.match3 < 0) {
      errors.match3 = '分數必須 ≥ 0';
    }
    if (symbol.payouts.match4 < 0) {
      errors.match4 = '分數必須 ≥ 0';
    }
    if (symbol.payouts.match5 < 0) {
      errors.match5 = '分數必須 ≥ 0';
    }
    if (symbol.payouts.match3 > symbol.payouts.match4) {
      errors.match4 = '4連線分數必須 ≥ 3連線分數';
    }
    if (symbol.payouts.match4 > symbol.payouts.match5) {
      errors.match5 = '5連線分數必須 ≥ 4連線分數';
    }
    if (symbol.appearanceWeight <= 0) {
      errors.weight = '權重必須 > 0';
    }

    return errors;
  };

  // 更新 Symbol
  const handleUpdate = (symbol: SymbolDefinition, field: string, value: number) => {
    const updated: SymbolDefinition = { ...symbol };

    if (field === 'match3') {
      updated.payouts = { ...updated.payouts, match3: value };
    } else if (field === 'match4') {
      updated.payouts = { ...updated.payouts, match4: value };
    } else if (field === 'match5') {
      updated.payouts = { ...updated.payouts, match5: value };
    } else if (field === 'weight') {
      updated.appearanceWeight = value;
    }

    const errors = validateSymbol(updated);
    const errorKey = `${symbol.id}_${field}`;
    
    if (Object.keys(errors).length > 0) {
      const fieldError = errors[field] || errors.match3 || errors.match4 || errors.match5;
      if (fieldError) {
        setValidationErrors({ ...validationErrors, [errorKey]: fieldError });
      }
      return;
    }

    // 清除該欄位的錯誤
    const newErrors = { ...validationErrors };
    delete newErrors[errorKey];
    setValidationErrors(newErrors);

    const success = symbolManager.update(updated);
    if (success) {
      setHasChanges(true);
      loadSymbols();
    }
  };

  // 按類別分組
  const symbolsByCategory = symbols.reduce((acc, symbol) => {
    if (!acc[symbol.category]) {
      acc[symbol.category] = [];
    }
    acc[symbol.category].push(symbol);
    return acc;
  }, {} as Record<string, SymbolDefinition[]>);

  // 類別標題
  const categoryTitles: Record<string, string> = {
    high: '高分符號',
    low: '低分符號',
    special: '特殊符號',
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
        🎨 Symbol 設定
      </h3>

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

      {/* Symbol 列表（按類別分組） */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
        {Object.entries(symbolsByCategory).map(([category, categorySymbols]) => (
          <div
            key={category}
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
            }}>
              ┌─ {categoryTitles[category] || category} ───────────────────────────────────────────┐
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categorySymbols.map((symbol) => {
                const appearanceRate = appearanceRates[symbol.id] || 0;
                const symbolErrors = Object.keys(validationErrors)
                  .filter(key => key.startsWith(`${symbol.id}_`))
                  .reduce((acc, key) => {
                    acc[key.replace(`${symbol.id}_`, '')] = validationErrors[key];
                    return acc;
                  }, {} as Record<string, string>);

                return (
                  <div
                    key={symbol.id}
                    style={{
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{
                      marginBottom: '12px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                    }}>
                      ┌─ {symbol.id} {symbol.name} ─────────────────────────────────────────┐
                    </div>

                    {/* 分數設定 */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}>
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '4px',
                            fontSize: '12px',
                            color: '#666',
                          }}>
                            3連線:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={symbol.payouts.match3}
                            onChange={(e) => handleUpdate(symbol, 'match3', parseFloat(e.target.value) || 0)}
                            style={{
                              width: '100%',
                              padding: '6px',
                              fontSize: '12px',
                              border: symbolErrors.match3 ? '1px solid #e74c3c' : '1px solid #ddd',
                              borderRadius: '4px',
                            }}
                          />
                          {symbolErrors.match3 && (
                            <div style={{ fontSize: '10px', color: '#e74c3c', marginTop: '2px' }}>
                              {symbolErrors.match3}
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '4px',
                            fontSize: '12px',
                            color: '#666',
                          }}>
                            4連線:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={symbol.payouts.match4}
                            onChange={(e) => handleUpdate(symbol, 'match4', parseFloat(e.target.value) || 0)}
                            style={{
                              width: '100%',
                              padding: '6px',
                              fontSize: '12px',
                              border: symbolErrors.match4 ? '1px solid #e74c3c' : '1px solid #ddd',
                              borderRadius: '4px',
                            }}
                          />
                          {symbolErrors.match4 && (
                            <div style={{ fontSize: '10px', color: '#e74c3c', marginTop: '2px' }}>
                              {symbolErrors.match4}
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '4px',
                            fontSize: '12px',
                            color: '#666',
                          }}>
                            5連線:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={symbol.payouts.match5}
                            onChange={(e) => handleUpdate(symbol, 'match5', parseFloat(e.target.value) || 0)}
                            style={{
                              width: '100%',
                              padding: '6px',
                              fontSize: '12px',
                              border: symbolErrors.match5 ? '1px solid #e74c3c' : '1px solid #ddd',
                              borderRadius: '4px',
                            }}
                          />
                          {symbolErrors.match5 && (
                            <div style={{ fontSize: '10px', color: '#e74c3c', marginTop: '2px' }}>
                              {symbolErrors.match5}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 出現權重 */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '12px',
                        color: '#666',
                      }}>
                        出現權重:
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          min="1"
                          value={symbol.appearanceWeight}
                          onChange={(e) => handleUpdate(symbol, 'weight', parseFloat(e.target.value) || 1)}
                          style={{
                            flex: 1,
                            padding: '6px',
                            fontSize: '12px',
                            border: symbolErrors.weight ? '1px solid #e74c3c' : '1px solid #ddd',
                            borderRadius: '4px',
                          }}
                        />
                        <span style={{ fontSize: '12px', color: '#666' }}>→</span>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#2ecc71',
                          minWidth: '100px',
                        }}>
                          出現率: {appearanceRate.toFixed(1)}%
                        </span>
                      </div>
                      {symbolErrors.weight && (
                        <div style={{ fontSize: '10px', color: '#e74c3c', marginTop: '2px' }}>
                          {symbolErrors.weight}
                        </div>
                      )}
                    </div>

                    <div style={{
                      marginTop: '12px',
                      fontSize: '12px',
                      color: '#666',
                    }}>
                      └─────────────────────────────────────────────────────┘
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: '12px',
              fontSize: '12px',
              color: '#666',
            }}>
              └──────────────────────────────────────────────────────────┘
            </div>
          </div>
        ))}
      </div>

      {/* 出現率分佈預覽 */}
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
          📊 出現率分佈
        </h4>
        <div style={{
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          {symbols.map((symbol) => {
            const rate = appearanceRates[symbol.id] || 0;
            const barWidth = Math.max(rate * 2, 2); // 最小寬度 2px，每 1% = 2px
            return (
              <div
                key={symbol.id}
                style={{
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ minWidth: '60px', fontSize: '12px' }}>{symbol.id}</span>
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
                  minWidth: '50px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textAlign: 'right',
                }}>
                  {rate.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
