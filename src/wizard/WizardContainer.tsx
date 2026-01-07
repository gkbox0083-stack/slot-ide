import { useCurrentStep } from '../store/index.js';
import { WizardNavigation, WizardFooter } from './WizardNavigation.js';
import { GameInfoStep } from './steps/GameInfoStep.js';
import { SymbolStep } from './steps/SymbolStep.js';
import { OutcomeStep } from './steps/OutcomeStep.js';
import { LinesStep } from './steps/LinesStep.js';
import { VisualStep } from './steps/VisualStep.js';
import { SimulationStep } from './steps/SimulationStep.js';

/**
 * 步驟元件對應表
 */
const stepComponents: Record<string, React.ComponentType> = {
  'game-info': GameInfoStep,
  'symbols': SymbolStep,
  'outcomes': OutcomeStep,
  'lines': LinesStep,
  'visual': VisualStep,
  'simulation': SimulationStep,
};

/**
 * WizardContainer 主容器
 */
export function WizardContainer() {
  const currentStepInfo = useCurrentStep();
  const CurrentStepComponent = stepComponents[currentStepInfo.key];

  return (
    <div className="h-full flex flex-col">
      {/* 步驟導航 */}
      <div className="shrink-0 px-4 pt-4">
        <WizardNavigation />
      </div>

      {/* 步驟內容 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="animate-fade-in">
          {CurrentStepComponent && <CurrentStepComponent />}
        </div>
      </div>

      {/* 底部導航 */}
      <div className="shrink-0 px-4 pb-4">
        <WizardFooter />
      </div>
    </div>
  );
}

