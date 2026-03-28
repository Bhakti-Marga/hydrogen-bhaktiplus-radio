import {useState, useEffect, useLayoutEffect} from 'react';
import {Stack} from '~/components/Stack';
import {Cover} from '~/components/Cover';
import {Container} from '~/components/Container';
import {TimezoneSwitcher} from '~/components/TimezoneSwitcher';
import {SaveButton} from '~/components/SaveButton';
import {useTimezone} from '~/contexts/TimezoneContext';
import {useRadioPlayer, type PlayerSource} from '~/contexts/RadioPlayerContext';
import {
  getCurrentSlot,
  getSchedule,
  getLocalTime,
  SLOT_TYPE_LABELS,
  SLOT_TYPE_COLORS,
  SLOT_TYPE_CTAS,
  type ScheduleSlot,
  type ContextualCTA,
} from '~/lib/timezone';
import heroIndia from '~/assets/hero-india.png';
import heroOther from '~/assets/hero-other.png';
import iconMainRadio from '~/assets/stations/main-radio.png';
import logoImg from '~/assets/logo.png';
import iconMantraRadio from '~/assets/stations/mantra-radio.png';
import iconStoriesRadio from '~/assets/stations/stories-radio.png';
import iconKirtanCircle from '~/assets/stations/kirtan-circle.png';
import showFriday from '~/assets/shows/friday-bhakti-live.png';
import showSaturday from '~/assets/shows/saturday-kirtan-night.jpg';
import showSunday from '~/assets/shows/sunday-program.png';
import paramahamsaPhoto from '~/assets/paramahamsa-vishwananda.jpeg';
import gurujiSingPhoto from '~/assets/guruji-sing1.jpeg';
import kirtanPhoto from '~/assets/kirtan-session.jpg';

const RADIO_STATIONS = [
  {
    id: 'main',
    name: 'Bhakti+ Radio',
    description: 'The main Bhakti Marga radio — 24/7 across 4 time zones',
    gradient: 'gradient-brand',
    icon: iconMainRadio,
  },
  {
    id: 'mantra',
    name: 'Mantra Radio',
    description: 'Sri Vitthala Giridhari Parabrahmane Namah — 24/7',
    gradient: 'gradient-purple',
    icon: iconMantraRadio,
  },
  {
    id: 'stories',
    name: 'Saints and Divine Stories',
    subtitle: 'by Paramahamsa Vishwananda',
    description: 'Divine inspiring stories of Bhakti Yoga Saints — 24/7',
    gradient: 'gradient-purple-dark',
    icon: iconStoriesRadio,
  },
  {
    id: 'guruji-kirtan',
    name: 'Kirtan with the Master',
    subtitle: 'Kirtan Sessions sung by Paramahamsa Vishwananda',
    description: 'The most sacred kirtans performed by Paramahamsa Vishwananda Himself — 24/7',
    gradient: 'gradient-brand',
    icon: iconMainRadio,
  },
  {
    id: 'kirtan-circle',
    name: 'Kirtan Circle Radio',
    description: 'Community Kirtans from around the world — 24/7',
    gradient: 'gradient-brand',
    icon: iconKirtanCircle,
  },
];

const STATION_PLAYLISTS: Record<string, {title: string; artist: string}[]> = {
  mantra: [
    {title: 'Sri Vitthala Giridhari', artist: 'Paramahamsa Vishwananda'},
    {title: 'Om Namo Narayanaya', artist: 'Bhakti Marga'},
    {title: 'Govinda Jaya Jaya', artist: 'Bhakti Marga'},
    {title: 'Hare Krishna Maha Mantra', artist: 'Bhakti Marga'},
    {title: 'Sri Vitthala Giridhari (Extended)', artist: 'Paramahamsa Vishwananda'},
    {title: 'Om Namo Bhagavate', artist: 'Bhakti Marga'},
  ],
  stories: [
    {title: 'The Story of Prahlad', artist: 'Paramahamsa Vishwananda'},
    {title: 'Mirabai — The Saint of Devotion', artist: 'Paramahamsa Vishwananda'},
    {title: 'The Grace of Hanuman', artist: 'Paramahamsa Vishwananda'},
    {title: 'Krishna and the Gopis', artist: 'Paramahamsa Vishwananda'},
    {title: 'The Life of Tukaram', artist: 'Paramahamsa Vishwananda'},
    {title: 'Narasimha — Divine Protection', artist: 'Paramahamsa Vishwananda'},
  ],
  'guruji-kirtan': [
    {title: 'Radhe Govinda', artist: 'Paramahamsa Vishwananda'},
    {title: 'Jay Gurudev', artist: 'Paramahamsa Vishwananda'},
    {title: 'Govinda Hari', artist: 'Paramahamsa Vishwananda'},
    {title: 'Om Jai Jagdish', artist: 'Paramahamsa Vishwananda'},
    {title: 'Vitthala Vitthala', artist: 'Paramahamsa Vishwananda'},
    {title: 'Narayana Hari Om', artist: 'Paramahamsa Vishwananda'},
  ],
  'kirtan-circle': [
    {title: 'Hare Krishna Kirtan', artist: 'Kirtan Circle Community'},
    {title: 'Shiva Shambo', artist: 'Kirtan Circle Community'},
    {title: 'Govinda Jaya Jaya', artist: 'Berlin Kirtan Group'},
    {title: 'Radhe Radhe', artist: 'London Kirtan Circle'},
    {title: 'Om Namah Shivaya', artist: 'Kirtan Circle Community'},
    {title: 'Jai Hanuman', artist: 'Paris Kirtan Circle'},
  ],
};

