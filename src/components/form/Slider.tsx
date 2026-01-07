import { forwardRef, useId } from 'react';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showValue?: boolean;
  unit?: string;
  showMinMax?: boolean;
}

/**
 * Slider 滑桿元件
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      label,
      error,
      hint,
      min,
      max,
      step = 1,
      value,
      onChange,
      showValue = true,
      unit = '',
      showMinMax = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const sliderId = id || `slider-${generatedId}`;
    const hasError = !!error;

    // 計算滑桿填充百分比
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="flex items-center justify-between mb-2">
            {label && (
              <label htmlFor={sliderId} className="label mb-0">
                {label}
              </label>
            )}
            {showValue && (
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                {value}{unit}
              </span>
            )}
          </div>
        )}
        
        <div className="relative">
          {showMinMax && (
            <div className="flex justify-between mb-1">
              <span className="text-xs text-surface-500 dark:text-surface-400">
                {min}{unit}
              </span>
              <span className="text-xs text-surface-500 dark:text-surface-400">
                {max}{unit}
              </span>
            </div>
          )}
          
          <input
            ref={ref}
            type="range"
            id={sliderId}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className={`
              w-full h-2 rounded-lg appearance-none cursor-pointer
              bg-surface-200 dark:bg-surface-700
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary-600
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-primary-600
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${hasError ? 'ring-2 ring-accent-error' : ''}
              ${className}
            `}
            style={{
              background: `linear-gradient(to right, rgb(37 99 235) 0%, rgb(37 99 235) ${percentage}%, rgb(229 231 235) ${percentage}%, rgb(229 231 235) 100%)`,
            }}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${sliderId}-error` : hint ? `${sliderId}-hint` : undefined}
            {...props}
          />
        </div>

        {hint && !error && (
          <p id={`${sliderId}-hint`} className="mt-2 text-sm text-surface-500 dark:text-surface-400 italic">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${sliderId}-error`} className="error-message">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

