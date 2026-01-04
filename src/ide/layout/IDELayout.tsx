import { useState, useRef, useMemo } from 'react';
import { SlotMachine } from '../../runtime/index.js';
import type { SlotMachineRef } from '../../runtime/index.js';
import type { SpinPacket } from '../../types/spin-packet.js';
import { useIDE } from '../../store/index.jsx';
import { ControlPanel } from '../panels/ControlPanel.js';
import { OutcomePanel } from '../panels/OutcomePanel.js';
import { SymbolPanel } from '../panels/SymbolPanel.js';
import { LinesPanel } from '../panels/LinesPanel.js';
import { AnimationPanel } from '../panels/AnimationPanel.js';
import { LayoutPanel } from '../panels/LayoutPanel.js';
import { GameParamsPanel } from '../panels/GameParamsPanel.js';

type TabType = 'math' | 'visual' | 'control';

/**
 * IDE 主佈局
 */
export function IDELayout() {
  const { state, dispatch } = useIDE();
  const [activeTab, setActiveTab] = useState<TabType>(state.activeTab);
  const slotMachineRef = useRef<SlotMachineRef>(null);

  // 同步 visualConfig 到 currentSpinPacket（讓 layout 變化即時反映）
  const displaySpinPacket = useMemo<SpinPacket | undefined>(() => {
    if (!state.currentSpinPacket) {
      return undefined;
    }
    // 如果 visualConfig 與 spinPacket.visual 不同，更新 visual
    if (JSON.stringify(state.currentSpinPacket.visual) !== JSON.stringify(state.visualConfig)) {
      return {
        ...state.currentSpinPacket,
        visual: state.visualConfig,
      };
    }
    return state.currentSpinPacket;
  }, [state.currentSpinPacket, state.visualConfig]);

  // 同步 store 的 activeTab
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  // 渲染當前面板
  const renderActivePanel = () => {
    if (activeTab === 'math') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
          <GameParamsPanel />
          <OutcomePanel />
          <SymbolPanel />
          <LinesPanel />
        </div>
      );
    } else if (activeTab === 'visual') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
          <AnimationPanel />
          <LayoutPanel />
        </div>
      );
    } else {
      return (
        <div style={{ padding: '20px' }}>
          <ControlPanel slotMachineRef={slotMachineRef} />
        </div>
      );
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: '#2c3e50',
        color: 'white',
        fontSize: '20px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        slot-ide
      </div>

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
      }}>
        {/* Left: SlotMachine (Runtime) */}
        <div style={{
          width: '60%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1a1a1a',
          padding: '20px',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <SlotMachine
            ref={slotMachineRef}
            spinPacket={displaySpinPacket}
            onSpinComplete={() => {
              dispatch({ type: 'SET_SPINNING', payload: false });
            }}
            onSkip={() => {
              dispatch({ type: 'SET_SPINNING', payload: false });
            }}
          />
        </div>

        {/* Right: Panel Area */}
        <div style={{
          width: '40%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
          borderLeft: '1px solid #ddd',
        }}>
          {/* Tab Buttons */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #ddd',
            backgroundColor: '#f8f9fa',
          }}>
            <button
              onClick={() => handleTabChange('math')}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                backgroundColor: activeTab === 'math' ? 'white' : 'transparent',
                borderBottom: activeTab === 'math' ? '2px solid #3498db' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'math' ? 'bold' : 'normal',
                color: activeTab === 'math' ? '#3498db' : '#666',
              }}
            >
              數學
            </button>
            <button
              onClick={() => handleTabChange('visual')}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                backgroundColor: activeTab === 'visual' ? 'white' : 'transparent',
                borderBottom: activeTab === 'visual' ? '2px solid #3498db' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'visual' ? 'bold' : 'normal',
                color: activeTab === 'visual' ? '#3498db' : '#666',
              }}
            >
              視覺
            </button>
            <button
              onClick={() => handleTabChange('control')}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                backgroundColor: activeTab === 'control' ? 'white' : 'transparent',
                borderBottom: activeTab === 'control' ? '2px solid #3498db' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'control' ? 'bold' : 'normal',
                color: activeTab === 'control' ? '#3498db' : '#666',
              }}
            >
              控制
            </button>
          </div>

          {/* Panel Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
          }}>
            {renderActivePanel()}
          </div>
        </div>
      </div>
    </div>
  );
}

