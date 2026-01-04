import { useState } from 'react';
import { poolBuilder, spinExecutor } from '../../engine/index.js';
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
      const newSpinPacket = spinExecutor.spin(visual);
      
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

        {/* 模擬次數輸入 */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '4px', 
            fontSize: '14px', 
            color: '#666' 
          }}>
            模擬次數:
          </label>
          <input
            type="number"
            min="1"
            max="100000"
            value={state.simulationCount}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 1 && value <= 100000) {
                dispatch({ type: 'SET_SIMULATION_COUNT', payload: value });
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

        {/* 開始模擬按鈕 */}
        <button
          disabled
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            backgroundColor: '#cccccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'not-allowed',
            fontWeight: 'bold',
            marginBottom: '12px',
          }}
        >
          ▶️ 開始模擬
        </button>

        {/* 提示 */}
        <div style={{ 
          fontSize: '12px', 
          color: '#999',
          fontStyle: 'italic',
        }}>
          提示: Phase 5 實作
        </div>
      </div>
    </div>
  );
}
