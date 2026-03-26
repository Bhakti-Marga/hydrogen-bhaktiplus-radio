import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { useState } from 'react';
import { TRANSLATIONS_QUERY } from '~/graphql/translations.query';
import { TRANSLATION_KEYS } from '~/lib/translations/keys';
import type { CountryCode, LanguageCode } from '@shopify/hydrogen/storefront-api-types';

// Languages to fetch translations for
const LANGUAGES_TO_CHECK = [
  { code: 'EN', country: 'US', label: 'English' },
  { code: 'DE', country: 'DE', label: 'German' },
  { code: 'ES', country: 'ES', label: 'Spanish' },
  { code: 'FR', country: 'FR', label: 'French' },
  { code: 'PT', country: 'BR', label: 'Portuguese' },
  { code: 'HI', country: 'IN', label: 'Hindi' },
] as const;

interface TranslationData {
  [key: string]: string;
}

interface LanguageTranslations {
  language: string;
  label: string;
  country: string;
  translations: TranslationData;
  count: number;
}

export async function loader({ context }: LoaderFunctionArgs) {
  const { storefront } = context;

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
    LANGUAGES_TO_CHECK.map(async (lang) => {
      const translations = await fetchAllTranslations(
        lang.country as CountryCode,
        lang.code as LanguageCode,
      );
      return {
        language: lang.code,
        label: lang.label,
        country: lang.country,
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
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareLang, setCompareLang] = useState<string>('DE');

  const currentLangData = languages.find((l) => l.language === selectedLang);
  const compareLangData = languages.find((l) => l.language === compareLang);

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
      return true;
    })
    .sort();

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        maxWidth: '1400px',
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
        Last fetched: {timestamp}
      </p>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: '#1a1a1a',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #333',
          }}
        >
          <div style={{ fontSize: '12px', color: '#888' }}>Defined in Code</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
            {definedKeysCount}
          </div>
        </div>
        {languages.map((lang) => (
          <div
            key={lang.language}
            style={{
              background:
                lang.language === selectedLang ? '#1e3a5f' : '#1a1a1a',
              padding: '16px',
              borderRadius: '8px',
              border:
                lang.language === selectedLang
                  ? '1px solid #3b82f6'
                  : '1px solid #333',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedLang(lang.language)}
          >
            <div style={{ fontSize: '12px', color: '#888' }}>
              {lang.label} ({lang.language})
            </div>
            <div
              style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}
            >
              {lang.count}
            </div>
          </div>
        ))}
      </div>

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
            onChange={(e) => setShowMissing(e.target.checked)}
          />
          <span>Show only missing</span>
        </label>
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
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#252525' }}>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #333',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#888',
                  width: '30%',
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
                {currentLangData?.label.toUpperCase()} VALUE
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
                  {compareLangData?.label.toUpperCase()} VALUE
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
                  width: '100px',
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
              const inCode = definedKeys.includes(key);
              const isMissing = !value;
              const isExtra = !inCode && value;

              return (
                <tr
                  key={key}
                  style={{
                    borderBottom: '1px solid #252525',
                    background: isMissing
                      ? 'rgba(239, 68, 68, 0.1)'
                      : isExtra
                        ? 'rgba(234, 179, 8, 0.1)'
                        : 'transparent',
                  }}
                >
                  <td
                    style={{
                      padding: '10px 12px',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      color: '#a5a5a5',
                    }}
                  >
                    {key}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontSize: '14px',
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
                        fontSize: '14px',
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
            <span>Translation exists in Shopify</span>
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
    </div>
  );
}

