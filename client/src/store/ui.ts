'use client';

import { create } from "zustand";

type ThemeMode = "light" | "dark";
type Language = "ru" | "en";

type UiState = {
  theme: ThemeMode;
  language: Language;
  hydrated: boolean;
  hydrate: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
};

const THEME_KEY = "chat-theme";
const LANG_KEY = "chat-lang";

export const useUiStore = create<UiState>((set, get) => ({
  theme: "light",
  language: "ru",
  hydrated: false,
  hydrate: () => {
    if (typeof window === "undefined") return;
    const savedTheme = (localStorage.getItem(THEME_KEY) as ThemeMode | null) || "light";
    const savedLang = (localStorage.getItem(LANG_KEY) as Language | null) || "ru";
    set({ theme: savedTheme, language: savedLang, hydrated: true });
  },
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_KEY, theme);
    }
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === "light" ? "dark" : "light";
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_KEY, next);
    }
    set({ theme: next });
  },
  setLanguage: (lang) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LANG_KEY, lang);
    }
    set({ language: lang });
  },
}));
