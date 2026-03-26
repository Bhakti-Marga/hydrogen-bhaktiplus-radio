import type { LoaderFunctionArgs } from 'react-router';
import { MOBILE_APP } from '~/lib/constants';

/**
 * Android App Links asset links file
 *
 * This enables the BhaktiPlus Android app to claim specific URLs from the website.
 * When a user taps a link and has the app installed, Android will open the app
 * directly instead of the browser.
 *
 * Configure via ANDROID_APP_FINGERPRINT environment variable (SHA256 cert fingerprint).
 *
 * @see https://developer.android.com/training/app-links/verify-android-applinks
 */
export async function loader({ context }: LoaderFunctionArgs) {

  if (!MOBILE_APP.FINGERPRINT) {
    console.error('ANDROID_APP_FINGERPRINT environment variable is not set');
    return new Response(JSON.stringify({ error: 'Configuration error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const assetlinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls', 'delegate_permission/common.get_login_creds'],
      target: {
        namespace: 'android_app',
        package_name: MOBILE_APP.ANDROID_PACKAGE_NAME,
        sha256_cert_fingerprints: [MOBILE_APP.FINGERPRINT, MOBILE_APP.FINGERPRINT_2],
      },
    },
  ];

  return new Response(JSON.stringify(assetlinks), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Cache for 24 hours
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
