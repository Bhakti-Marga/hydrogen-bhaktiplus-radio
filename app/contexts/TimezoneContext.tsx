import {createContext, useContext, useState, useLayoutEffect, useCallback, type ReactNode} from 'react';
import {type TimezoneId, TIMEZONES, detectTimezone} from '~/lib/timezone';

interface TimezoneContextValue {
  timezone: TimezoneId;
  setTimezone: (tz: TimezoneId) => void;
  timezoneData: (typeof TIMEZONES)[TimezoneId];
}

const TimezoneContext = createContext<TimezoneContextValue | null>(null);

const STORAGE_KEY = 'bhakti-radio-timezone';

export function TimezoneProvider({children}: {children: ReactNode}) {
  const [timezone, setTimezoneState] = useState<TimezoneId>('europe');

  useLayoutEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as TimezoneId | null;
    if (stored && stored in TIMEZONES) {
      setTimezoneState(stored);
    } else {
      const detected = detectTimezone();
      setTimezoneState(detected);
      localStorage.setItem(STORAGE_KEY, detected);
    }
  }, []);

  const setTimezone = useCallback((tz: TimezoneId) => {
    setTimezoneState(tz);
    localStorage.setItem(STORAGE_KEY, tz);
  }, []);

  const value: TimezoneContextValue = {
    timezone,
    setTimezone,
    timezoneData: TIMEZONES[timezone],
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const ctx = useContext(TimezoneContext);
  if (!ctx) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return ctx;
}
