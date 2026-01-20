// src/components/SaveButton.tsx

import type { ReactNode } from 'react';
import { useGuestMode } from '../hooks/useGuestMode';

interface SaveButtonProps {
  onSave: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * A protected save button that prompts guests to log in.
 * Authenticated users can save normally.
 */
export function SaveButton({ onSave, children, className = '', disabled = false }: SaveButtonProps) {
  const { isGuest, requireAuth } = useGuestMode();

  const handleClick = () => {
    if (disabled) return;
    requireAuth('Save', onSave);
  };

  return (
    <button
      onClick={handleClick}
      className={`${className} ${isGuest ? 'guest-restricted' : ''}`}
      title={isGuest ? 'Log in to use this feature' : ''}
      disabled={disabled}
    >
      {children}
      {isGuest && <span className="lock-icon">🔒</span>}
    </button>
  );
}
