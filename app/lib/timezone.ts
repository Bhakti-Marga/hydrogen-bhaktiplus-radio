export const TIMEZONES = {
  'america-east': {
    id: 'america-east',
    label: 'US East',
    shortLabel: 'EST',
    utcOffset: -5,
    flag: '🌎',
    iana: 'America/New_York',
  },
  'america-west': {
    id: 'america-west',
    label: 'US West',
    shortLabel: 'PST',
    utcOffset: -8,
    flag: '🌎',
    iana: 'America/Los_Angeles',
  },
  europe: {
    id: 'europe',
    label: 'Europe',
    shortLabel: 'EU',
    utcOffset: 1,
    flag: '🇪🇺',
    iana: 'Europe/Paris',
  },
  india: {
    id: 'india',
    label: 'India',
    shortLabel: 'IN',
    utcOffset: 5.5,
    flag: '🇮🇳',
    iana: 'Asia/Kolkata',
  },
  asia: {
    id: 'asia',
    label: 'Asia-Pacific',
    shortLabel: 'AP',
    utcOffset: 8,
    flag: '🌏',
    iana: 'Asia/Singapore',
  },
} as const;

export type TimezoneId = keyof typeof TIMEZONES;
export type Timezone = (typeof TIMEZONES)[TimezoneId];

export const TIMEZONE_IDS = Object.keys(TIMEZONES) as TimezoneId[];

const WEST_COAST_ZONES = new Set([
  'America/Los_Angeles', 'America/Vancouver', 'America/Tijuana',
  'America/Phoenix', 'America/Denver', 'America/Boise',
  'America/Edmonton', 'America/Regina', 'America/Anchorage',
  'America/Juneau', 'America/Sitka', 'America/Yakutat',
  'US/Pacific', 'US/Mountain', 'US/Alaska', 'US/Arizona',
  'Canada/Pacific', 'Canada/Mountain',
  'America/Dawson_Creek', 'America/Whitehorse',
]);

export function detectTimezone(): TimezoneId {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return 'europe';

    if (tz.startsWith('America/') || tz.startsWith('US/') || tz.startsWith('Canada/') || tz.startsWith('Brazil/')) {
      return WEST_COAST_ZONES.has(tz) ? 'america-west' : 'america-east';
    }
    if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta') || tz === 'Asia/Colombo') {
      return 'india';
    }
    if (
      tz.startsWith('Asia/') ||
      tz.startsWith('Australia/') ||
      tz.startsWith('Pacific/') ||
      tz.startsWith('Japan') ||
      tz === 'Asia/Tokyo' ||
      tz === 'Asia/Shanghai' ||
      tz === 'Asia/Singapore'
    ) {
      return 'asia';
    }
    if (
      tz.startsWith('Europe/') ||
      tz.startsWith('Africa/') ||
      tz === 'Atlantic/Reykjavik'
    ) {
      return 'europe';
    }
  } catch {
    // Intl not supported
  }
  return 'europe';
}

export function getLocalTime(tzId: TimezoneId): string {
  const tz = TIMEZONES[tzId];
  return new Date().toLocaleTimeString('en-US', {
    timeZone: tz.iana,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export interface ScheduleSlot {
  time: string;
  title: string;
  type: 'kirtan' | 'satsang' | 'prayer' | 'live-show' | 'music' | 'stories';
}

const SCHEDULE_BASE: ScheduleSlot[] = [
  {time: '06:00', title: 'Morning Prayer & Mantra', type: 'prayer'},
  {time: '07:00', title: 'Sunrise Kirtan Session', type: 'kirtan'},
  {time: '09:00', title: 'Daily Satsang', type: 'satsang'},
  {time: '11:00', title: 'Devotional Music Mix', type: 'music'},
  {time: '13:00', title: 'Saints and Divine Stories', type: 'stories'},
  {time: '15:00', title: 'Afternoon Kirtan Circle', type: 'kirtan'},
  {time: '17:00', title: 'Evening Prayer & Mantra', type: 'prayer'},
  {time: '19:00', title: 'Satsang Replay', type: 'satsang'},
  {time: '21:00', title: 'Night Kirtan Session', type: 'kirtan'},
  {time: '23:00', title: 'Late Night Devotional', type: 'music'},
];

const TIMEZONE_SPECIFIC: Partial<Record<TimezoneId, ScheduleSlot[]>> = {
  'america-east': [
    {time: '20:00', title: 'Americas Live Show', type: 'live-show'},
  ],
  'america-west': [
    {time: '18:00', title: 'Americas Live Show', type: 'live-show'},
  ],
  europe: [
    {time: '18:00', title: 'Europe Evening Satsang', type: 'satsang'},
  ],
  india: [
    {time: '05:00', title: 'Brahma Muhurta Meditation', type: 'prayer'},
    {time: '19:30', title: 'India Prime Time Kirtan', type: 'kirtan'},
  ],
  asia: [
    {time: '20:00', title: 'Asia-Pacific Live Session', type: 'live-show'},
  ],
};

export function getSchedule(tzId: TimezoneId): ScheduleSlot[] {
  const specific = TIMEZONE_SPECIFIC[tzId] || [];
  const merged = [...SCHEDULE_BASE, ...specific];
  return merged.sort((a, b) => a.time.localeCompare(b.time));
}

export function getCurrentSlot(tzId: TimezoneId): ScheduleSlot | null {
  const schedule = getSchedule(tzId);
  const now = getLocalTime(tzId);
  let current: ScheduleSlot | null = null;
  for (const slot of schedule) {
    if (slot.time <= now) {
      current = slot;
    }
  }
  return current || schedule[schedule.length - 1];
}

export const SLOT_TYPE_LABELS: Record<ScheduleSlot['type'], string> = {
  kirtan: 'Kirtan',
  satsang: 'Satsang',
  prayer: 'Prayer',
  'live-show': 'LIVE',
  music: 'Music',
  stories: 'Stories',
};

export const SLOT_TYPE_COLORS: Record<ScheduleSlot['type'], string> = {
  kirtan: 'bg-purple/30 text-white',
  satsang: 'bg-gold/30 text-white',
  prayer: 'bg-gold/25 text-white',
  'live-show': 'bg-red/30 text-white',
  music: 'bg-brand-lighter/30 text-white',
  stories: 'bg-orange/30 text-white',
};

export interface ContextualCTA {
  label: string;
  url: string;
  icon: 'external' | 'play' | 'music' | 'heart';
}

export const SLOT_TYPE_CTAS: Record<ScheduleSlot['type'], ContextualCTA> = {
  kirtan: {
    label: 'Join Kirtan Circle',
    url: 'https://kirtan-circle.org',
    icon: 'heart',
  },
  satsang: {
    label: 'Watch on Bhakti+',
    url: 'https://bhakti.plus',
    icon: 'play',
  },
  prayer: {
    label: 'Lyrics & Bhajans',
    url: 'https://atma-bhog.org',
    icon: 'music',
  },
  'live-show': {
    label: 'Upcoming Events',
    url: 'https://events.bhaktimarga.org',
    icon: 'external',
  },
  music: {
    label: 'Listen on Spotify',
    url: 'https://open.spotify.com/artist/bhaktimarga',
    icon: 'music',
  },
  stories: {
    label: 'Watch on Bhakti+',
    url: 'https://bhakti.plus',
    icon: 'play',
  },
};
