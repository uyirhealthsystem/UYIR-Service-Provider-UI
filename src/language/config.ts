export const languages = {
  en: "English",
  ta: "தமிழ்",
} as const;

export type LanguageCode = keyof typeof languages;

export const defaultLanguage: LanguageCode = "en";
