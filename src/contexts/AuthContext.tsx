import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { authApi, User, LoginCredentials, RegisterData, STORAGE_KEYS } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Token is now stored in an httpOnly cookie — we validate by calling /auth/me
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if we have cached user info for quick UI display
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
      }

      // Verify session with the server (cookie is sent automatically)
      try {
        const response = await authApi.getMe();
        if (response.success) {
          setUser(response.data.user);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
        } else {
          handleSessionExpired();
        }
      } catch {
        // No valid session — clear any stale cached user
        handleSessionExpired();
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Periodic token refresh — every 6 hours
  useEffect(() => {
    if (user) {
      refreshIntervalRef.current = setInterval(async () => {
        try {
          await authApi.refresh();
        } catch {
          // Refresh failed — session may have expired
          handleSessionExpired();
        }
      }, 6 * 60 * 60 * 1000); // 6 hours
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user]);

  const handleSessionExpired = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(credentials);
      if (response.success) {
        const { user: newUser } = response.data;
        setUser(newUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.register(data);
      if (response.success) {
        const { user: newUser } = response.data;
        setUser(newUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout(); // Clears the httpOnly cookie server-side
    } catch {
      // Even if the server call fails, clear local state
    }
    setUser(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
