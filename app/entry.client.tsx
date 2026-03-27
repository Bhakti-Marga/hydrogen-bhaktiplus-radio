import {RemixBrowser} from '@remix-run/react';
import {StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';

if (!window.location.origin.includes('webcache.googleusercontent.com')) {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>,
  );
}
