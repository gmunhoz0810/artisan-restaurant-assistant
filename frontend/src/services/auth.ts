export async function loginWithGoogle(credential: string): Promise<User> {
    try {
      const response = await fetch('http://localhost:8000/api/auth/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credential }),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Login failed');
      }
  
      const user = await response.json();
      localStorage.setItem('auth_token', credential);
      return user;
    } catch (error) {
      localStorage.removeItem('auth_token');
      throw error;
    }
  }
  
  export function getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }
  
  export function removeStoredToken(): void {
    localStorage.removeItem('auth_token');
  }
  
  export interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
  }