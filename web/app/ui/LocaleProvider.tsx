"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getMessage } from "../lib/messages";
import type { MessageKey } from "../lib/messages";
import {
  DEFAULT_LOCALE,
  getLocaleFromBrowser,
  isValidLocale,
  LOCALE_COOKIE_MAX_AGE_DAYS,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
  type Locale
} from "../lib/locales";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[^.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAgeDays: number) {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: MessageKey) => string;
};

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

export function useLocale(): LocaleContextValue {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}

const LOCALE_LABELS: Record<Locale, string> = {
  "en-IN": "English (India)",
  "hi-IN": "Hindi",
  "id-ID": "Indonesian",
  "es-ES": "Spanish",
  "pt-BR": "Portuguese",
  "fr-FR": "French",
  "de-DE": "German",
  "ar-SA": "Arabic",
  "ja-JP": "Japanese"
};

export function LocaleSelect({
  className,
  "aria-label": ariaLabel
}: {
  className?: string;
  "aria-label"?: string;
}) {
  const { locale, setLocale, t } = useLocale();
  return (
    <select
      className={className}
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label={ariaLabel ?? t("footer.selectLanguage")}
    >
      {(SUPPORTED_LOCALES as readonly Locale[]).map((loc) => (
        <option key={loc} value={loc}>
          {LOCALE_LABELS[loc]}
        </option>
      ))}
    </select>
  );
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fromCookie = getCookie(LOCALE_COOKIE_NAME);
    if (fromCookie && isValidLocale(fromCookie)) {
      setLocaleState(fromCookie);
    } else {
      const fromBrowser = getLocaleFromBrowser(typeof navigator !== "undefined" ? navigator.language : undefined);
      setLocaleState(fromBrowser);
      setCookie(LOCALE_COOKIE_NAME, fromBrowser, LOCALE_COOKIE_MAX_AGE_DAYS);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale;
  }, [mounted, locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setCookie(LOCALE_COOKIE_NAME, next, LOCALE_COOKIE_MAX_AGE_DAYS);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: MessageKey) => getMessage(locale, key),
    [locale]
  );

  const value: LocaleContextValue = { locale, setLocale, t };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