function getStationNowPlaying(stationId: string) {
  const playlist = STATION_PLAYLISTS[stationId];
  if (!playlist) return null;
  const hourIndex = new Date().getHours() % playlist.length;
  return playlist[hourIndex];
}

function StationNowPlaying({stationId}: {stationId: string}) {
  const track = getStationNowPlaying(stationId);
  const {source, isPlaying} = useRadioPlayer();
  const isThisPlaying = source?.id === stationId && isPlaying;
  if (!track) return null;

  return (
    <div className={`flex items-center gap-8 mt-12 pt-10 border-t border-white/10 ${isThisPlaying ? 'opacity-100' : 'opacity-60'}`}>
      <div className="w-6 h-6 rounded-full bg-gold shrink-0 animate-pulse" />
      <p className="text-10 text-grey-light truncate">
        <span className="text-white font-500">{track.title}</span>
        <span className="text-grey-dark"> — {track.artist}</span>
      </p>
    </div>
  );
}

const FEATURES = [
  {
    title: '24/7 Streaming',
    description: 'Continuous devotional content across 4 time zones',
  },
  {
    title: 'Live Shows',
    description: 'Sunday Bhakti Live Show, Saturday Kirtan Night & more',
  },
  {
    title: '40+ Albums',
    description: 'Access to the full Bhakti Marga music library',
  },
  {
    title: 'Global Community',
    description: 'Connect with devotees worldwide through shared listening',
  },
  {
    title: '8 Languages',
    description: 'Radio content localized for global audiences (Phase 2)',
  },
  {
    title: 'Premium Content',
    description: 'Direct access to Bhakti+ premium satsangs and kirtans',
  },
];

