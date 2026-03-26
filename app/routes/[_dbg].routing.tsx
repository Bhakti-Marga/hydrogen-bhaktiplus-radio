import { useState, useCallback } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { getRequestGeolocation } from '~/lib/geo';
import {
  parseLocaleFromUrl,
  buildUrl,
  getCountry,
  SUPPORTED_COUNTRIES,
  detectLocaleForAnonymousUser,
  parseAcceptLanguage,
  parseAcceptLanguageCountry,
} from '~/lib/locale';
import { getClientStoreContext, determineStore } from '~/lib/store-routing';
import { userContext, userProfileContext, localeContext } from '~/lib/middleware';

// Skip the normal page layout (header, footer, etc.)
export const handle = { skipLayout: true };

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { env, detectedCountry } = context;
  const { countryCode } = context.get(localeContext);

  // GeoIP detection
  const geoResult = getRequestGeolocation(request);

  // Accept-Language parsing
  const acceptLanguageHeader = request.headers.get('accept-language');

  // What would happen for anonymous user at root
  const anonymousDetection = detectLocaleForAnonymousUser(
    geoResult.countryCode,
    acceptLanguageHeader,
  );
  const wouldRedirectTo = anonymousDetection.countryCode
    ? buildUrl(anonymousDetection.countryCode, anonymousDetection.language, '/')
    : null;

  // Auth state - from middleware context
  const user = context.get(userContext);
  const userProfile = context.get(userProfileContext);

  // Store routing - uses countryCode from locale cascade, not raw detectedCountry
  const storeRouting = {
    isLoggedIn: !!user,
    determination: determineStore(user ? userProfile : null, countryCode),
    clientContext: getClientStoreContext(user ? userProfile : null, countryCode, env),
  };

  // Headers (useful subset)
  const headers = {
    'accept-language': acceptLanguageHeader,
    'oxygen-buyer-country': request.headers.get('oxygen-buyer-country'),
    'cf-ipcountry': request.headers.get('cf-ipcountry'),
  };

  return {
    // Your Context - computed from current request
    yourContext: {
      geoip: {
        countryCode: geoResult.countryCode,
        source: geoResult.source,
      },
      acceptLanguage: {
        raw: acceptLanguageHeader,
        parsedLanguage: parseAcceptLanguage(acceptLanguageHeader),
        parsedCountry: parseAcceptLanguageCountry(acceptLanguageHeader),
      },
      anonymousDetection,
      wouldRedirectTo,
      storeRouting,
      headers,
    },
    // Default URL to load in iframe
    defaultPath: `/${countryCode}`,
    supportedCountries: SUPPORTED_COUNTRIES.map(c => ({ code: c.code, name: c.name })),
  };
}

export default function RoutingDebug() {
  const data = useLoaderData<typeof loader>();
  const [inputPath, setInputPath] = useState(data.defaultPath);
  const [iframeSrc, setIframeSrc] = useState(data.defaultPath);

  // Parse the URL client-side
  const urlAnalysis = parseLocaleFromUrl(iframeSrc);
  const countryConfig = getCountry(urlAnalysis.countryCode);

  const handleLoad = useCallback(() => {
    setIframeSrc(inputPath);
  }, [inputPath]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoad();
    }
  }, [handleLoad]);

  return (
    <div style={styles.container}>
      {/* Top bar with URL input */}
      <div style={styles.topBar}>
        <label htmlFor="url-input" style={styles.label}>URL:</label>
        <input
          id="url-input"
          type="text"
          value={inputPath}
          onChange={(e) => setInputPath(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.input}
          placeholder="/us/videos"
        />
        <button onClick={handleLoad} style={styles.button}>
          Load
        </button>
      </div>

      {/* Main content: iframe + sidebar */}
      <div style={styles.mainContent}>
        {/* Iframe panel */}
        <div style={styles.iframePanel}>
          <iframe
            src={iframeSrc}
            style={styles.iframe}
            title="Page Preview"
          />
        </div>

        {/* Sidebar panel */}
        <div style={styles.sidebar}>
          {/* URL Analysis */}
          <Section title="URL Analysis" data={{
            input: iframeSrc,
            parsed: {
              countryCode: urlAnalysis.countryCode,
              language: urlAnalysis.language,
              restOfPath: urlAnalysis.restOfPath,
            },
            countryConfig: countryConfig ? {
              name: countryConfig.name,
              currency: countryConfig.currency,
            } : null,
          }} />

          {/* Your Context */}
          <Section title="Your Context" data={data.yourContext} />

          {/* Quick Links */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Quick Links</h3>
            <div style={styles.quickLinks}>
              {data.supportedCountries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setInputPath(`/${c.code}`);
                    setIframeSrc(`/${c.code}`);
                  }}
                  style={styles.quickLinkButton}
                >
                  {c.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, data }: { title: string; data: unknown }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <pre style={styles.pre}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
    fontFamily: 'ui-monospace, monospace',
    fontSize: '13px',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#161b22',
    borderBottom: '1px solid #30363d',
  },
  label: {
    color: '#8b949e',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    color: '#c9d1d9',
    fontSize: '14px',
    fontFamily: 'ui-monospace, monospace',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#238636',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  iframePanel: {
    flex: '0 0 70%',
    borderRight: '1px solid #30363d',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: '#ffffff',
  },
  sidebar: {
    flex: '0 0 30%',
    overflow: 'auto',
    padding: '16px',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    color: '#7ee787',
    fontSize: '14px',
    marginBottom: '8px',
    paddingBottom: '4px',
    borderBottom: '1px solid #30363d',
  },
  pre: {
    backgroundColor: '#161b22',
    padding: '12px',
    borderRadius: '6px',
    overflow: 'auto',
    margin: 0,
    border: '1px solid #30363d',
    fontSize: '12px',
    maxHeight: '300px',
  },
  quickLinks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  quickLinkButton: {
    padding: '4px 12px',
    backgroundColor: '#21262d',
    border: '1px solid #30363d',
    borderRadius: '4px',
    color: '#c9d1d9',
    cursor: 'pointer',
    fontSize: '12px',
  },
};
