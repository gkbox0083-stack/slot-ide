import { forwardRef } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
  registration?: UseFormRegisterReturn;
  showStepper?: boolean;
}

/**
 * NumberInput 數字輸入框元件
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ label, error, hint, registration, showStepper = true, className = '', id, ...props }, ref) => {
    const inputId = id || registration?.name || `number-input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="number"
          id={inputId}
          className={`
            input-base
            ${hasError ? 'input-error' : ''}
            ${!showStepper ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' : ''}
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...registration}
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="error-message">
            {error}
          </p>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

