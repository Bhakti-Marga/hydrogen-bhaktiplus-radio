import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export interface PlayerSource {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  imageUrl?: string;
  type: 'radio' | 'station' | 'show';
  badge?: string;
  badgeColor?: string;
}

interface RadioPlayerContextValue {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  source: PlayerSource | null;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  playSource: (source: PlayerSource) => void;
  backToRadio: () => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  share: () => void;
}

const RadioPlayerContext = createContext<RadioPlayerContextValue | null>(null);

export function RadioPlayerProvider({children}: {children: ReactNode}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [source, setSource] = useState<PlayerSource | null>(null);

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);
  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  const playSource = useCallback((s: PlayerSource) => {
    setSource(s);
    setIsPlaying(true);
  }, []);

  const backToRadio = useCallback(() => {
    setSource(null);
    setIsPlaying(true);
  }, []);

  const share = useCallback(() => {
    if (typeof navigator === 'undefined') return;
    const text = source
      ? `Listen to ${source.title} on Bhakti+ Radio`
      : 'Listen to Bhakti+ Radio — 24/7 devotional streaming';
    if (navigator.share) {
      navigator.share({title: 'Bhakti+ Radio', text, url: window.location.href});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [source]);

  return (
    <RadioPlayerContext.Provider
      value={{
        isPlaying,
        isMuted,
        volume,
        source,
        togglePlay,
        play,
        pause,
        playSource,
        backToRadio,
        toggleMute,
        setVolume,
        share,
      }}
    >
      {children}
    </RadioPlayerContext.Provider>
  );
}

export function useRadioPlayer() {
  const ctx = useContext(RadioPlayerContext);
  if (!ctx) {
    throw new Error('useRadioPlayer must be used within a RadioPlayerProvider');
  }
  return ctx;
}
