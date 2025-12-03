'use client';

import { useEffect } from "react";
import { useUiStore } from "@/store/ui";

export function UiWatcher() {
  const { theme, language, hydrate, hydrated } = useUiStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.lang = language;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, language, hydrated]);

  return null;
}
