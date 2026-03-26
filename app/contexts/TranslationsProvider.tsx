/**
 * Translation Context Provider
 *
 * Provides access to localized strings throughout the app via useTranslations() hook.
 * Translations are sourced from Shopify metaobjects and processed in root.tsx loader.
 *
 * See docs/TRANSLATIONS.md for complete translation system documentation.
 */
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { TRANSLATION_KEYS, TranslationKey, TranslationDictionary } from '~/lib/translations/keys';

interface TranslationsContextType {
  strings: TranslationDictionary;
}

const TranslationsContext = createContext<TranslationsContextType | undefined>(undefined);

export function TranslationsProvider({
  children,
  translations,
  locale,
}: {
  children: ReactNode;
  translations: { [locale: string]: { [key: string]: string } };
  locale: string;
}) {
  // Get translations for current locale and English fallback
  const currentLocaleStrings = useMemo(() => translations[locale] || {}, [translations, locale]);
  const englishStrings = useMemo(() => translations['en'] || {}, [translations]);

  // Memoize the Proxy to prevent creating a new object on every render
  // This prevents infinite render loops in consuming components
  const strings = useMemo(() => {
    return new Proxy({} as TranslationDictionary, {
      get(_target, prop: string | symbol) {
        // Only handle string keys that are valid translation keys
        if (typeof prop !== 'string') {
          return undefined;
        }

        const key = prop as TranslationKey;

        // FAIL FAST: Throw error if key is not in the dictionary
        if (!(key in TRANSLATION_KEYS)) {
          throw new Error(
            `[Translations] Invalid translation key: "${key}". ` +
            `This key must be defined in app/lib/translations/keys.ts`
          );
        }

        // Try to get value from current locale
        const currentValue = currentLocaleStrings[key];
        if (currentValue && currentValue !== '') {
          return currentValue;
        }

        // Fallback to English
        const englishValue = englishStrings[key];
        if (englishValue && englishValue !== '') {
          if (locale !== 'en') {
            console.warn(
              `[Translations] Missing translation for "${key}" in locale "${locale}", using English fallback`
            );
          }
          return englishValue;
        }

        // Final fallback to the default value from TRANSLATION_KEYS
        console.warn(
          `[Translations] Missing translation for "${key}" in both "${locale}" and "en", using default fallback`
        );
        return TRANSLATION_KEYS[key];
      }
    });
  }, [currentLocaleStrings, englishStrings, locale]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ strings }), [strings]);

  return (
    <TranslationsContext.Provider value={contextValue}>
      {children}
    </TranslationsContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(TranslationsContext);
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationsProvider');
  }
  return context;
}

export function useTranslation(key: TranslationKey) {
  const { strings } = useTranslations();
  // eslint-disable-next-line no-restricted-syntax -- Type-safe lookup using TranslationKey type
  return strings[key];
} 
