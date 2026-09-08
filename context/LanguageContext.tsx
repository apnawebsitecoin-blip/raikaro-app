import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { translations, LangCode, TranslationKey } from '../lib/i18n';

const LANG_KEY = 'raikaro_language';
const DEFAULT: LangCode = 'en';

interface LanguageContextValue {
  lang: LangCode;
  setLanguage: (code: LangCode) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT,
  setLanguage: () => {},
  t: (key) => String(key),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LangCode>(DEFAULT);

  useEffect(() => {
    SecureStore.getItemAsync(LANG_KEY).then((stored) => {
      if (stored && stored in translations) setLang(stored as LangCode);
    });
  }, []);

  const setLanguage = useCallback((code: LangCode) => {
    setLang(code);
    SecureStore.setItemAsync(LANG_KEY, code);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string =>
      translations[lang]?.[key] ?? translations[DEFAULT]?.[key] ?? String(key),
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
