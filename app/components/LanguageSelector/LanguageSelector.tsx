import { useState } from "react";
import { IconChevron, IconGlobe } from "../Icons";
import { useRootLoaderData, useUser } from "~/hooks";
import { useLocation } from "react-router";
import {
  buildUrl,
  type LanguageCode,
  VALID_LANGUAGE_CODES,
} from "~/lib/locale";

interface LanguageSelectorProps {
  variant?: "dropdown" | "buttons";
  /** Controls whether the dropdown menu appears above or below the button */
  menuPosition?: "above" | "below";
  /** Show border around the selector (for header) */
  withBorder?: boolean;
}

export function LanguageSelector({ 
  variant = "dropdown", 
  menuPosition = "below",
  withBorder = false,
}: LanguageSelectorProps) {
  const { countryCode, language, supportedCountries, supportedLanguages } = useRootLoaderData();
  const { isLoggedIn } = useUser();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Get current language from supportedLanguages (fetched from Media API)
  const currentLanguage = supportedLanguages?.find((l) => l.code === language);

  // All valid languages, sorted by native name
  const availableLanguages = supportedLanguages
    .filter((l) => VALID_LANGUAGE_CODES.has(l.code))
    .sort((a, b) => a.nativeName.localeCompare(b.nativeName));

  const handleLanguageSelect = async (languageCode: LanguageCode) => {
    setIsOpen(false);

    // Get current path without country/language prefix
    const pathSegments = location.pathname.split("/").filter(Boolean);
    let restOfPath = "/";

    if (pathSegments.length > 0) {
      const firstIsCountry = supportedCountries.some((c) => c.code === pathSegments[0]);
      if (firstIsCountry) {
        // Check if second segment is any valid language code
        const secondIsLanguage =
          pathSegments.length > 1 &&
          VALID_LANGUAGE_CODES.has(pathSegments[1]);

        const skipCount = secondIsLanguage ? 2 : 1;
        restOfPath = "/" + pathSegments.slice(skipCount).join("/") || "/";
      } else {
        restOfPath = location.pathname;
      }
    }

    // For logged-in users, persist the selection via API before navigating
    // We wait for the response to avoid a race condition where the page reloads
    // and fetches user preferences before the PUT has completed
    if (isLoggedIn) {
      try {
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferredLanguage: languageCode }),
        });
      } catch (error) {
        console.error('[LanguageSelector] Failed to persist language preference:', error);
        // Continue with navigation even if API call fails
      }
    }

    // Build new URL - for logged-in users the locale will be stripped by server,
    // but the preference is already saved. For non-logged-in users, include
    // query param to trigger cookie save on load.
    const newPath = buildUrl(countryCode, languageCode, restOfPath);
    const url = new URL(newPath, window.location.origin);
    
    // Only add query param for non-logged-in users (cookie-based preference)
    if (!isLoggedIn) {
      url.searchParams.set('setPreferredLanguage', languageCode);
    }
    
    window.location.href = url.toString();
  };

  if (variant === "buttons") {
    return (
      <div className="flex items-center gap-8">
        {availableLanguages.map((lang) => (
          <button
            key={lang!.code}
            onClick={() => handleLanguageSelect(lang!.code)}
            className={`px-12 py-6 rounded-full text-14 transition-colors ${
              lang!.code === language
                ? "bg-white text-brand font-medium"
                : "bg-transparent text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            {lang!.nativeName}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-8 px-12 py-8 rounded-full transition-colors ${
          withBorder
            ? "border border-white/40 bg-transparent hover:bg-white/10"
            : "bg-white/10 hover:bg-white/20"
        }`}
      >
        <IconGlobe className="w-16 h-16 text-white/80" />
        <span className="text-white/80 body-b3">{currentLanguage?.nativeName}</span>
        <IconChevron
          className={`w-12 h-12 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute bg-white rounded-lg shadow-lg overflow-hidden z-50 min-w-[180px] max-h-[50vh] overflow-y-auto right-0"
            style={menuPosition === "above"
              ? { bottom: '100%', marginBottom: '8px' }
              : { top: '100%', marginTop: '8px' }
            }
          >
            {availableLanguages.map((lang) => (
              <button
                key={lang!.code}
                onClick={() => handleLanguageSelect(lang!.code)}
                className={`w-full px-16 py-12 text-left body-b3 transition-colors ${
                  lang!.code === language
                    ? "bg-brand/10 text-brand font-medium"
                    : "text-brand hover:bg-grey-light"
                }`}
              >
                {lang!.nativeName}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
