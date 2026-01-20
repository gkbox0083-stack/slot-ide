// src/firebase/auth.ts

import {
    signInWithPopup,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

/**
 * Google 登入
 */
export async function signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
}

/**
 * 登出
 */
export async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
}

/**
 * 監聯 Auth 狀態變化
 */
export function subscribeToAuthState(
    callback: (user: User | null) => void
): () => void {
    return onAuthStateChanged(auth, callback);
}

/**
 * 取得目前用戶
 */
export function getCurrentUser(): User | null {
    return auth.currentUser;
}
