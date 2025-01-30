import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getStoredToken, loginWithGoogle, removeStoredToken } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const token = getStoredToken();

    const attemptAutoLogin = async () => {
      if (token) {
        try {
          const user = await loginWithGoogle(token);
          if (isMounted) {
            console.log('Auto-login successful:', user);
            setUser(user);
          }
        } catch (error) {
          console.error('Auto-login failed:', error);
          if (isMounted) {
            removeStoredToken();
            setUser(null);
          }
        }
      } else {
        console.log('No stored token found');
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    attemptAutoLogin();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credential: string) => {
    try {
      setLoginAttempts(prev => prev + 1);
      
      // If too many attempts, force a short delay
      if (loginAttempts > 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoginAttempts(0);
      }

      // Clear any existing token before attempting new login
      removeStoredToken();
      
      console.log('Login attempt with new credential');
      const user = await loginWithGoogle(credential);
      console.log('Login successful, setting user:', user);
      setUser(user);
      setLoginAttempts(0);
    } catch (error) {
      console.error('Login error in context:', error);
      // Clear state on error
      setUser(null);
      removeStoredToken();
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out');
    removeStoredToken();
    setUser(null);
    setLoginAttempts(0);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}