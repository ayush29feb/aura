import React, { useState } from 'react';
import { signInWithGoogle, signInWithGithub, signOut } from '../services/authService';
import type { User } from '@supabase/supabase-js';
import './AuthButton.css';

interface AuthButtonProps {
  user: User | null;
  onAuthChange?: () => void;
}

const AuthButton: React.FC<AuthButtonProps> = ({ user, onAuthChange }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      console.error('Error signing in with Google:', error);
    } else {
      setShowMenu(false);
      onAuthChange?.();
    }
  };

  const handleGithubSignIn = async () => {
    const { error } = await signInWithGithub();
    if (error) {
      console.error('Error signing in with GitHub:', error);
    } else {
      setShowMenu(false);
      onAuthChange?.();
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      setShowMenu(false);
      onAuthChange?.();
    }
  };

  if (user) {
    return (
      <div className="auth-button-container">
        <button
          className="user-button"
          onClick={() => setShowMenu(!showMenu)}
        >
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="User avatar"
              className="user-avatar"
            />
          ) : (
            <div className="user-avatar-placeholder">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </button>
        {showMenu && (
          <div className="auth-menu">
            <div className="auth-menu-user-info">
              {user.email}
            </div>
            <button onClick={handleSignOut} className="auth-menu-button">
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-button-container">
      <button
        className="sign-in-button"
        onClick={() => setShowMenu(!showMenu)}
      >
        Sign In
      </button>
      {showMenu && (
        <div className="auth-menu">
          <button onClick={handleGoogleSignIn} className="auth-menu-button google">
            Sign in with Google
          </button>
          <button onClick={handleGithubSignIn} className="auth-menu-button github">
            Sign in with GitHub
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthButton;
