import type { LoaderFunctionArgs } from 'react-router';
import { MOBILE_APP } from '~/lib/constants';

/**
 * Apple App Site Association (AASA) file for Universal Links
 *
 * This enables the BhaktiPlus iOS app to claim specific URLs from the website.
 * When a user taps a link and has the app installed, iOS will open the app
 * directly instead of Safari.
 *
 * @see https://developer.apple.com/documentation/xcode/supporting-associated-domains
 */
export async function loader({ context }: LoaderFunctionArgs) {
  const appleTeamId = context.env.APPLE_TEAM_ID;

  if (!appleTeamId) {
    console.error('APPLE_TEAM_ID environment variable is not set');
    return new Response(JSON.stringify({ error: 'Configuration error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const aasa = {
    applinks: {
      apps: [],
      details: [
        {
          appID: `${appleTeamId}.${MOBILE_APP.IOS_BUNDLE_ID}`,
          paths: [
            '/video',
            '/video/*',
            '/pilgrimages',
            '/pilgrimages/*',
            '/commentaries',
            '/commentaries/*',
            '/satsangs',
            '/satsangs/*',
            '/livestreams',
            '/livestreams/*',
            '/live',
            '/live/*',
          ],
        },
      ],
    },
  };

  return new Response(JSON.stringify(aasa), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Cache for 24 hours - iOS caches this file anyway
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

