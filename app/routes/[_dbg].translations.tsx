import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { useState } from 'react';
import { TRANSLATIONS_QUERY } from '~/graphql/translations.query';
import { TRANSLATION_KEYS } from '~/lib/translations/keys';
import type { CountryCode, LanguageCode } from '@shopify/hydrogen/storefront-api-types';
import { userScopedMediaApiContext } from '~/lib/middleware';

interface TranslationData {
  [key: string]: string;
}

export async function loader({ context }: LoaderFunctionArgs) {
  const { storefront } = context;
  const userScopedMediaApi = context.get(userScopedMediaApiContext);

  // Fetch supported locales from Media API (source of truth for all 30 languages)
  const localesResponse = await userScopedMediaApi.locale.getLocalesSupported();

  // Build language configs from Media API locales
  // Extract language code and country code from localeCode (e.g., "en-US" -> lang: "EN", country: "US")
  const languageConfigs = localesResponse.locales.map((locale) => {
    const [langPart, countryPart] = locale.localeCode.split('-');
    return {
      code: locale.codeShopify.toUpperCase(), // Shopify language code (uppercase)
      country: (countryPart || langPart).toUpperCase(), // Country code for context
      label: locale.name,
      nativeName: locale.name, // Media API doesn't provide native name, use name
      localeCode: locale.localeCode,
    };
  });

  // Helper to fetch all translations with pagination
  async function fetchAllTranslations(
    country: CountryCode,
    language: LanguageCode,
  ): Promise<TranslationData> {
    const allNodes: any[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const queryResult: { metaobjects?: { nodes?: any[]; pageInfo?: { hasNextPage?: boolean; endCursor?: string | null } } } = await storefront.query(TRANSLATIONS_QUERY, {
        variables: {
          country,
          language,
          cursor,
        },
      });

      const nodes = queryResult.metaobjects?.nodes || [];
      allNodes.push(...nodes);

      hasNextPage = queryResult.metaobjects?.pageInfo?.hasNextPage ?? false;
      cursor = queryResult.metaobjects?.pageInfo?.endCursor ?? null;
    }

    // Transform to key-value pairs
    return allNodes.reduce((acc: TranslationData, node: any) => {
      const key = node.fields.find((f: any) => f.key === 'key')?.value;
      const text = node.fields.find((f: any) => f.key === 'text')?.value;
      if (key && text) {
        acc[key.replace(/\s+/g, '_')] = text;
      }
      return acc;
    }, {});
  }

  // Fetch translations for all languages in parallel
  const results = await Promise.all(
    languageConfigs.map(async (lang) => {
      const translations = await fetchAllTranslations(
        lang.country as CountryCode,
        lang.code as LanguageCode,
      );
      return {
        language: lang.code,
        label: lang.label,
        nativeName: lang.nativeName,
        country: lang.country,
        localeCode: lang.localeCode,
        translations,
        count: Object.keys(translations).length,
      };
    }),
  );

  // Get all defined keys from code
  const definedKeys = Object.keys(TRANSLATION_KEYS);

  return {
    languages: results,
    definedKeys,
    definedKeysCount: definedKeys.length,
    timestamp: new Date().toISOString(),
  };
}

