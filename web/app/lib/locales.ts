/** Supported locale codes used in the app and in the footer language selector */
export const SUPPORTED_LOCALES = [
  "en-IN",
  "hi-IN",
  "id-ID",
  "es-ES",
  "pt-BR",
  "fr-FR",
  "de-DE",
  "ar-SA",
  "ja-JP"
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en-IN";

/** Map browser language (navigator.language) to the closest supported locale */
export function getLocaleFromBrowser(browserLang: string | undefined): Locale {
  if (!browserLang || typeof browserLang !== "string") return DEFAULT_LOCALE;
  const lower = browserLang.trim().toLowerCase();
  const [lang] = lower.split("-");
  const map: Record<string, Locale> = {
    en: "en-IN",
    hi: "hi-IN",
    id: "id-ID",
    es: "es-ES",
    pt: "pt-BR",
    fr: "fr-FR",
    de: "de-DE",
    ar: "ar-SA",
    ja: "ja-JP"
  };
  return map[lang] ?? DEFAULT_LOCALE;
}

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE_DAYS = 365;

export function isValidLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
