// src/store/useAuthStore.ts

import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { signInWithGoogle, signOut, subscribeToAuthState } from '../firebase/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthState {
    user: User | null;
    status: AuthStatus;
    error: string | null;
}

interface AuthActions {
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    setUser: (user: User | null) => void;
    setStatus: (status: AuthStatus) => void;
    setError: (error: string | null) => void;
    initialize: () => () => void;
}

const initialState: AuthState = {
    user: null,
    status: 'loading',
    error: null,
};

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
    ...initialState,

    signIn: async () => {
        set({ error: null });
        try {
            const user = await signInWithGoogle();
            set({ user, status: 'authenticated' });
        } catch (error) {
            const message = error instanceof Error ? error.message : '登入失敗';
            set({ error: message, status: 'guest' });
        }
    },

    signOut: async () => {
        try {
            await signOut();
            set({ user: null, status: 'guest' });
        } catch (error) {
            const message = error instanceof Error ? error.message : '登出失敗';
            set({ error: message });
        }
    },

    setUser: (user) => set({ user }),
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error }),

    initialize: () => {
        // 監聽 Auth 狀態
        const unsubscribe = subscribeToAuthState((user) => {
            if (user) {
                set({ user, status: 'authenticated', error: null });
            } else {
                set({ user: null, status: 'guest', error: null });
            }
        });

        return unsubscribe;
    },
}));

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.status === 'authenticated';
export const selectIsGuest = (state: AuthState) => state.status === 'guest';
export const selectIsLoading = (state: AuthState) => state.status === 'loading';
