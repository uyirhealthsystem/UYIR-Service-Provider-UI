import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import en from "./locales/en";
import ta from "./locales/ta";
import { defaultLanguage, type LanguageCode } from "./config";

const translations = { en, ta };

type TranslationValues = Record<string, string | number>;

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, values?: TranslationValues) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

function translate(
  language: LanguageCode,
  key: string,
  values?: TranslationValues
): string {
  const value = key.split(".").reduce<unknown>((object, part) => {
    if (typeof object !== "object" || object === null) return undefined;

    return (object as Record<string, unknown>)[part];
  }, translations[language]);

  if (typeof value !== "string") return key;

  return value.replace(/\{(\w+)\}/g, (_, name: string) =>
    values?.[name] !== undefined ? String(values[name]) : `{${name}}`
  );
}

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({
  children,
}: LanguageProviderProps): ReactNode {
  const [language, setLanguage] = useState<LanguageCode>(defaultLanguage);

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      setLanguage,
      t: (key, values) => translate(language, key, values),
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}