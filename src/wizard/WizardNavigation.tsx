import { useWizardStore, WIZARD_STEPS } from '../store/index.js';

/**
 * WizardNavigation 步驟導航元件
 */
export function WizardNavigation() {
  const { currentStep, goToStep } = useWizardStore();

  return (
    <nav className="mb-6">
      {/* 步驟指示器 */}
      <ol className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;

          return (
            <li key={step.id} className="flex-1 relative">
              {/* 連接線 */}
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={`
                    absolute top-4 left-1/2 w-full h-0.5
                    ${isCompleted ? 'bg-primary-600' : 'bg-surface-200 dark:bg-surface-700'}
                    transition-colors duration-300
                  `}
                />
              )}

              {/* 步驟圓點 */}
              <button
                type="button"
                onClick={() => goToStep(stepNumber)}
                className={`
                  relative z-10 flex flex-col items-center gap-1
                  ${isActive || isCompleted ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                `}
                disabled={stepNumber > currentStep + 1}
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    text-sm font-semibold transition-all duration-300
                    ${
                      isCompleted
                        ? 'bg-primary-600 text-white'
                        : isActive
                          ? 'bg-primary-600 text-white ring-4 ring-primary-200 dark:ring-primary-900'
                          : 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={`
                    text-xs font-medium hidden sm:block
                    ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 dark:text-surface-400'}
                  `}
                >
                  {step.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * WizardFooter 底部導航按鈕
 */
export function WizardFooter() {
  const { currentStep, nextStep, prevStep } = useWizardStore();

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === WIZARD_STEPS.length;

  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-surface-200 dark:border-surface-700">
      <button
        type="button"
        onClick={prevStep}
        disabled={isFirstStep}
        className={`
          btn-secondary
          ${isFirstStep ? 'invisible' : ''}
        `}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        上一步
      </button>

      <div className="text-sm text-surface-500 dark:text-surface-400">
        步驟 {currentStep} / {WIZARD_STEPS.length}
      </div>

      {!isLastStep ? (
        <button
          type="button"
          onClick={nextStep}
          className="btn-primary"
        >
          下一步
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <div className="btn-success">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          完成設定
        </div>
      )}
    </div>
  );
}

