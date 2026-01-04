import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { SpinPacket, VisualConfig, AssetsPatch } from '../types/index.js';
import type { PoolStatus } from '../engine/pool-builder.js';
import type { SimulationResult } from '../analytics/index.js';

/**
 * IDE 全域狀態
 */
export interface IDEState {
  // === 盤池狀態 ===
  isPoolsBuilt: boolean;
  poolStatus: PoolStatus[];
  
  // === Spin 狀態 ===
  currentSpinPacket: SpinPacket | null;
  isSpinning: boolean;
  
  // === UI 狀態 ===
  activeTab: 'math' | 'visual' | 'control';
  
  // === 遊戲參數 ===
  baseBet: number;
  simulationCount: number;
  
  // === Simulation 狀態 ===
  simulationConfig: {
    count: number;  // 預設 1000
  };
  simulationResult: SimulationResult | null;
  isSimulating: boolean;
  simulationProgress: number;  // 0-1
  
  // === 視覺參數 ===
  visualConfig: VisualConfig;
  
  // === 素材 ===
  assets: AssetsPatch;
}

/**
 * Action Types
 */
export type IDEAction =
  | { type: 'SET_POOLS_BUILT'; payload: { status: PoolStatus[] } }
  | { type: 'SET_SPIN_PACKET'; payload: SpinPacket | null }
  | { type: 'SET_SPINNING'; payload: boolean }
  | { type: 'SET_ACTIVE_TAB'; payload: 'math' | 'visual' | 'control' }
  | { type: 'SET_BASE_BET'; payload: number }
  | { type: 'SET_SIMULATION_COUNT'; payload: number }
  | { type: 'SET_SIMULATION_RESULT'; payload: SimulationResult | null }
  | { type: 'SET_IS_SIMULATING'; payload: boolean }
  | { type: 'SET_SIMULATION_PROGRESS'; payload: number }
  | { type: 'RESET_SIMULATION' }
  | { type: 'SET_VISUAL_CONFIG'; payload: VisualConfig }
  | { type: 'SET_ASSETS'; payload: AssetsPatch };

/**
 * 初始狀態
 */
const initialState: IDEState = {
  // 盤池狀態
  isPoolsBuilt: false,
  poolStatus: [],
  
  // Spin 狀態
  currentSpinPacket: null,
  isSpinning: false,
  
  // UI 狀態
  activeTab: 'control',
  
  // 遊戲參數
  baseBet: 1,
  simulationCount: 100,
  
  // Simulation 狀態
  simulationConfig: {
    count: 1000,
  },
  simulationResult: null,
  isSimulating: false,
  simulationProgress: 0,
  
  // 視覺參數
  visualConfig: {
    animation: {
      spinSpeed: 20,
      spinDuration: 2000,
      reelStopDelay: 200,
      easeStrength: 0.5,
      bounceStrength: 0.3,
    },
    layout: {
      reelGap: 10,
      symbolScale: 1,
      boardScale: 1,
    },
  },
  
  // 素材
  assets: {},
};

/**
 * Reducer
 */
function ideReducer(state: IDEState, action: IDEAction): IDEState {
  switch (action.type) {
    case 'SET_POOLS_BUILT':
      return {
        ...state,
        isPoolsBuilt: true,
        poolStatus: action.payload.status,
      };
    
    case 'SET_SPIN_PACKET':
      return {
        ...state,
        currentSpinPacket: action.payload,
      };
    
    case 'SET_SPINNING':
      return {
        ...state,
        isSpinning: action.payload,
      };
    
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };
    
    case 'SET_BASE_BET':
      return {
        ...state,
        baseBet: action.payload,
      };
    
    case 'SET_SIMULATION_COUNT':
      return {
        ...state,
        simulationCount: action.payload,
        simulationConfig: {
          ...state.simulationConfig,
          count: action.payload,
        },
      };
    
    case 'SET_SIMULATION_RESULT':
      return {
        ...state,
        simulationResult: action.payload,
      };
    
    case 'SET_IS_SIMULATING':
      return {
        ...state,
        isSimulating: action.payload,
      };
    
    case 'SET_SIMULATION_PROGRESS':
      return {
        ...state,
        simulationProgress: action.payload,
      };
    
    case 'RESET_SIMULATION':
      return {
        ...state,
        simulationResult: null,
        isSimulating: false,
        simulationProgress: 0,
      };
    
    case 'SET_VISUAL_CONFIG':
      return {
        ...state,
        visualConfig: action.payload,
      };
    
    case 'SET_ASSETS':
      return {
        ...state,
        assets: action.payload,
      };
    
    default:
      return state;
  }
}

/**
 * Context
 */
export const IDEContext = createContext<{
  state: IDEState;
  dispatch: React.Dispatch<IDEAction>;
} | null>(null);

/**
 * Provider
 */
export function IDEProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(ideReducer, initialState);

  return (
    <IDEContext.Provider value={{ state, dispatch }}>
      {children}
    </IDEContext.Provider>
  );
}

/**
 * Hook
 */
export function useIDE() {
  const context = useContext(IDEContext);
  if (!context) {
    throw new Error('useIDE must be used within IDEProvider');
  }
  return context;
}

