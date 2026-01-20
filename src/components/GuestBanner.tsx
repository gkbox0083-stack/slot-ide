// src/components/GuestBanner.tsx

import { useAuthStore } from '../store/useAuthStore';

/**
 * Guest Banner Component
 * Displays a notification banner when user is in guest mode,
 * prompting them to log in for full functionality.
 */
export function GuestBanner() {
  const { status, signIn } = useAuthStore();

  if (status !== 'guest') return null;

  return (
    <div className="guest-banner">
      <span className="guest-banner-text">
        You are browsing as a guest. Log in to save templates and export reports.
      </span>
      <button onClick={signIn} className="guest-banner-btn">
        Log In
      </button>
    </div>
  );
}
