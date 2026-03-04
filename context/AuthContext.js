import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ← check stored token on boot

  // On app start, restore session from secure storage
  useEffect(() => {
    async function restore() {
      try {
        const stored = await SecureStore.getItemAsync('user');
        if (stored) setUser(JSON.parse(stored));
      } catch {
        // corrupted or missing — ignore
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}