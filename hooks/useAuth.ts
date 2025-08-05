import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  username: string;
}

// Define the shape of the decoded JWT payload
interface JwtPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

type AuthStatus = 'loading' | 'needs-setup' | 'ready' | 'authenticated';

const AUTH_TOKEN_KEY = 'task-donegeon-auth-token';

// Helper function to parse JWT
const parseJwt = (token: string): JwtPayload | null => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));

  const checkSetupStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (data.isSetupComplete) {
        if (storedToken) {
          const payload = parseJwt(storedToken);
          if (payload && payload.exp * 1000 > Date.now()) {
            setUser({ id: payload.userId, username: payload.username });
            setStatus('authenticated');
            setToken(storedToken);
          } else {
            // Token expired or invalid
            localStorage.removeItem(AUTH_TOKEN_KEY);
            setStatus('ready');
          }
        } else {
          setStatus('ready'); // Setup is complete, ready for login
        }
      } else {
        setStatus('needs-setup'); // No users in DB
      }
    } catch (error) {
      console.error("Error checking setup status:", error);
      // Handle server down, etc.
      setStatus('needs-setup'); // Fallback to setup
    }
  }, []);

  useEffect(() => {
    checkSetupStatus();
  }, [checkSetupStatus]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) return false;
      const { token } = await response.json();
      const payload = parseJwt(token);
      if (payload) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        setUser({ id: payload.userId, username: payload.username });
        setToken(token);
        setStatus('authenticated');
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setToken(null);
    setStatus('ready'); // Go back to login screen
  }, []);
  
  const completeSetup = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
      });
      if (!response.ok) return false;
      // After setup, log the user in automatically
      return await login(username, password);
    } catch(error) {
        console.error("Setup failed:", error);
        return false;
    }
  }, [login]);

  return { 
    status, 
    isAuthenticated: status === 'authenticated', 
    user, 
    login, 
    logout, 
    completeSetup 
  };
};
