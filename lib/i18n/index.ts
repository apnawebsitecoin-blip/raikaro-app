import en from './en';
import hi from './hi';
import bn from './bn';
import ta from './ta';
import te from './te';
import mr from './mr';

export type LangCode = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr';
export type TranslationKey = keyof typeof en;

export const translations: Record<LangCode, Record<TranslationKey, string>> = {
  en,
  hi,
  bn,
  ta,
  te,
  mr,
};

export const LANGUAGE_OPTIONS: { code: LangCode; native: string; english: string }[] = [
  { code: 'en', native: 'English',  english: 'English'  },
  { code: 'hi', native: 'हिन्दी',   english: 'Hindi'    },
  { code: 'bn', native: 'বাংলা',    english: 'Bengali'  },
  { code: 'ta', native: 'தமிழ்',    english: 'Tamil'    },
  { code: 'te', native: 'తెలుగు',   english: 'Telugu'   },
  { code: 'mr', native: 'मराठी',    english: 'Marathi'  },
];
