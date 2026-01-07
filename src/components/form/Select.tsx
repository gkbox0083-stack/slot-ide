import { forwardRef } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  registration?: UseFormRegisterReturn;
}

/**
 * Select 下拉選單元件
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, registration, className = '', id, ...props }, ref) => {
    const selectId = id || registration?.name || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            input-base
            ${hasError ? 'input-error' : ''}
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...registration}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${selectId}-error`} className="error-message">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

