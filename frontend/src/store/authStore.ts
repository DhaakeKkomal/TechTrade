import { create } from "zustand";

interface User {
  id: number;
  email: string;
  full_name: string;
  preferences: Record<str, any>;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const initialToken = localStorage.getItem("token");
  const initialUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : null;

  return {
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!initialToken,
    login: (token, user) => {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({ token: null, user: null, isAuthenticated: false });
    },
    setUser: (user) => {
      localStorage.setItem("user", JSON.stringify(user));
      set({ user });
    },
  };
});
