// src/hooks/useGuestMode.ts

import { useAuthStore } from '../store/useAuthStore';

/**
 * Hook for handling guest mode restrictions.
 * Provides utilities to check guest status and prompt for authentication.
 */
export function useGuestMode() {
  const { status, signIn } = useAuthStore();
  const isGuest = status === 'guest';

  /**
   * Requires authentication to perform an action.
   * If the user is a guest, prompts them to log in.
   *
   * @param actionName - Description of the action being attempted
   * @param callback - Function to execute if authenticated
   * @returns true if the action was executed, false if blocked
   */
  const requireAuth = (actionName: string, callback: () => void): boolean => {
    if (isGuest) {
      const shouldLogin = confirm(`${actionName} requires login. Would you like to log in now?`);
      if (shouldLogin) {
        signIn();
      }
      return false;
    }
    callback();
    return true;
  };

  /**
   * Checks if the user can perform a protected action.
   * Does not prompt - just returns the status.
   */
  const canPerformAction = (): boolean => {
    return !isGuest;
  };

  return {
    isGuest,
    requireAuth,
    canPerformAction,
  };
}