export default function DebugTranslationsPage() {
  const { languages, definedKeys, definedKeysCount, timestamp } =
    useLoaderData<typeof loader>();
  const [selectedLang, setSelectedLang] = useState<string>('EN');
  const [filter, setFilter] = useState<string>('');
  const [showMissing, setShowMissing] = useState<boolean>(false);
  const [showUntranslated, setShowUntranslated] = useState<boolean>(false);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareLang, setCompareLang] = useState<string>('DE');

  const currentLangData = languages.find((l) => l.language === selectedLang);
  const compareLangData = languages.find((l) => l.language === compareLang);
  const englishData = languages.find((l) => l.language === 'EN');

  // Get all unique keys across all languages and defined keys
  const allKeys = new Set<string>([
    ...definedKeys,
    ...languages.flatMap((l) => Object.keys(l.translations)),
  ]);

  // Filter keys
  const filteredKeys = Array.from(allKeys)
    .filter((key) => {
      if (filter && !key.toLowerCase().includes(filter.toLowerCase())) {
        return false;
      }
      if (showMissing && currentLangData?.translations[key]) {
        return false;
      }
      // Show untranslated: value equals English value (for non-English languages)
      if (showUntranslated && selectedLang !== 'EN') {
        const currentVal = currentLangData?.translations[key];
        const englishVal = englishData?.translations[key];
        if (!currentVal || currentVal !== englishVal) {
          return false;
        }
      }
      return true;
    })
    .sort();

  // Count untranslated (same as English)
  const untranslatedCount =
    selectedLang !== 'EN' && currentLangData && englishData
      ? Object.keys(currentLangData.translations).filter(
          (key) =>
            currentLangData.translations[key] === englishData.translations[key],
        ).length
      : 0;

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        maxWidth: '1600px',
        margin: '0 auto',
        background: '#0a0a0a',
        minHeight: '100vh',
        color: '#e5e5e5',
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>
        🌍 Translation Debug
      </h1>
      <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>
        Last fetched: {timestamp} | Languages from{' '}
        <code style={{ background: '#333', padding: '2px 6px', borderRadius: '3px' }}>
          Media API /meta/locales-supported
        </code>
      </p>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '8px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: '#1a1a1a',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #333',
          }}
        >
          <div style={{ fontSize: '11px', color: '#888' }}>In Code</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
            {definedKeysCount}
          </div>
        </div>
        {languages.map((lang) => (
          <div
            key={lang.language}
            style={{
              background: lang.language === selectedLang ? '#1e3a5f' : '#1a1a1a',
              padding: '12px',
              borderRadius: '8px',
              border:
                lang.language === selectedLang
                  ? '1px solid #3b82f6'
                  : '1px solid #333',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedLang(lang.language)}
            title={`${lang.label} - Locale: ${lang.localeCode} | Shopify: ${lang.language}/${lang.country}`}
          >
            <div style={{ fontSize: '11px', color: '#888' }}>
              {lang.language}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              {lang.count}
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>{lang.nativeName}</div>
          </div>
        ))}
      </div>

      {/* Untranslated Warning */}
      {selectedLang !== 'EN' && untranslatedCount > 0 && (
        <div
          style={{
            background: 'rgba(234, 179, 8, 0.15)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <strong style={{ color: '#fde047' }}>
              {untranslatedCount} translations appear untranslated
            </strong>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
              These have the same value as English. This could mean they're not yet
              translated in Shopify, or the @inContext directive isn't returning
              localized content.
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Filter by key..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #333',
            background: '#1a1a1a',
            color: '#fff',
            width: '250px',
          }}
        />
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={showMissing}
            onChange={(e) => {
              setShowMissing(e.target.checked);
              if (e.target.checked) setShowUntranslated(false);
            }}
          />
          <span>Show only missing</span>
        </label>
        {selectedLang !== 'EN' && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={showUntranslated}
              onChange={(e) => {
                setShowUntranslated(e.target.checked);
                if (e.target.checked) setShowMissing(false);
              }}
            />
            <span>Show only untranslated (= English)</span>
          </label>
        )}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={compareMode}
            onChange={(e) => setCompareMode(e.target.checked)}
          />
          <span>Compare mode</span>
        </label>
        {compareMode && (
          <select
            value={compareLang}
            onChange={(e) => setCompareLang(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #333',
              background: '#1a1a1a',
              color: '#fff',
            }}
          >
            {languages
              .filter((l) => l.language !== selectedLang)
              .map((l) => (
                <option key={l.language} value={l.language}>
                  Compare with {l.label}
                </option>
              ))}
          </select>
        )}
        <span style={{ color: '#888', marginLeft: 'auto' }}>
          Showing {filteredKeys.length} of {allKeys.size} keys
        </span>
      </div>

      {/* Translation Table */}
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333',
          overflow: 'auto',
          maxHeight: '70vh',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: '#252525' }}>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #333',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#888',
                  width: '25%',
                }}
              >
                KEY
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #333',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#888',
                }}
              >
                {currentLangData?.label.toUpperCase()} ({currentLangData?.language})
              </th>
              {compareMode && (
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #333',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#888',
                  }}
                >
                  {compareLangData?.label.toUpperCase()} ({compareLangData?.language})
                </th>
              )}
              <th
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  borderBottom: '1px solid #333',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#888',
                  width: '120px',
                }}
              >
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredKeys.map((key) => {
              const value = currentLangData?.translations[key];
              const compareValue = compareLangData?.translations[key];
              const englishValue = englishData?.translations[key];
              const inCode = definedKeys.includes(key);
              const isMissing = !value;
              const isExtra = !inCode && value;
              const isUntranslated =
                selectedLang !== 'EN' && value && value === englishValue;

              return (
                <tr
                  key={key}
                  style={{
                    borderBottom: '1px solid #252525',
                    background: isMissing
                      ? 'rgba(239, 68, 68, 0.1)'
                      : isExtra
                        ? 'rgba(234, 179, 8, 0.1)'
                        : isUntranslated
                          ? 'rgba(168, 85, 247, 0.1)'
                          : 'transparent',
                  }}
                >
                  <td
                    style={{
                      padding: '10px 12px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      color: '#a5a5a5',
                      wordBreak: 'break-all',
                    }}
                  >
                    {key}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontSize: '13px',
                      color: value ? '#fff' : '#666',
                    }}
                  >
                    {value || (
                      <span style={{ fontStyle: 'italic' }}>— missing —</span>
                    )}
                  </td>
                  {compareMode && (
                    <td
                      style={{
                        padding: '10px 12px',
                        fontSize: '13px',
                        color: compareValue ? '#fff' : '#666',
                      }}
                    >
                      {compareValue || (
                        <span style={{ fontStyle: 'italic' }}>— missing —</span>
                      )}
                    </td>
                  )}
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {isMissing ? (
                      <span
                        style={{
                          background: '#7f1d1d',
                          color: '#fca5a5',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}
                      >
                        MISSING
                      </span>
                    ) : isExtra ? (
                      <span
                        style={{
                          background: '#713f12',
                          color: '#fde047',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}
                      >
                        EXTRA
                      </span>
                    ) : isUntranslated ? (
                      <span
                        style={{
                          background: '#581c87',
                          color: '#d8b4fe',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}
                      >
                        = ENGLISH
                      </span>
                    ) : (
                      <span
                        style={{
                          background: '#14532d',
                          color: '#86efac',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}
                      >
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333',
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            marginBottom: '12px',
            color: '#fff',
            fontWeight: '600',
          }}
        >
          Legend
        </h3>
        <div
          style={{
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: '#14532d',
                color: '#86efac',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            >
              OK
            </span>
            <span>Translated and different from English</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: '#581c87',
                color: '#d8b4fe',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            >
              = ENGLISH
            </span>
            <span>Same value as English (likely untranslated)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: '#7f1d1d',
                color: '#fca5a5',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            >
              MISSING
            </span>
            <span>Key defined in code but missing from Shopify</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: '#713f12',
                color: '#fde047',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            >
              EXTRA
            </span>
            <span>Exists in Shopify but not defined in code</span>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <details
        style={{
          marginTop: '24px',
          padding: '16px',
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333',
        }}
      >
        <summary style={{ cursor: 'pointer', color: '#888', fontSize: '13px' }}>
          Debug Info (click to expand)
        </summary>
        <pre
          style={{
            marginTop: '12px',
            fontSize: '11px',
            color: '#888',
            overflow: 'auto',
          }}
        >
          {JSON.stringify(
            {
              totalLanguages: languages.length,
              languagesQueried: languages.map((l) => ({
                localeCode: l.localeCode,
                shopifyLang: l.language,
                shopifyCountry: l.country,
                count: l.count,
              })),
            },
            null,
            2,
          )}
        </pre>
      </details>
    </div>
  );
}
