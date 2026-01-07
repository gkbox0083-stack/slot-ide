import { forwardRef } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
  registration?: UseFormRegisterReturn;
}

/**
 * TextInput 文字輸入框元件
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, hint, registration, className = '', id, ...props }, ref) => {
    const inputId = id || registration?.name || `text-input-${Math.random().toString(36).substr(2, 9)}`;
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
          type="text"
          id={inputId}
          className={`
            input-base
            ${hasError ? 'input-error' : ''}
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

TextInput.displayName = 'TextInput';

