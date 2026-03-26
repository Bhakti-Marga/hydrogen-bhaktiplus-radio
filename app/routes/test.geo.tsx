import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const geoHeaders = {
    'oxygen-buyer-ip': request.headers.get('oxygen-buyer-ip'),
    'oxygen-buyer-country': request.headers.get('oxygen-buyer-country'),
    'oxygen-buyer-city': request.headers.get('oxygen-buyer-city'),
    'oxygen-buyer-region': request.headers.get('oxygen-buyer-region'),
    'oxygen-buyer-region-code': request.headers.get('oxygen-buyer-region-code'),
    'oxygen-buyer-continent': request.headers.get('oxygen-buyer-continent'),
    'oxygen-buyer-timezone': request.headers.get('oxygen-buyer-timezone'),
    'oxygen-buyer-latitude': request.headers.get('oxygen-buyer-latitude'),
    'oxygen-buyer-longitude': request.headers.get('oxygen-buyer-longitude'),
    'oxygen-buyer-postal-code': request.headers.get('oxygen-buyer-postal-code'),
    'oxygen-buyer-metro-code': request.headers.get('oxygen-buyer-metro-code'),
    'oxygen-buyer-is-eu-country': request.headers.get('oxygen-buyer-is-eu-country'),
    'accept-language': request.headers.get('accept-language'),
    'cf-ipcountry': request.headers.get('cf-ipcountry'), // Cloudflare fallback
  };

  return { geoHeaders };
}

export default function TestGeo() {
  const { geoHeaders } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Oxygen Geolocation Headers Test</h1>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        Note: These headers are only populated when deployed to Oxygen (production). In local dev, they will be null.
      </p>
      <pre style={{
        background: '#1a1a1a',
        color: '#00ff00',
        padding: '1rem',
        borderRadius: '8px',
        overflow: 'auto'
      }}>
        {JSON.stringify(geoHeaders, null, 2)}
      </pre>
    </div>
  );
}
