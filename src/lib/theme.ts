"use client";

import { useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

function readSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

function applyResolved(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolved);
}

function resolve(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? readSystemTheme() : preference;
}

/**
 * Inline bootstrap snippet — runs before paint to avoid FOUC.
 * Stored as a string so it can be embedded via dangerouslySetInnerHTML.
 */
export const themeBootstrapScript = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var pref = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    var resolved = pref === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : pref;
    document.documentElement.setAttribute("data-theme", resolved);
  } catch (_) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`;

export function useTheme(): {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
} {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const initial = readStoredPreference();
    setPreferenceState(initial);
    const r = resolve(initial);
    setResolved(r);
    applyResolved(r);

    if (initial !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = readSystemTheme();
      setResolved(next);
      applyResolved(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
    const r = resolve(next);
    setResolved(r);
    applyResolved(r);
  }

  return { preference, resolved, setPreference };
}
