import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PoolStatus } from '../engine/pool-builder.js';
import type { SimulationResult } from '../analytics/simulator.js';

/**
 * Wizard 步驟定義
 */
export const WIZARD_STEPS = [
  { id: 1, key: 'game-info', title: '遊戲基本資料', description: '設定遊戲名稱與基礎投注' },
  { id: 2, key: 'symbols', title: '符號設定', description: '定義符號與賠付' },
  { id: 3, key: 'outcomes', title: '賠率設定', description: '設定獎項機率分佈' },
  { id: 4, key: 'lines', title: '線型設定', description: '配置連線模式' },
  { id: 5, key: 'visual', title: '視覺動畫與素材', description: '調整動畫與上傳素材' },
  { id: 6, key: 'simulation', title: '數值權重模擬', description: '執行模擬與統計分析' },
] as const;

export type WizardStepKey = typeof WIZARD_STEPS[number]['key'];

/**
 * Wizard 流程狀態
 */
export interface WizardState {
  // 當前步驟 (1-6)
  currentStep: number;
  
  // 盤池狀態
  isPoolsBuilt: boolean;
  poolStatus: PoolStatus[];
  
  // 模擬狀態
  isSimulating: boolean;
  simulationProgress: number;
  simulationResult: SimulationResult | null;
  
  // Spinning 狀態
  isSpinning: boolean;
}

/**
 * Wizard 流程 Actions
 */
export interface WizardActions {
  // 步驟導航
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  
  // 盤池管理
  setPoolsBuilt: (isBuilt: boolean, status: PoolStatus[]) => void;
  clearPools: () => void;
  
  // 模擬管理
  setIsSimulating: (isSimulating: boolean) => void;
  setSimulationProgress: (progress: number) => void;
  setSimulationResult: (result: SimulationResult | null) => void;
  resetSimulation: () => void;
  
  // Spinning 管理
  setIsSpinning: (isSpinning: boolean) => void;
  
  // 重置
  resetWizard: () => void;
}

/**
 * 初始狀態
 */
const initialState: WizardState = {
  currentStep: 1,
  isPoolsBuilt: false,
  poolStatus: [],
  isSimulating: false,
  simulationProgress: 0,
  simulationResult: null,
  isSpinning: false,
};

/**
 * Wizard Store
 */
export const useWizardStore = create<WizardState & WizardActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 步驟導航
      setCurrentStep: (step) => set({ currentStep: step }),
      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < WIZARD_STEPS.length) {
          set({ currentStep: currentStep + 1 });
        }
      },
      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },
      goToStep: (step) => {
        if (step >= 1 && step <= WIZARD_STEPS.length) {
          set({ currentStep: step });
        }
      },

      // 盤池管理
      setPoolsBuilt: (isBuilt, status) =>
        set({ isPoolsBuilt: isBuilt, poolStatus: status }),
      clearPools: () =>
        set({ isPoolsBuilt: false, poolStatus: [] }),

      // 模擬管理
      setIsSimulating: (isSimulating) => set({ isSimulating }),
      setSimulationProgress: (progress) => set({ simulationProgress: progress }),
      setSimulationResult: (result) => set({ simulationResult: result }),
      resetSimulation: () =>
        set({
          isSimulating: false,
          simulationProgress: 0,
          simulationResult: null,
        }),

      // Spinning 管理
      setIsSpinning: (isSpinning) => set({ isSpinning }),

      // 重置
      resetWizard: () => set(initialState),
    }),
    {
      name: 'slot-ide-wizard',
      partialize: (state) => ({
        currentStep: state.currentStep,
      }),
    }
  )
);

/**
 * 輔助 Hook: 取得當前步驟資訊
 */
export const useCurrentStep = () => {
  const currentStep = useWizardStore((state) => state.currentStep);
  return WIZARD_STEPS[currentStep - 1];
};

/**
 * 輔助 Hook: 檢查是否可以進入下一步
 */
export const useCanProceed = () => {
  const currentStep = useWizardStore((state) => state.currentStep);
  return currentStep < WIZARD_STEPS.length;
};

/**
 * 輔助 Hook: 檢查是否可以返回上一步
 */
export const useCanGoBack = () => {
  const currentStep = useWizardStore((state) => state.currentStep);
  return currentStep > 1;
};

