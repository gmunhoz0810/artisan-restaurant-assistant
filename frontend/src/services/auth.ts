export interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
  }
  
  export async function loginWithGoogle(credential: string): Promise<User> {
    console.log('Attempting to login with credential:', credential.substring(0, 20) + '...');
    
    const response = await fetch('http://localhost:8000/api/auth/google-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: credential }),
    });
  
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Login failed with status:', response.status, 'Error:', errorData);
      throw new Error('Login failed');
    }
  
    const user = await response.json();
    console.log('Login successful, user:', user);
    localStorage.setItem('auth_token', credential);
    return user;
  }
  
  export function getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }
  
  export function removeStoredToken(): void {
    localStorage.removeItem('auth_token');
  }