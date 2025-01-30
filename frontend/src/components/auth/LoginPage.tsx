import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const { login } = useAuth();

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '195696946375-m98kdgkp4bqnpr32421k5ub96vvpcbqn.apps.googleusercontent.com',
          callback: async (response: any) => {
            if (response.credential) {
              try {
                await login(response.credential);
              } catch (error) {
                console.error('Login failed:', error);
              }
            }
          },
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin')!,
          { theme: 'outline', size: 'large' }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Welcome to Restaurant Assistant
        </h1>
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-600 text-center">
            Please sign in to continue
          </p>
          <div id="google-signin" className="mt-4"></div>
        </div>
      </div>
    </div>
  );
}