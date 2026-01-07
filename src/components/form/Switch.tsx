import { forwardRef, useId } from 'react';

export interface SwitchProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Switch 開關元件
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, checked, onChange, size = 'md', className = '', id, disabled }, ref) => {
    const generatedId = useId();
    const switchId = id || `switch-${generatedId}`;

    const sizeClasses = {
      sm: {
        track: 'w-8 h-4',
        thumb: 'w-3 h-3',
        translate: 'translate-x-4',
      },
      md: {
        track: 'w-11 h-6',
        thumb: 'w-5 h-5',
        translate: 'translate-x-5',
      },
      lg: {
        track: 'w-14 h-7',
        thumb: 'w-6 h-6',
        translate: 'translate-x-7',
      },
    };

    const currentSize = sizeClasses[size];

    return (
      <div className={`flex items-start ${className}`}>
        <div className="flex items-center h-5">
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-labelledby={label ? `${switchId}-label` : undefined}
            aria-describedby={description ? `${switchId}-description` : undefined}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`
              relative inline-flex shrink-0 ${currentSize.track} rounded-full
              transition-colors duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${checked 
                ? 'bg-primary-600' 
                : 'bg-surface-300 dark:bg-surface-600'
              }
              ${disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer'
              }
            `}
          >
            <span
              className={`
                pointer-events-none inline-block ${currentSize.thumb} rounded-full
                bg-white shadow-lg transform ring-0
                transition duration-200 ease-in-out
                ${checked ? currentSize.translate : 'translate-x-0.5'}
              `}
            />
          </button>
          {/* Hidden input for form registration */}
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only"
          />
        </div>
        
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label
                id={`${switchId}-label`}
                htmlFor={switchId}
                className={`
                  text-sm font-medium text-surface-900 dark:text-surface-100
                  ${disabled ? 'opacity-50' : 'cursor-pointer'}
                `}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                id={`${switchId}-description`}
                className="text-sm text-surface-500 dark:text-surface-400"
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

