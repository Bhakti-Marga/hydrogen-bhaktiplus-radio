import {useState, useEffect, useLayoutEffect, useRef, useCallback} from 'react';
import {useTimezone} from '~/contexts/TimezoneContext';
import {TIMEZONES, TIMEZONE_IDS, getLocalTime, type TimezoneId} from '~/lib/timezone';

export function TimezoneSwitcher({variant = 'header'}: {variant?: 'header' | 'inline'}) {
  const {timezone, setTimezone, timezoneData} = useTimezone();
  const [isOpen, setIsOpen] = useState(false);
  const [localTime, setLocalTime] = useState('');

  useLayoutEffect(() => {
    setLocalTime(getLocalTime(timezone));
  }, [timezone]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTime(getLocalTime(timezone));
    }, 30000);
    return () => clearInterval(interval);
  }, [timezone]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  if (variant === 'header') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-4 text-grey-light hover:text-white transition-colors text-12 font-figtree font-500 px-8 py-4 rounded-md hover:bg-brand-light/30"
          aria-label="Change timezone"
        >
          <span>{timezoneData.flag}</span>
          <span className="hidden desktop:inline">{timezoneData.shortLabel}</span>
          <span className="text-grey-dark text-10">{localTime}</span>
          <svg className={`w-10 h-10 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-4 bg-brand border border-brand-light/30 rounded-lg shadow-dropdown overflow-hidden min-w-[200px]" style={{zIndex: 9999}}>
            {TIMEZONE_IDS.map((tzId) => {
              const tz = TIMEZONES[tzId];
              const isActive = tzId === timezone;
              return (
                <TimezoneOption
                  key={tzId}
                  tzId={tzId}
                  tz={tz}
                  isActive={isActive}
                  onSelect={() => {
                    setTimezone(tzId);
                    setIsOpen(false);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-brand-light/30 rounded-lg p-2">
      {TIMEZONE_IDS.map((tzId) => {
        const tz = TIMEZONES[tzId];
        const isActive = tzId === timezone;
        return (
          <button
            key={tzId}
            onClick={() => setTimezone(tzId)}
            className={`flex items-center gap-4 px-12 py-8 rounded-md text-12 font-figtree font-500 transition-all ${
              isActive
                ? 'bg-brand-light text-white'
                : 'text-grey-dark hover:text-white hover:bg-brand-light/50'
            }`}
          >
            <span>{tz.flag}</span>
            <span>{tz.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TimezoneOption({
  tzId,
  tz,
  isActive,
  onSelect,
}: {
  tzId: TimezoneId;
  tz: (typeof TIMEZONES)[TimezoneId];
  isActive: boolean;
  onSelect: () => void;
}) {
  const [time, setTime] = useState('');

  useLayoutEffect(() => {
    setTime(getLocalTime(tzId));
  }, [tzId]);

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-12 px-16 py-12 text-left transition-colors ${
        isActive
          ? 'bg-brand-light text-white'
          : 'text-grey-light hover:bg-brand-light/50 hover:text-white'
      }`}
    >
      <span className="text-16">{tz.flag}</span>
      <div className="flex-1 min-w-0">
        <p className="text-14 font-500">{tz.label}</p>
      </div>
      <span className="text-12 text-grey-dark font-figtree">{time}</span>
      {isActive && (
        <svg className="w-14 h-14 text-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </button>
  );
}
