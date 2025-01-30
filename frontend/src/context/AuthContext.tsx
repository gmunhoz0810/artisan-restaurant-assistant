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

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      console.log('Found stored token, attempting to login...');
      loginWithGoogle(token)
        .then(user => {
          console.log('Auto-login successful:', user);
          setUser(user);
        })
        .catch(error => {
          console.error('Auto-login failed:', error);
          removeStoredToken();
        })
        .finally(() => setIsLoading(false));
    } else {
      console.log('No stored token found');
      setIsLoading(false);
    }
  }, []);

  const login = async (credential: string) => {
    try {
      console.log('Login attempt with new credential');
      const user = await loginWithGoogle(credential);
      console.log('Login successful, setting user:', user);
      setUser(user);
    } catch (error) {
      console.error('Login error in context:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out');
    removeStoredToken();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  console.log('Auth context current state:', value);

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