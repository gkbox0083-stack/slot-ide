import { useState, useRef, useEffect } from 'react';
import { poolBuilder, spinExecutor, outcomeManager } from '../../engine/index.js';
import { Simulator, SimulationCharts, exportDetailCSV, exportSummaryCSV, exportCombinedCSV } from '../../analytics/index.js';
import type { SlotMachineRef } from '../../runtime/index.js';
import { useIDE } from '../../store/index.jsx';

/**
 * ControlPanel Props
 */
export interface ControlPanelProps {
  slotMachineRef: React.RefObject<SlotMachineRef>;
}

/**
 * ControlPanel 控制面板
 * 包含 Build Pools / Spin / Simulation 功能
 */
export function ControlPanel({ slotMachineRef }: ControlPanelProps) {
  const { state, dispatch } = useIDE();
  const [poolCap, setPoolCap] = useState<number>(100);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [customCount, setCustomCount] = useState<string>('');
  const [showCharts, setShowCharts] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const simulatorRef = useRef<Simulator | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Build Pools
  const handleBuildPools = () => {
    setBuildError(null);
    
    if (poolCap < 1 || poolCap > 1000) {
      setBuildError('盤池上限必須在 1-1000 之間');
      return;
    }

    try {
      const result = poolBuilder.buildPools(poolCap);
      
      if (result.success) {
        dispatch({ type: 'SET_POOLS_BUILT', payload: { status: result.pools } });
        if (result.errors.length > 0) {
          setBuildError(result.errors.join('; '));
        }
      } else {
        setBuildError(result.errors.join('; ') || '建立盤池失敗');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setBuildError(errorMessage);
    }
  };

  // Spin
  const handleSpin = () => {
    if (!state.isPoolsBuilt) {
      return;
    }

    try {
      const visual = state.visualConfig;
      const assets = Object.keys(state.assets).length > 0 ? state.assets : undefined;
      const newSpinPacket = spinExecutor.spin(visual, assets);
      
      dispatch({ type: 'SET_SPIN_PACKET', payload: newSpinPacket });
      dispatch({ type: 'SET_SPINNING', payload: true });

      // 等待一下讓 SlotMachine 接收新的 spinPacket，然後觸發動畫
      setTimeout(() => {
        if (slotMachineRef.current) {
          slotMachineRef.current.startSpin();
        }
      }, 100);
    } catch (error) {
      // Spin 失敗時靜默處理（未來可加入錯誤提示）
    }
  };

  // Skip
  const handleSkip = () => {
    if (slotMachineRef.current && state.isSpinning) {
      slotMachineRef.current.skip();
    }
  };

  // 獲取上次 Spin 結果
  const lastResult = state.currentSpinPacket?.meta;

  // 模擬次數選擇
  const presetCounts = [100, 1000, 10000];
  const currentCount = state.simulationConfig.count;
  const isPresetSelected = presetCounts.includes(currentCount);

  const handleCountChange = (count: number) => {
    dispatch({ type: 'SET_SIMULATION_COUNT', payload: count });
    setCustomCount('');
  };

  const handleCustomCountChange = (value: string) => {
    setCustomCount(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 10 && num <= 100000) {
      dispatch({ type: 'SET_SIMULATION_COUNT', payload: num });
    }
  };

  // 開始模擬
  const handleStartSimulation = async () => {
    if (!state.isPoolsBuilt || state.isSimulating) return;

    dispatch({ type: 'SET_IS_SIMULATING', payload: true });
    dispatch({ type: 'SET_SIMULATION_PROGRESS', payload: 0 });
    dispatch({ type: 'SET_SIMULATION_RESULT', payload: null });

    const simulator = new Simulator(spinExecutor, outcomeManager);
    simulatorRef.current = simulator;

    try {
      const result = await simulator.runAsync(
        {
          count: state.simulationConfig.count,
          baseBet: state.baseBet,
          visualConfig: state.visualConfig,
        },
        (progress) => {
          dispatch({ type: 'SET_SIMULATION_PROGRESS', payload: progress });
        }
      );

      dispatch({ type: 'SET_SIMULATION_RESULT', payload: result });
    } finally {
      dispatch({ type: 'SET_IS_SIMULATING', payload: false });
      simulatorRef.current = null;
    }
  };

  // 停止模擬
  const handleStopSimulation = () => {
    simulatorRef.current?.abort();
  };

  // 數字格式化函數
  const formatNumber = (n: number): string => {
    return n.toLocaleString();
  };

  const formatPercent = (n: number): string => {
    return n.toFixed(1) + '%';
  };

  const formatDuration = (ms: number): string => {
    return (ms / 1000).toFixed(2) + ' 秒';
  };

  // 關閉匯出選單（點擊外部時）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showExportMenu]);

  // 匯出處理
  const handleExport = (type: 'detail' | 'summary' | 'combined') => {
    if (!state.simulationResult) return;
    
    setShowExportMenu(false);
    
    switch (type) {
      case 'detail':
        exportDetailCSV(state.simulationResult);
        break;
      case 'summary':
        exportSummaryCSV(state.simulationResult);
        break;
      case 'combined':
        exportCombinedCSV(state.simulationResult);
        break;
    }
  };

  // 進度條渲染
  const renderProgressBar = () => {
    if (!state.isSimulating && state.simulationProgress === 0) return null;

    const progress = state.simulationProgress;
    const current = Math.round(progress * state.simulationConfig.count);
    const total = state.simulationConfig.count;
    const percent = Math.round(progress * 100);

    return (
      <div style={{
        padding: '12px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        marginBottom: '12px',
      }}>
        <div style={{
          fontSize: '13px',
          marginBottom: '8px',
          color: '#666',
        }}>
          進度: {percent}% ({formatNumber(current)}/{formatNumber(total)})
        </div>
        <div style={{
          width: '100%',
          height: '20px',
          backgroundColor: '#e0e0e0',
          borderRadius: '10px',
          overflow: 'hidden',
          display: 'flex',
        }}>
          <div style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: '#3498db',
            transition: 'width 0.1s ease',
          }} />
        </div>
      </div>
    );
  };

  // 統計結果渲染
  const renderStatistics = () => {
    if (!state.simulationResult) return null;

    const stats = state.simulationResult.statistics;
    const duration = state.simulationResult.duration;

    return (
      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '2px solid #ddd',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <h4 style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333',
          }}>
            📈 統計結果
          </h4>
          <span style={{
            fontSize: '12px',
            color: '#666',
          }}>
            耗時: {formatDuration(duration)}
          </span>
        </div>

        {/* 主要指標 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '16px',
        }}>
          <div style={{
            padding: '12px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '11px',
              color: '#666',
              marginBottom: '4px',
            }}>
              RTP
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#2ecc71',
            }}>
              {formatPercent(stats.rtp)}
            </div>
          </div>
          <div style={{
            padding: '12px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '11px',
              color: '#666',
              marginBottom: '4px',
            }}>
              Hit Rate
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#3498db',
            }}>
              {formatPercent(stats.hitRate)}
            </div>
          </div>
          <div style={{
            padding: '12px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '11px',
              color: '#666',
              marginBottom: '4px',
            }}>
              Avg Win
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#e74c3c',
            }}>
              {formatNumber(stats.avgWin)}
            </div>
          </div>
        </div>

        {/* 詳細數據 */}
        <div style={{
          padding: '12px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginBottom: '12px',
          fontSize: '13px',
        }}>
          <div style={{ marginBottom: '4px' }}>
            Total Spins: {formatNumber(stats.totalSpins)}
          </div>
          <div style={{ marginBottom: '4px' }}>
            Total Bet: {formatNumber(stats.totalBet)}
          </div>
          <div style={{ marginBottom: '8px' }}>
            Total Win: {formatNumber(stats.totalWin)}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #eee',
          }}>
            <div>
              Max Win: {formatNumber(stats.maxWin)}
            </div>
            <div>
              Min Win: {formatNumber(stats.minWin)}
            </div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
          }}>
            <div>
              Max Profit: {stats.maxProfit >= 0 ? '+' : ''}{formatNumber(stats.maxProfit)}
            </div>
            <div>
              Min Profit: {formatNumber(stats.minProfit)}
            </div>
          </div>
        </div>

        {/* Outcome 分佈 */}
        <div style={{
          padding: '12px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '13px',
        }}>
          <div style={{
            marginBottom: '12px',
            fontWeight: 'bold',
            fontSize: '12px',
            color: '#666',
          }}>
            ┌─ Outcome 分佈 ─────────────────────────────────┐
          </div>
          {stats.outcomeDistribution.map((dist) => {
            const barLength = Math.round(dist.percentage / 5);
            const bar = '█'.repeat(barLength);
            return (
              <div key={dist.outcomeId} style={{
                marginBottom: '12px',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {dist.outcomeName}
                  </span>
                  <span style={{ color: '#666' }}>
                    {formatNumber(dist.count)} ({formatPercent(dist.percentage)})
                  </span>
                </div>
                <div style={{
                  marginBottom: '2px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}>
                  {bar}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#999',
                }}>
                  預期 {formatPercent(dist.expectedPercentage)}
                </div>
              </div>
            );
          })}
          <div style={{
            marginTop: '12px',
            fontSize: '12px',
            color: '#666',
          }}>
            └────────────────────────────────────────────────┘
          </div>
        </div>

        {/* 功能按鈕 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '12px',
        }}>
          <button
            onClick={() => setShowCharts(true)}
            disabled={!state.simulationResult}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '12px',
              backgroundColor: state.simulationResult ? '#3498db' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: state.simulationResult ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            📊 顯示圖表
          </button>
          <div style={{ position: 'relative', display: 'inline-block', flex: 1 }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!state.simulationResult}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                backgroundColor: state.simulationResult ? '#2ecc71' : '#cccccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: state.simulationResult ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              📁 匯出 CSV ▼
            </button>
            
            {showExportMenu && state.simulationResult && (
              <div
                ref={exportMenuRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => handleExport('detail')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '12px',
                    backgroundColor: '#fff',
                    color: '#333',
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }}
                >
                  📋 詳細報表
                </button>
                <button
                  onClick={() => handleExport('summary')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '12px',
                    backgroundColor: '#fff',
                    color: '#333',
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }}
                >
                  📊 摘要報表
                </button>
                <button
                  onClick={() => handleExport('combined')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '12px',
                    backgroundColor: '#fff',
                    color: '#333',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }}
                >
                  📑 完整報表
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 盤池管理區塊 */}
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
          🏊 盤池管理
        </h3>

        {/* 盤池上限輸入 */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '4px', 
            fontSize: '14px', 
            color: '#666' 
          }}>
            盤池上限:
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={poolCap}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 1 && value <= 1000) {
                setPoolCap(value);
              }
            }}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        {/* Build Pools 按鈕 */}
        <button
          onClick={handleBuildPools}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '12px',
          }}
        >
          🔨 Build Pools
        </button>

        {/* 狀態顯示 */}
        <div style={{ 
          marginBottom: '12px', 
          fontSize: '14px',
          fontWeight: state.isPoolsBuilt ? 'bold' : 'normal',
          color: state.isPoolsBuilt ? '#2ecc71' : '#e74c3c',
        }}>
          狀態: {state.isPoolsBuilt ? '✅ 已建立' : '❌ 未建立'}
        </div>

        {/* 錯誤訊息 */}
        {buildError && (
          <div style={{
            marginBottom: '12px',
            padding: '8px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#c33',
          }}>
            ⚠️ {buildError}
          </div>
        )}

        {/* 盤池詳情 */}
        {state.isPoolsBuilt && state.poolStatus.length > 0 && (
          <div style={{
            padding: '12px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '13px',
          }}>
            <div style={{ 
              marginBottom: '8px', 
              fontWeight: 'bold',
              fontSize: '12px',
              color: '#666',
            }}>
              ┌─ 盤池詳情 ──────────────────────┐
            </div>
            {state.poolStatus.map((pool) => (
              <div 
                key={pool.outcomeId}
                style={{ 
                  marginBottom: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{pool.outcomeName}:</span>
                <span style={{ 
                  fontWeight: 'bold',
                  color: pool.isFull ? '#2ecc71' : '#f39c12',
                }}>
                  {pool.generated}/{pool.cap} {pool.isFull ? '✅' : '⚠️'}
                </span>
              </div>
            ))}
            <div style={{ 
              marginTop: '8px',
              fontSize: '12px',
              color: '#666',
            }}>
              └─────────────────────────────────┘
            </div>
          </div>
        )}
      </div>

      {/* 單次 Spin 區塊 */}
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
          🎰 單次 Spin
        </h3>

        {/* 按鈕組 */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '16px' 
        }}>
          <button
            onClick={handleSpin}
            disabled={!state.isPoolsBuilt || state.isSpinning}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '14px',
              backgroundColor: (state.isPoolsBuilt && !state.isSpinning) ? '#2ecc71' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (state.isPoolsBuilt && !state.isSpinning) ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            {state.isSpinning ? '🎰 動畫進行中...' : '🎰 Spin'}
          </button>
          <button
            onClick={handleSkip}
            disabled={!state.isSpinning}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '14px',
              backgroundColor: state.isSpinning ? '#ff9800' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: state.isSpinning ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            ⏭️ 跳過
          </button>
        </div>

        {/* 上次結果 */}
        {lastResult && (
          <div style={{
            padding: '12px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '13px',
          }}>
            <div style={{ 
              marginBottom: '8px', 
              fontWeight: 'bold',
              fontSize: '12px',
              color: '#666',
            }}>
              上次結果:
            </div>
            <div style={{ marginBottom: '4px' }}>
              • Outcome: {lastResult.outcomeId || 'N/A'}
            </div>
            <div style={{ marginBottom: '4px' }}>
              • 獲勝: {lastResult.win || 0}
            </div>
            <div>
              • 中獎線: {lastResult.winningLines?.length || 0} 條
            </div>
          </div>
        )}
      </div>

      {/* 批次模擬區塊 */}
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
          📊 批次模擬
        </h3>

        {/* 模擬次數選擇 */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontSize: '14px', 
            color: '#666' 
          }}>
            模擬次數:
          </label>
          
          {/* 預設選項 */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '8px',
          }}>
            {presetCounts.map((count) => (
              <button
                key={count}
                onClick={() => handleCountChange(count)}
                disabled={state.isSimulating}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '13px',
                  backgroundColor: (currentCount === count && isPresetSelected) ? '#3498db' : 'white',
                  color: (currentCount === count && isPresetSelected) ? 'white' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: state.isSimulating ? 'not-allowed' : 'pointer',
                  fontWeight: (currentCount === count && isPresetSelected) ? 'bold' : 'normal',
                  opacity: state.isSimulating ? 0.6 : 1,
                }}
              >
                {formatNumber(count)}
              </button>
            ))}
          </div>

          {/* 自訂輸入 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{
              fontSize: '13px',
              color: '#666',
              whiteSpace: 'nowrap',
            }}>
              自訂:
            </span>
            <input
              type="number"
              min="10"
              max="100000"
              value={customCount || (isPresetSelected ? '' : currentCount.toString())}
              onChange={(e) => handleCustomCountChange(e.target.value)}
              disabled={state.isSimulating}
              placeholder="10-100000"
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '13px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                opacity: state.isSimulating ? 0.6 : 1,
              }}
            />
          </div>
        </div>

        {/* 按鈕組 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
        }}>
          <button
            onClick={handleStartSimulation}
            disabled={!state.isPoolsBuilt || state.isSimulating}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '14px',
              backgroundColor: (state.isPoolsBuilt && !state.isSimulating) ? '#2ecc71' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (state.isPoolsBuilt && !state.isSimulating) ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            ▶️ 開始模擬
          </button>
          <button
            onClick={handleStopSimulation}
            disabled={!state.isSimulating}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '14px',
              backgroundColor: state.isSimulating ? '#e74c3c' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: state.isSimulating ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            ⏹️ 停止
          </button>
        </div>

        {/* 進度條 */}
        {renderProgressBar()}

        {/* 統計結果 */}
        {renderStatistics()}
      </div>

      {/* 圖表彈出視窗 */}
      {showCharts && state.simulationResult && (
        <>
          {/* 背景遮罩 */}
          <div
            onClick={() => setShowCharts(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
          />
          {/* 圖表元件 */}
          <SimulationCharts
            result={state.simulationResult}
            baseBet={state.baseBet}
            onClose={() => setShowCharts(false)}
          />
        </>
      )}
    </div>
  );
}
