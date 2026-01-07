import { useState, useMemo } from 'react';
import { NumberInput } from '../../components/form/index.js';
import { useGameConfigStore } from '../../store/index.js';
import type { SymbolDefinition, SymbolCategory } from '../../types/symbol.js';

/**
 * Step 2: 符號設定
 */
export function SymbolStep() {
  const { symbols, updateSymbol } = useGameConfigStore();
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  // 計算出現率
  const appearanceRates = useMemo(() => {
    const totalWeight = symbols.reduce((sum, s) => sum + s.appearanceWeight, 0);
    const rates: Record<string, number> = {};
    
    if (totalWeight > 0) {
      symbols.forEach((symbol) => {
        rates[symbol.id] = (symbol.appearanceWeight / totalWeight) * 100;
      });
    }
    
    return rates;
  }, [symbols]);

  // 按類別分組
  const symbolsByCategory = useMemo(() => {
    return symbols.reduce((acc, symbol) => {
      if (!acc[symbol.category]) {
        acc[symbol.category] = [];
      }
      acc[symbol.category].push(symbol);
      return acc;
    }, {} as Record<SymbolCategory, SymbolDefinition[]>);
  }, [symbols]);

  const categoryTitles: Record<SymbolCategory, string> = {
    high: '高分符號',
    low: '低分符號',
  };

  const handleUpdatePayout = (
    symbol: SymbolDefinition,
    field: 'match3' | 'match4' | 'match5',
    value: number
  ) => {
    updateSymbol({
      ...symbol,
      payouts: { ...symbol.payouts, [field]: value },
    });
  };

  const handleUpdateWeight = (symbol: SymbolDefinition, value: number) => {
    if (value > 0) {
      updateSymbol({
        ...symbol,
        appearanceWeight: value,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
          符號設定
        </h2>
        <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
          設定各符號的連線賠付與出現權重
        </p>
      </div>

      {/* 符號列表 */}
      <div className="space-y-4">
        {(Object.entries(symbolsByCategory) as [SymbolCategory, SymbolDefinition[]][]).map(
          ([category, categorySymbols]) => (
            <div key={category} className="panel p-4">
              <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 pb-2 border-b border-surface-200 dark:border-surface-700">
                {categoryTitles[category]}
              </h3>

              <div className="space-y-3">
                {categorySymbols.map((symbol) => {
                  const isExpanded = expandedSymbol === symbol.id;
                  const rate = appearanceRates[symbol.id] || 0;

                  return (
                    <div
                      key={symbol.id}
                      className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3"
                    >
                      {/* 符號標題 */}
                      <button
                        type="button"
                        onClick={() => setExpandedSymbol(isExpanded ? null : symbol.id)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                          <div>
                            <span className="font-semibold text-surface-900 dark:text-surface-100">
                              {symbol.id}
                            </span>
                            <span className="ml-2 text-surface-600 dark:text-surface-400">
                              {symbol.name}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-surface-500 dark:text-surface-400">出現率: </span>
                          <span className="font-semibold text-accent-success">
                            {rate.toFixed(1)}%
                          </span>
                        </div>
                      </button>

                      {/* 展開的編輯區 */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-600 space-y-4">
                          {/* 連線賠付 */}
                          <div>
                            <label className="label">連線賠付</label>
                            <div className="grid grid-cols-3 gap-3">
                              <NumberInput
                                label="3 連線"
                                value={symbol.payouts.match3}
                                min={0}
                                onChange={(e) =>
                                  handleUpdatePayout(symbol, 'match3', Number(e.target.value))
                                }
                              />
                              <NumberInput
                                label="4 連線"
                                value={symbol.payouts.match4}
                                min={0}
                                onChange={(e) =>
                                  handleUpdatePayout(symbol, 'match4', Number(e.target.value))
                                }
                              />
                              <NumberInput
                                label="5 連線"
                                value={symbol.payouts.match5}
                                min={0}
                                onChange={(e) =>
                                  handleUpdatePayout(symbol, 'match5', Number(e.target.value))
                                }
                              />
                            </div>
                          </div>

                          {/* 出現權重 */}
                          <div className="flex items-end gap-4">
                            <div className="flex-1">
                              <NumberInput
                                label="出現權重"
                                value={symbol.appearanceWeight}
                                min={1}
                                onChange={(e) =>
                                  handleUpdateWeight(symbol, Number(e.target.value))
                                }
                              />
                            </div>
                            <div className="pb-2">
                              <span className="text-sm text-surface-500 dark:text-surface-400">
                                → 出現率:{' '}
                              </span>
                              <span className="font-semibold text-accent-success">
                                {rate.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>

      {/* 出現率分佈圖 */}
      <div className="panel p-4">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
          出現率分佈
        </h3>
        <div className="space-y-2">
          {symbols.map((symbol) => {
            const rate = appearanceRates[symbol.id] || 0;
            return (
              <div key={symbol.id} className="flex items-center gap-3">
                <span className="w-12 text-xs text-surface-600 dark:text-surface-400">
                  {symbol.id}
                </span>
                <div className="flex-1 h-5 bg-surface-200 dark:bg-surface-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${Math.min(rate * 2, 100)}%` }}
                  />
                </div>
                <span className="w-14 text-xs font-semibold text-right text-surface-900 dark:text-surface-100">
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

