import { forwardRef, useId, useRef, useState } from 'react';

export interface FileUploadProps {
  label?: string;
  hint?: string;
  error?: string;
  accept?: string;
  maxSize?: number; // in bytes
  preview?: string | null;
  onFileSelect: (file: File | null, dataUrl: string | null) => void;
  onClear?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * FileUpload 文件上傳元件
 */
export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      label,
      hint,
      error,
      accept = 'image/*',
      maxSize = 5 * 1024 * 1024, // 5MB default
      preview,
      onFileSelect,
      onClear,
      disabled = false,
      className = '',
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = `file-upload-${generatedId}`;
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const hasError = !!(error || localError);
    const displayError = error || localError;

    const handleFileChange = (file: File | null) => {
      setLocalError(null);

      if (!file) {
        onFileSelect(null, null);
        return;
      }

      // 檢查檔案大小
      if (file.size > maxSize) {
        setLocalError(`檔案大小不能超過 ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
      }

      // 讀取檔案為 dataUrl
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onFileSelect(file, dataUrl);
      };
      reader.onerror = () => {
        setLocalError('讀取檔案失敗');
      };
      reader.readAsDataURL(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      handleFileChange(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (disabled) return;

      const file = e.dataTransfer.files?.[0] || null;
      handleFileChange(file);
    };

    const handleClear = () => {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      setLocalError(null);
      onFileSelect(null, null);
      onClear?.();
    };

    const handleClick = () => {
      if (!disabled) {
        inputRef.current?.click();
      }
    };

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}

        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-4
            transition-colors duration-200
            ${isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : hasError
                ? 'border-accent-error bg-red-50 dark:bg-red-900/10'
                : 'border-surface-300 dark:border-surface-600 hover:border-primary-400 dark:hover:border-primary-500'
            }
            ${disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
            }
          `}
        >
          <input
            ref={(node) => {
              // Handle both refs
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }}
            type="file"
            id={inputId}
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled}
            className="sr-only"
          />

          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="max-h-32 mx-auto rounded object-contain"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                disabled={disabled}
                className="
                  absolute -top-2 -right-2 w-6 h-6 rounded-full
                  bg-accent-error text-white
                  flex items-center justify-center
                  hover:bg-red-600 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-surface-400 dark:text-surface-500"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  點擊上傳
                </span>
                {' '}或拖放檔案
              </p>
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                {accept.replace('image/*', 'PNG, JPG, GIF')} (最大 {Math.round(maxSize / 1024 / 1024)}MB)
              </p>
            </div>
          )}
        </div>

        {hint && !displayError && (
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {hint}
          </p>
        )}
        {displayError && (
          <p className="error-message">
            {displayError}
          </p>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

