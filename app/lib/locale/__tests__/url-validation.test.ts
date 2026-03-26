import { describe, it, expect } from 'vitest';
import {
  parseLocaleFromUrl,
  validateUrlLocale,
} from '../index';

describe('URL Locale Validation', () => {
  describe('Valid URLs', () => {
    it('should accept root path', () => {
      expect(validateUrlLocale('/')).toEqual({ valid: true });
    });

    it('should accept valid country code only', () => {
      expect(validateUrlLocale('/us')).toEqual({ valid: true });
      expect(validateUrlLocale('/gb')).toEqual({ valid: true });
      expect(validateUrlLocale('/de')).toEqual({ valid: true });
    });

    it('should accept valid country + default language', () => {
      expect(validateUrlLocale('/us/en')).toEqual({ valid: true });
      expect(validateUrlLocale('/fr/fr')).toEqual({ valid: true });
    });

    it('should accept valid country + available non-default language', () => {
      expect(validateUrlLocale('/us/es')).toEqual({ valid: true }); // Spanish in US
      expect(validateUrlLocale('/ca/fr')).toEqual({ valid: true }); // French in Canada
      expect(validateUrlLocale('/in/hi')).toEqual({ valid: true }); // Hindi in India
    });

    it('should accept valid country + content path', () => {
      expect(validateUrlLocale('/us/videos')).toEqual({ valid: true });
      expect(validateUrlLocale('/us/satsangs')).toEqual({ valid: true });
      expect(validateUrlLocale('/de/account')).toEqual({ valid: true });
    });

    it('should accept valid country + language + content path', () => {
      expect(validateUrlLocale('/us/es/videos')).toEqual({ valid: true });
      expect(validateUrlLocale('/ca/fr/satsangs')).toEqual({ valid: true });
    });

    it('should accept valid content paths without locale prefix', () => {
      // Known content paths are valid without country prefix
      expect(validateUrlLocale('/satsangs')).toEqual({ valid: true });
      expect(validateUrlLocale('/account')).toEqual({ valid: true });
      expect(validateUrlLocale('/commentaries')).toEqual({ valid: true });
      expect(validateUrlLocale('/pilgrimages')).toEqual({ valid: true });
      expect(validateUrlLocale('/talks')).toEqual({ valid: true });
    });
  });

  describe('Invalid URLs - Should 404', () => {
    it('should reject short invalid locale codes', () => {
      const result = validateUrlLocale('/asdf');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid path');
    });

    it('should reject long gibberish paths', () => {
      const result = validateUrlLocale('/asd0f8j');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid path');
    });

    it('should reject unknown paths that look like content', () => {
      const result = validateUrlLocale('/some-random-path');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid path');
    });

    it('should reject invalid country codes with content paths', () => {
      const result = validateUrlLocale('/xyz/videos');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid path');
    });

    it('should reject language-only URLs (language without country)', () => {
      // 'en' is a valid language but NOT a valid country
      const result = validateUrlLocale('/en/satsangs');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid path');
    });

    it('should reject invalid language codes after valid country', () => {
      const result = validateUrlLocale('/us/asdf/satsangs');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid language code');
    });

    it('should accept any valid language in any country', () => {
      // Any valid language is allowed in any country
      expect(validateUrlLocale('/us/fr/videos')).toEqual({ valid: true });
      expect(validateUrlLocale('/de/hi/videos')).toEqual({ valid: true });
      expect(validateUrlLocale('/gb/ja/videos')).toEqual({ valid: true });
    });
  });

  describe('Edge Cases', () => {
    it('should handle uppercase locale codes', () => {
      expect(validateUrlLocale('/US')).toEqual({ valid: true });
      expect(validateUrlLocale('/US/ES')).toEqual({ valid: true });
    });

    it('should handle mixed case', () => {
      expect(validateUrlLocale('/Us/Es/videos')).toEqual({ valid: true });
    });

    it('should handle trailing slashes', () => {
      expect(validateUrlLocale('/us/')).toEqual({ valid: true });
      expect(validateUrlLocale('/us/es/')).toEqual({ valid: true });
    });

    it('should reject short invalid codes that look like locales', () => {
      // 'xx' looks like a country code but isn't valid
      const result = validateUrlLocale('/xx');
      expect(result.valid).toBe(false);
    });

    it('should reject short unknown paths that look like locale codes', () => {
      // 'id' is 2 chars and looks like it could be a locale code
      // Since it's not a valid country, language, or content path, it should 404
      const result = validateUrlLocale('/id');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid path');
    });
  });
});

describe('parseLocaleFromUrl - Current Behavior', () => {
  // These tests document current behavior
  // parseLocaleFromUrl returns defaults for invalid locales
  // but doesn't tell us whether the URL should 404

  it('returns defaults for invalid country', () => {
    const result = parseLocaleFromUrl('/asdf');
    expect(result.countryCode).toBe('us');
    expect(result.language).toBe('en');
    expect(result.restOfPath).toBe('/asdf');
  });

  it('returns defaults for language-only URL', () => {
    const result = parseLocaleFromUrl('/en/satsangs');
    // 'en' is not a country, so should return default country
    expect(result.countryCode).toBe('us');
    expect(result.restOfPath).toBe('/en/satsangs');
  });
});
