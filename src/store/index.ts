/**
 * Store 模組統一匯出
 */

export { useGameConfigStore } from './useGameConfigStore.js';
export type { GameConfigState, GameConfigActions } from './useGameConfigStore.js';

export { useWizardStore, WIZARD_STEPS, useCurrentStep, useCanProceed, useCanGoBack } from './useWizardStore.js';
export type { WizardState, WizardActions, WizardStepKey } from './useWizardStore.js';

export { useUIStore, useTheme } from './useUIStore.js';
export type { UIState, UIActions } from './useUIStore.js';

export { 
  useFreeSpinStore, 
  getFreeSpinState, 
  getBaseGameState, 
  initializeFreeSpinState,
  selectFreeSpinMode,
  selectIsInFreeSpin,
  selectRemainingSpins,
  selectAccumulatedWin,
  selectCurrentMultiplier,
} from './useFreeSpinStore.js';

export { useSimulationStore } from './useSimulationStore.js';