interface ShowData extends PlayerSource {
  image: string;
  host?: string;
  description: string;
  saveId: string;
  dayOfWeek: number;
  hour: number;
  minute: number;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getShowDates(dayOfWeek: number, hour: number, minute: number) {
  const now = new Date();
  const cetOffset = 1;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const cet = new Date(utc + cetOffset * 3600000);

  const currentDay = cet.getDay();
  let daysUntilNext = (dayOfWeek - currentDay + 7) % 7;
  if (daysUntilNext === 0) {
    const showTimeTodayCET = new Date(cet);
    showTimeTodayCET.setHours(hour, minute, 0, 0);
    if (cet > showTimeTodayCET) daysUntilNext = 7;
  }

  const next = new Date(cet);
  next.setDate(cet.getDate() + daysUntilNext);
  next.setHours(hour, minute, 0, 0);

  const last = new Date(next);
  last.setDate(last.getDate() - 7);

  const fmt = (d: Date) => `${SHORT_DAYS[d.getDay()]} ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} CET`;

  return {
    nextDate: `${fmt(next)} — ${timeStr}`,
    lastDate: fmt(last),
    pastEpisodes: Array.from({length: 4}, (_, i) => {
      const d = new Date(last);
      d.setDate(d.getDate() - i * 7);
      return {date: d, label: `${fmt(d)} ${d.getFullYear()}`};
    }),
  };
}

const WEEKLY_SHOWS: ShowData[] = [
  {
    id: 'friday-bhakti-live',
    title: 'Friday Bhakti Live Show',
    subtitle: 'with Mayatita Das',
    host: 'Mayatita Das',
    description: 'Laughter, devotion, and spontaneous joy — the unmissable weekly live show that brings Bhakti to life.',
    image: 'friday',
    type: 'show',
    badge: 'Live',
    badgeColor: 'bg-red/90 text-white',
    saveId: 'show:friday-bhakti-live',
    dayOfWeek: 5,
    hour: 21,
    minute: 0,
  },
  {
    id: 'saturday-kirtan-night',
    title: 'Saturday Kirtan Night',
    subtitle: 'Bhakti Marga Artists',
    description: 'A sacred musical evening — devotional kirtan led by Bhakti Marga artists from around the world.',
    image: 'saturday',
    type: 'show',
    badge: 'Kirtan',
    badgeColor: 'bg-purple/90 text-white',
    saveId: 'show:saturday-kirtan-night',
    dayOfWeek: 6,
    hour: 21,
    minute: 0,
  },
  {
    id: 'sunday-program',
    title: 'Sunday Program',
    subtitle: 'Weekly Gathering',
    description: 'The weekly spiritual gathering — satsang, prayers, and collective devotion to start the week in grace.',
    image: 'sunday',
    type: 'show',
    badge: 'Program',
    badgeColor: 'bg-gold/90 text-brand',
    saveId: 'show:sunday-program',
    dayOfWeek: 0,
    hour: 17,
    minute: 30,
  },
];

function AudioWaveBars({count = 5, className = '', animated, forMainRadio}: {count?: number; className?: string; animated?: boolean; forMainRadio?: boolean}) {
  const {isPlaying, source} = useRadioPlayer();
  const mainRadioPlaying = !source && isPlaying;
  const active = animated ?? (forMainRadio ? mainRadioPlaying : isPlaying);

  return (
    <div className={`flex items-end gap-2 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`w-[3px] bg-gold rounded-full ${active ? 'animate-[audioWave_1s_ease-in-out_infinite]' : ''}`}
          style={{
            height: active ? '14px' : '8px',
            animationDelay: active ? `${i * 0.12}s` : undefined,
            transition: 'height 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

function ContextualCTAButton({cta}: {cta: ContextualCTA}) {
  const iconMap = {
    external: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
      </svg>
    ),
    play: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    ),
    music: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    ),
    heart: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  };

  return (
    <a
      href={cta.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-4 text-10 font-600 text-gold hover:text-gold-light transition-colors bg-gold/10 hover:bg-gold/20 px-10 py-4 rounded-full"
    >
      {iconMap[cta.icon]}
      {cta.label}
    </a>
  );
}

function PlayButton({size = 'lg', className = ''}: {size?: 'sm' | 'lg'; className?: string}) {
  const {isPlaying, source, togglePlay, backToRadio} = useRadioPlayer();
  const isMainRadioPlaying = !source && isPlaying;
  const dimensions = size === 'sm' ? 'w-36 h-36' : 'w-56 h-56';
  const iconSize = size === 'sm' ? 'w-14 h-14' : 'w-20 h-20';

  const handleClick = () => {
    if (source) {
      backToRadio();
    } else {
      togglePlay();
    }
  };

  return (
    <button
      className={`${dimensions} rounded-full bg-gold flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200 ${className}`}
      aria-label={isMainRadioPlaying ? 'Pause' : 'Play'}
      onClick={handleClick}
    >
      {isMainRadioPlaying ? (
        <svg className={`${iconSize} text-brand`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
        </svg>
      ) : (
        <svg className={`${iconSize} text-brand ml-1`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}

const SHOW_IMAGES: Record<string, string> = {
  friday: showFriday,
  saturday: showSaturday,
  sunday: showSunday,
};

function ShowCard({show}: {show: ShowData}) {
  const {source, isPlaying, playSource, togglePlay} = useRadioPlayer();
  const [showEpisodes, setShowEpisodes] = useState(false);
  const isThisPlaying = source?.id === show.id && isPlaying;
  const isThisSelected = source?.id === show.id;
  const dates = getShowDates(show.dayOfWeek, show.hour, show.minute);

  const handleClick = () => {
    if (isThisSelected) {
      togglePlay();
    } else {
      playSource(show);
    }
  };

  const handlePlayEpisode = (ep: {label: string}) => {
    playSource({
      ...show,
      id: `${show.id}:${ep.label}`,
      subtitle: `Episode — ${ep.label}`,
    });
  };

  return (
    <div className="flex flex-col">
      <div
        className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] group"
        onClick={handleClick}
      >
        <img
          src={SHOW_IMAGES[show.image]}
          alt=""
          className={`w-full aspect-[16/10] object-cover ${show.id === 'saturday-kirtan-night' ? 'object-right' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent" />
        {show.id === 'saturday-kirtan-night' && (
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/80 via-transparent to-transparent" />
        )}

        {/* Play overlay on hover */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <div className={`w-56 h-56 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform duration-200 group-hover:scale-110 ${
            isThisPlaying ? 'bg-gold' : 'bg-gold/90'
          }`}>
            {isThisPlaying ? (
              <svg className="w-24 h-24 text-brand" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-24 h-24 text-brand ml-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </div>

        {/* Badge */}
        <div className="absolute top-12 left-12 flex items-center gap-8">
          <span className={`text-10 font-700 uppercase px-10 py-4 rounded-full ${show.badgeColor}`}>
            {show.badge}
          </span>
          {isThisPlaying && (
            <span className="text-10 font-700 uppercase px-8 py-4 rounded-full bg-gold/20 text-gold flex items-center gap-4">
              <span className="w-6 h-6 rounded-full bg-gold animate-pulse" />
              Playing
            </span>
          )}
        </div>

        {show.id === 'saturday-kirtan-night' && (
          <div className="absolute top-12 right-12">
            <img src={iconKirtanCircle} alt="" className="w-32 h-32 rounded-md" />
          </div>
        )}

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-20">
          <p className="text-10 font-700 uppercase text-gold tracking-wider mb-4">
            Next: {dates.nextDate}
          </p>
          <h3 className="h2-md text-white mb-4">{show.title}</h3>
          {show.host && <p className="body-b4 text-gold-light mb-4">with {show.host}</p>}
          <p className="body-b5 text-grey-dark opacity-60">Last: {dates.lastDate}</p>
        </div>
      </div>

      {/* Previous episodes toggle */}
      <button
        className="mt-8 text-12 font-600 text-grey-dark hover:text-gold transition-colors flex items-center gap-4 self-start"
        onClick={() => setShowEpisodes((v) => !v)}
      >
        <svg className={`w-12 h-12 transition-transform ${showEpisodes ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
        Previous episodes
      </button>

      {/* Episodes list */}
      <div className={`overflow-hidden transition-all duration-300 ${showEpisodes ? 'max-h-[300px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-col gap-2">
          {dates.pastEpisodes.map((ep) => {
            const epId = `${show.id}:${ep.label}`;
            const isEpPlaying = source?.id === epId && isPlaying;
            return (
              <button
                key={ep.label}
                onClick={() => handlePlayEpisode(ep)}
                className={`flex items-center gap-12 px-12 py-10 rounded-lg transition-colors text-left ${
                  isEpPlaying ? 'bg-brand-light/80 ring-1 ring-gold/30' : 'bg-brand-light/20 hover:bg-brand-light/40'
                }`}
              >
                <div className={`w-28 h-28 rounded-full flex items-center justify-center shrink-0 ${
                  isEpPlaying ? 'bg-gold' : 'bg-brand-light/50'
                }`}>
                  {isEpPlaying ? (
                    <svg className="w-12 h-12 text-brand" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-12 h-12 text-gold ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-12 font-500 truncate ${isEpPlaying ? 'text-white' : 'text-grey-light'}`}>
                    {show.title}
                  </p>
                  <p className="text-10 text-grey-dark opacity-60">{ep.label}</p>
                </div>
                {isEpPlaying && <AudioWaveBars count={3} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StationPlayOverlay({stationId}: {stationId: string}) {
  const {source, isPlaying} = useRadioPlayer();
  const isThisPlaying = source?.id === stationId && isPlaying;

  return (
    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 z-10 ${
      isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
    }`}>
      <div className={`w-56 h-56 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform duration-200 group-hover:scale-110 ${
        isThisPlaying ? 'bg-gold' : 'bg-gold/80'
      }`}>
        {isThisPlaying ? (
          <svg className="w-24 h-24 text-brand" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-24 h-24 text-brand ml-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>
    </div>
  );
}

function StationPlayingBadge({stationId}: {stationId: string}) {
  const {source, isPlaying} = useRadioPlayer();
  if (!(source?.id === stationId && isPlaying)) return null;
  return (
    <span className="text-10 font-700 uppercase px-8 py-4 rounded-full bg-gold/20 text-gold flex items-center gap-4">
      <span className="w-6 h-6 rounded-full bg-gold animate-pulse" />
      Playing
    </span>
  );
}

function BottomPlayerBar({player, currentSlot, timezoneData, schedule}: {
  player: ReturnType<typeof useRadioPlayer>;
  currentSlot: ScheduleSlot | null;
  timezoneData: {flag: string; label: string};
  schedule: ScheduleSlot[];
}) {
  const [showHistory, setShowHistory] = useState(false);

  const recentSlots = schedule
    .filter((slot) => slot.time <= (currentSlot?.time || '24:00'))
    .reverse()
    .slice(0, 8);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Accordion: Recently Played */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        showHistory ? 'max-h-[320px]' : 'max-h-0'
      }`}>
        <div className="bg-brand/98 backdrop-blur-md border-t border-brand-light/20 px-12 tablet:px-24 pt-12 pb-4">
          <div className="max-w-[1536px] mx-auto">
            <p className="text-10 font-700 uppercase text-gold tracking-wider mb-8">Recently Played</p>
            <div className="flex flex-col gap-2">
              {recentSlots.map((slot, i) => {
                const isNow = i === 0;
                return (
                  <div
                    key={`history-${slot.time}-${i}`}
                    className={`flex items-center gap-10 px-10 py-6 rounded-md transition-colors ${
                      isNow ? 'bg-brand-light/50' : 'hover:bg-brand-light/20'
                    }`}
                  >
                    {isNow ? (
                      <span className="w-6 h-6 rounded-full bg-gold animate-pulse shrink-0" />
                    ) : (
                      <span className="w-6 h-6 shrink-0" />
                    )}
                    <span className="text-10 text-grey-dark font-figtree w-32 shrink-0">
                      {isNow ? 'Now' : slot.time}
                    </span>
                    <span className={`text-8 font-700 uppercase px-6 py-1 rounded-full shrink-0 ${SLOT_TYPE_COLORS[slot.type]}`}>
                      {SLOT_TYPE_LABELS[slot.type]}
                    </span>
                    <span className={`text-12 font-500 truncate ${isNow ? 'text-white' : 'text-grey-light'}`}>
                      {slot.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Player Bar */}
      <div className="bg-brand/95 backdrop-blur-md border-t border-brand-light/30">
        <div className="flex items-center justify-between px-12 tablet:px-24 py-8 max-w-[1536px] mx-auto gap-12">
          {/* Left: Album art + track info */}
          <div className="flex items-center gap-12 min-w-0 flex-1">
            <div className="w-48 h-48 rounded-md bg-brand-light shrink-0 overflow-hidden flex items-center justify-center">
              {player.source?.type === 'show' && player.source.image ? (
                <img
                  src={SHOW_IMAGES[player.source.image] || ''}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : player.source?.type === 'station' ? (
                <img
                  src={RADIO_STATIONS.find(s => s.id === player.source?.image)?.icon || iconMainRadio}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-24 h-24 text-gold opacity-60" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="body-b4 font-600 text-white truncate">
                {player.source ? player.source.title : (currentSlot?.title || 'Bhakti+ Radio')}
              </p>
              <p className="body-b5 text-grey-dark opacity-60 truncate">
                {player.source
                  ? player.source.subtitle
                  : `Bhakti+ Radio — ${timezoneData.flag} ${timezoneData.label}`
                }
              </p>
              {player.source ? (
                <div className="mt-2 flex items-center gap-8">
                  <span className={`text-10 font-700 uppercase px-8 py-2 rounded-full hidden tablet:inline-block ${player.source.badgeColor || 'bg-gold/20 text-gold'}`}>
                    {player.source.badge}
                  </span>
                  <button
                    className="text-10 font-600 text-gold hover:text-gold-light transition-colors"
                    onClick={player.backToRadio}
                  >
                    ← Live Radio
                  </button>
                </div>
              ) : currentSlot ? (
                <div className="mt-2 hidden tablet:block">
                  <ContextualCTAButton cta={SLOT_TYPE_CTAS[currentSlot.type]} />
                </div>
              ) : null}
            </div>
          </div>

          {/* Center: Play/Pause button + wave */}
          <div className="flex items-center gap-16 shrink-0">
            <button
              className="w-36 h-36 rounded-full bg-gold flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200"
              aria-label={player.isPlaying ? 'Pause' : 'Play'}
              onClick={player.togglePlay}
            >
              {player.isPlaying ? (
                <svg className="w-14 h-14 text-brand" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-14 h-14 text-brand ml-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <div className="hidden tablet:flex items-center">
              <AudioWaveBars count={16} />
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Volume (desktop) */}
            <div className="hidden tablet:flex relative items-center">
              <button
                className={`p-4 transition-colors ${player.isMuted ? 'text-red' : 'text-grey-dark hover:text-white'}`}
                aria-label={player.isMuted ? 'Unmute' : 'Mute'}
                onClick={player.toggleMute}
              >
                {player.isMuted ? (
                  <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={player.isMuted ? 0 : player.volume}
                onChange={(e) => player.setVolume(Number(e.target.value))}
                className="w-[80px] h-4 appearance-none bg-brand-light rounded-full cursor-pointer accent-gold"
                aria-label="Volume"
              />
            </div>

            {/* Save (desktop) */}
            <div className="hidden tablet:block">
              <SaveButton
                itemId={`track:${currentSlot?.title || 'bhakti-radio'}`}
                type="track"
                title={currentSlot?.title || 'Bhakti+ Radio'}
                description={`Bhakti+ Radio — ${timezoneData.label}`}
              />
            </div>

            {/* Share (desktop) */}
            <button
              className="hidden tablet:block text-grey-dark hover:text-white transition-colors p-4"
              aria-label="Share"
              onClick={player.share}
            >
              <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
              </svg>
            </button>

            {/* Recently Played toggle (burger) */}
            <button
              className={`p-4 transition-colors ${showHistory ? 'text-gold' : 'text-grey-dark hover:text-white'}`}
              aria-label="Recently Played"
              onClick={() => setShowHistory((v) => !v)}
            >
              <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>

            {/* Stations (desktop) */}
            <button
              className="hidden tablet:inline-flex btn btn--sm btn--ghost text-12"
              onClick={() => document.getElementById('radio-stations')?.scrollIntoView({behavior: 'smooth'})}
            >
              Stations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RadioHomepage() {
  const {timezone, timezoneData} = useTimezone();
  const player = useRadioPlayer();
  const [currentSlot, setCurrentSlot] = useState<ScheduleSlot | null>(null);
  const [localTime, setLocalTime] = useState('');
  const schedule = getSchedule(timezone);

  useLayoutEffect(() => {
    setCurrentSlot(getCurrentSlot(timezone));
    setLocalTime(getLocalTime(timezone));
  }, [timezone]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlot(getCurrentSlot(timezone));
      setLocalTime(getLocalTime(timezone));
    }, 30000);
    return () => clearInterval(interval);
  }, [timezone]);

  const slotLabel = currentSlot ? SLOT_TYPE_LABELS[currentSlot.type] : 'LIVE';
  const slotColor = currentSlot ? SLOT_TYPE_COLORS[currentSlot.type] : 'bg-gold/20 text-gold';

  return (
    <div className="homepage pb-[72px]">
      <Stack gap={7} className="tablet:gap-sp-8">
        {/* Hero Section with integrated Now Playing */}
        <div className="relative -mt-[var(--header-height)]">
          {/* Hero background image — changes per timezone */}
          <img
            src={timezone === 'india' ? heroIndia : heroOther}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover tablet:object-center ${
              timezone === 'india' ? 'object-[80%_center]' : 'object-[45%_center]'
            }`}
          />
          <div className="absolute inset-0 bg-brand-dark/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/50 via-brand-dark/20 to-brand-dark" />

          <section className="hero relative w-full pt-[var(--header-height)]">
            <Cover minHeight="100vh" mobileMinHeight="100vh">
              <div className="my-auto">
                <Container>
                  <div className="max-w-3xl mx-auto text-center">
                    <Stack gap={3}>
                      {/* Branding */}
                      <Stack gap={2}>
                        <p className="h3-sm text-gold tracking-wider">
                          BHAKTI MARGA
                        </p>
                        <h1 className="h1-lg text-white" style={{textWrap: 'balance'}}>
                          BHAKTI+ RADIO<br />
                          <span className="text-gold">&amp; PODCAST</span>
                        </h1>
                      </Stack>

                      <div className="hidden tablet:block">
                        <p className="body-b1 text-grey-dark opacity-70 max-w-xl mx-auto">
                          One World. One Frequency. Millions of hearts connected to Divine Love.
                        </p>
                      </div>
                      <p className="body-b2 text-grey-dark opacity-70 tablet:hidden">
                        One World. One Frequency. Millions of hearts connected to Divine Love.
                      </p>

                      {/* Now Playing — timezone aware */}
                      <div className="mt-24 mx-auto w-full max-w-lg">
                        <div className="bg-brand-light/60 backdrop-blur-sm rounded-xl p-16 tablet:p-20">
                          <div className="flex items-center gap-16">
                            <PlayButton size="lg" />
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-8 mb-4">
                                <span className={`text-10 font-700 uppercase tracking-wider px-8 py-2 rounded-full ${slotColor}`}>
                                  {slotLabel}
                                </span>
                                <AudioWaveBars count={5} forMainRadio />
                                <span className="text-10 text-grey-dark ml-auto">{timezoneData.flag} {localTime}</span>
                              </div>
                              <p className="h2-sm text-white truncate">
                                {currentSlot?.title || 'Bhakti+ Radio'}
                              </p>
                              <p className="body-b4 text-grey-dark opacity-70 truncate">
                                Bhakti+ Radio — {timezoneData.label}
                              </p>
                              {currentSlot && (
                                <div className="mt-4">
                                  <ContextualCTAButton cta={SLOT_TYPE_CTAS[currentSlot.type]} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CTA buttons */}
                      <div className="flex flex-col tablet:flex-row gap-8 tablet:gap-12 justify-center mt-8">
                        <button
                          className="btn btn--secondary"
                          onClick={() => document.getElementById('radio-stations')?.scrollIntoView({behavior: 'smooth'})}
                        >
                          Explore Stations
                        </button>
                      </div>

                      {/* Scroll indicator */}
                      <div className="mt-24 animate-pulse-down">
                        <svg className="w-24 h-24 mx-auto text-gold opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </Stack>
                  </div>
                </Container>
              </div>
            </Cover>
          </section>
        </div>

        {/* Today's Schedule — timezone aware */}
        <Container className="scroll-mt-80" id="todays-schedule">
          <Stack gap={4}>
            <div className="flex flex-col tablet:flex-row items-start tablet:items-center justify-between gap-16">
              <div>
                <p className="h3-sm text-gold mb-4">TODAY'S SCHEDULE</p>
                <h2 className="h2-md text-white">
                  {timezoneData.flag} {timezoneData.label} — {localTime}
                </h2>
              </div>
              <TimezoneSwitcher variant="inline" />
            </div>
            <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-8">
              {schedule.slice(0, 9).map((slot, i) => {
                const isNow = currentSlot?.time === slot.time && currentSlot?.title === slot.title;
                const color = SLOT_TYPE_COLORS[slot.type];
                return (
                  <div
                    key={`${slot.time}-${i}`}
                    className={`flex items-center gap-12 p-12 rounded-lg transition-colors ${
                      isNow ? 'bg-brand-light/80 ring-1 ring-gold/30' : 'bg-brand-light/30 hover:bg-brand-light/50'
                    }`}
                  >
                    <span className="text-14 font-figtree font-600 text-grey-dark w-40 shrink-0">
                      {slot.time}
                    </span>
                    <span className={`text-10 font-700 uppercase px-8 py-1 rounded-full shrink-0 ${color}`}>
                      {SLOT_TYPE_LABELS[slot.type]}
                    </span>
                    <span className={`body-b4 truncate ${isNow ? 'text-white font-600' : 'text-grey-light'}`}>
                      {slot.title}
                    </span>
                    {isNow && <AudioWaveBars count={3} className="ml-auto shrink-0" forMainRadio />}
                  </div>
                );
              })}
            </div>
          </Stack>
        </Container>

        {/* Radio Stations */}
        <Container id="radio-stations" className="scroll-mt-80">
          <Stack gap={4}>
            <div className="text-center">
              <p className="h3-sm text-gold mb-8">OUR STATIONS</p>
              <h2 className="h1-md text-white">5 Unique Radio Experiences</h2>
            </div>
            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-16">
              {/* Main Radio — full width hero card */}
              <div className="tablet:col-span-2 relative rounded-xl overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-card-hover gradient-brand">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/30 via-transparent to-brand-dark/30" />
                <div className="relative p-24 tablet:p-40 desktop:p-48">
                  <div className="flex flex-col tablet:flex-row items-center gap-24 tablet:gap-40">
                    <div className="hidden tablet:flex shrink-0 flex-col items-start">
                      <img src={logoImg} alt="Bhakti+" className="w-auto h-48 mb-4" />
                      <span className="font-avenir-next font-700 text-20 text-gold tracking-[0.3em] uppercase ml-2">Radio</span>
                    </div>
                    <div className="flex-1 text-center tablet:text-left">
                      <p className="h3-sm text-gold mb-8">MAIN STATION</p>
                      <h3 className="h1-md text-white mb-12 hidden tablet:block">Bhakti+ Radio</h3>
                      <p className="body-b1 text-grey-light opacity-80 max-w-2xl mb-8">
                        The heart of Bhakti Marga, broadcasting 24/7 across 4 time zones. 
                        Satsang, kirtan sessions, prayers, live shows, and devotional music — 
                        a continuous stream connecting thousands of hearts worldwide.
                      </p>
                      <div className="flex flex-wrap gap-8 justify-center tablet:justify-start mb-16">
                        <span className="text-10 font-600 uppercase px-10 py-4 rounded-full bg-gold/15 text-gold">Satsang</span>
                        <span className="text-10 font-600 uppercase px-10 py-4 rounded-full bg-purple/15 text-purple">Kirtan</span>
                        <span className="text-10 font-600 uppercase px-10 py-4 rounded-full bg-gold/15 text-gold-light">Prayers</span>
                        <span className="text-10 font-600 uppercase px-10 py-4 rounded-full bg-red/15 text-red">Live Shows</span>
                        <span className="text-10 font-600 uppercase px-10 py-4 rounded-full bg-brand-lighter/15 text-grey-light">Music</span>
                      </div>
                      <div className="flex flex-wrap gap-12 items-center justify-center tablet:justify-start">
                        <button className="btn btn--gold" onClick={player.backToRadio}>
                          Listen Now
                        </button>
                        <button
                          className="btn btn--ghost"
                          onClick={() => document.getElementById('todays-schedule')?.scrollIntoView({behavior: 'smooth'})}
                        >
                          See Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {RADIO_STATIONS.filter(s => s.id !== 'main').map((station) => {
                const stationSource: PlayerSource = {
                  id: station.id,
                  title: station.name,
                  subtitle: station.description,
                  type: 'station',
                  image: station.id,
                };
                const handleStationClick = () => {
                  if (player.source?.id === station.id) {
                    player.togglePlay();
                  } else {
                    player.playSource(stationSource);
                  }
                };

                if (station.id === 'guruji-kirtan') {
                  return (
                    <div
                      key={station.id}
                      className="relative gradient-brand rounded-xl overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-card-hover flex group"
                      onClick={handleStationClick}
                    >
                      <StationPlayOverlay stationId={station.id} />
                      <div className="flex-1 p-24 tablet:p-32 relative z-20 pointer-events-none">
                        <Stack gap={2}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-8">
                              <span className="text-10 font-700 uppercase px-10 py-4 rounded-full bg-gold/20 text-gold">New</span>
                              <StationPlayingBadge stationId={station.id} />
                            </div>
                          </div>
                          <h3 className="h2-lg text-white">{station.name}</h3>
                          <p className="body-b3 text-gold-light font-500 -mt-8">
                            {(station as any).subtitle}
                          </p>
                          <p className="body-b2 text-grey-light opacity-90">
                            {station.description}
                          </p>
                          <StationNowPlaying stationId={station.id} />
                        </Stack>
                      </div>
                      <div className="w-[120px] tablet:w-[180px] desktop:w-[220px] shrink-0">
                        <img
                          src={gurujiSingPhoto}
                          alt="Paramahamsa Vishwananda singing kirtan"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    </div>
                  );
                }

                if (station.id === 'stories') {
                  return (
                    <div
                      key={station.id}
                      className="relative gradient-purple-dark rounded-xl overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-card-hover flex group"
                      onClick={handleStationClick}
                    >
                      <StationPlayOverlay stationId={station.id} />
                      <div className="flex-1 p-24 tablet:p-32 relative z-20 pointer-events-none">
                        <Stack gap={2}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-8">
                              <img src={station.icon} alt={station.name} className="w-56 h-56 rounded-lg object-cover" />
                              <StationPlayingBadge stationId={station.id} />
                            </div>
                          </div>
                          <h3 className="h2-lg text-white">{station.name}</h3>
                          <p className="body-b3 text-gold-light font-500 -mt-8">
                            {(station as any).subtitle}
                          </p>
                          <p className="body-b2 text-grey-light opacity-90">
                            {station.description}
                          </p>
                          <StationNowPlaying stationId={station.id} />
                        </Stack>
                      </div>
                      <div className="w-[120px] tablet:w-[180px] desktop:w-[220px] shrink-0">
                        <img
                          src={paramahamsaPhoto}
                          alt="Paramahamsa Vishwananda"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    </div>
                  );
                }

                if (station.id === 'mantra') {
                  return (
                    <div
                      key={station.id}
                      className="relative gradient-purple rounded-xl p-24 tablet:p-32 cursor-pointer transition-shadow duration-300 hover:shadow-card-hover group"
                      onClick={handleStationClick}
                    >
                      <StationPlayOverlay stationId={station.id} />
                      <div className="relative z-20 pointer-events-none">
                        <Stack gap={2}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-8">
                              <img src={station.icon} alt={station.name} className="w-56 h-56 rounded-lg object-cover" />
                              <StationPlayingBadge stationId={station.id} />
                            </div>
                          </div>
                          <h3 className="h2-lg text-white">{station.name}</h3>
                          <p className="body-b2 text-grey-light opacity-90">
                            {station.description}
                          </p>
                          <div className="mt-8 pt-16 border-t border-white/10">
                            <p className="text-10 font-700 uppercase text-gold tracking-wider mb-8">
                              The Power of the Divine Name
                            </p>
                            <p className="body-b4 text-grey-light opacity-80 italic leading-relaxed">
                              In the Bhakti tradition, the Name of God is not separate from God.
                              To chant is to connect. To repeat is to remember. To remember is to come closer.
                              This mantra carries within it protection, love, and the presence of the Divine.
                              By focusing on it, one aligns both inner and outer life with a higher purpose — whether the aim is spiritual growth, clarity, or support in daily life.
                            </p>
                          </div>
                          <StationNowPlaying stationId={station.id} />
                        </Stack>
                      </div>
                    </div>
                  );
                }

                if (station.id === 'kirtan-circle') {
                  return (
                    <div
                      key={station.id}
                      className="relative gradient-brand rounded-xl overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-card-hover flex group"
                      onClick={handleStationClick}
                    >
                      <StationPlayOverlay stationId={station.id} />
                      <div className="flex-1 p-24 tablet:p-32 relative z-20 pointer-events-none">
                        <Stack gap={2}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-8">
                              <img src={station.icon} alt={station.name} className="w-56 h-56 rounded-lg object-cover" />
                              <StationPlayingBadge stationId={station.id} />
                            </div>
                          </div>
                          <h3 className="h2-lg text-white">{station.name}</h3>
                          <p className="body-b2 text-grey-light opacity-90">
                            {station.description}
                          </p>
                          <StationNowPlaying stationId={station.id} />
                        </Stack>
                      </div>
                      <div className="w-[120px] tablet:w-[180px] desktop:w-[220px] shrink-0">
                        <img
                          src={kirtanPhoto}
                          alt="Kirtan Circle community kirtan"
                          className="w-full h-full object-cover object-left"
                        />
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </Stack>
        </Container>

        {/* Weekly Live Shows & Podcasts */}
        <Container id="weekly-shows" className="scroll-mt-80">
          <Stack gap={4}>
            <div className="text-center">
              <p className="h3-sm text-gold mb-8">WEEKLY SHOWS</p>
              <h2 className="h1-md text-white">Live Shows &amp; Podcasts</h2>
            </div>
            <div className="grid grid-cols-1 tablet:grid-cols-3 gap-16">
              {WEEKLY_SHOWS.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          </Stack>
        </Container>

        {/* Content Strategy Section */}
        <div className="relative">
          <div className="absolute inset-0 bhakti-gradient opacity-50" />
          <Container className="relative">
            <div className="py-64 tablet:py-96">
              <Stack gap={4}>
                <div className="text-center max-w-3xl mx-auto">
                  <p className="h3-sm text-gold mb-8">CONTENT</p>
                  <h2 className="h1-md text-white mb-16" style={{textWrap: 'balance'}}>
                    A Rich Library of Devotional Content
                  </h2>
                  <p className="body-b1 text-grey-dark opacity-70">
                    Leveraging 40+ albums, satsangs, kirtans, prayers, and community content.
                    A perfect balance between devotional music, spiritual teachings, and live shows.
                  </p>
                </div>
              </Stack>
            </div>
          </Container>
        </div>

        {/* Features Grid */}
        <Container>
          <Stack gap={4}>
            <div className="text-center">
              <p className="h3-sm text-gold mb-8">PLATFORM</p>
              <h2 className="h1-md text-white">Why Bhakti+ Radio</h2>
            </div>
            <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-16">
              {FEATURES.map((feature, index) => (
                <div
                  key={index}
                  className="bg-brand-light/50 rounded-xl p-24 border border-brand-lighter/10"
                >
                  <Stack gap={1.5}>
                    <h3 className="h2-sm text-white">{feature.title}</h3>
                    <p className="body-b3 text-grey-dark opacity-70">
                      {feature.description}
                    </p>
                  </Stack>
                </div>
              ))}
            </div>
          </Stack>
        </Container>

        {/* Community Section */}
        <Container>
          <div className="relative w-full overflow-hidden rounded-2xl gradient-purple p-32 tablet:p-64 text-center">
            <Stack gap={3}>
              <p className="h3-sm text-gold-light">COMMUNITY</p>
              <h2 className="h1-md text-white" style={{textWrap: 'balance'}}>
                Build &amp; Activate a Global<br />Bhakti Marga Artist Community
              </h2>
              <p className="body-b1 text-grey-light opacity-80 max-w-2xl mx-auto">
                Kirtan leaders, singers, DJs — broadcast top artists on the radio and create mutually beneficial
                partnerships through promotion, affiliation, and educational programs.
              </p>
              <div className="mt-16">
                <button className="btn btn--gold">
                  Join the Community
                </button>
              </div>
            </Stack>
          </div>
        </Container>

        {/* CTA / Subscribe Section */}
        <Container>
          <div className="py-32 tablet:py-64 text-center">
            <Stack gap={3}>
              <h2 className="h1-md text-white">
                Ready to Listen?
              </h2>
              <p className="body-b1 text-grey-dark opacity-70 max-w-xl mx-auto">
                Connect to the global Bhakti Marga frequency. Available on web, iOS, and Android.
              </p>
              <div className="flex flex-col tablet:flex-row gap-12 justify-center mt-16">
                <button className="btn">
                  Start Listening — Free
                </button>
                <a href="https://bhakti.plus" className="btn btn--secondary">
                  Explore Bhakti+
                </a>
              </div>
            </Stack>
          </div>
        </Container>
      </Stack>

      {/* Fixed Bottom Player Bar */}
      <BottomPlayerBar
        player={player}
        currentSlot={currentSlot}
        timezoneData={timezoneData}
        schedule={schedule}
      />
    </div>
  );
}
