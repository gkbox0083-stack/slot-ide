// src/components/UserArea.tsx

import { useAuthStore } from '../store/useAuthStore';
import './UserArea.css';

export function UserArea() {
    const { user, status, signIn, signOut } = useAuthStore();

    if (status === 'loading') {
        return <div className="user-area">載入中...</div>;
    }

    if (status === 'guest') {
        return (
            <div className="user-area">
                <button onClick={signIn} className="sign-in-btn">
                    🔑 Google 登入
                </button>
            </div>
        );
    }

    return (
        <div className="user-area">
            <img
                src={user?.photoURL || ''}
                alt="avatar"
                className="user-avatar"
            />
            <span className="user-name">{user?.displayName}</span>
            <button onClick={signOut} className="sign-out-btn">
                登出
            </button>
        </div>
    );
}
