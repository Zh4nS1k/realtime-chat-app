import { create } from "zustand";

export type AuthUser = {
  _id: string;
  email: string;
  username: string;
  createdAt?: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isHydrated: boolean;
  hydrate: () => void;
  setAuth: (data: { user: AuthUser; token: string }) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
};

const TOKEN_KEY = "chat-token";
const USER_KEY = "chat-user";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  hydrate: () => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    set({
      token: storedToken,
      user: storedUser ? (JSON.parse(storedUser) as AuthUser) : null,
      isHydrated: true,
    });
  },
  setUser: (user) => set((state) => ({ user, token: state.token })),
  setAuth: ({ user, token }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    set({ user: null, token: null });
  },
}));
