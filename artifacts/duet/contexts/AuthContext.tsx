import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, UserResponse } from "@/lib/api";

const TOKEN_KEY = "@duet_device_token";

type AuthContextType = {
  user: UserResponse | null;
  isLoading: boolean;
  signUp: (displayName: string, avatarColor: string, avatarIcon: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      const me = await api.getMe();
      setUser(me);
    } catch {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (displayName: string, avatarColor: string, avatarIcon: string) => {
    const result = await api.createUser({ displayName, avatarColor, avatarIcon });
    await AsyncStorage.setItem(TOKEN_KEY, result.deviceToken);
    setUser({ id: result.id, displayName, avatarColor, avatarIcon });
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
