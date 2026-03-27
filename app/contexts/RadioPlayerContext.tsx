import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface RadioPlayerContextValue {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  share: () => void;
}

const RadioPlayerContext = createContext<RadioPlayerContextValue | null>(null);

export function RadioPlayerProvider({children}: {children: ReactNode}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);
  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  const share = useCallback(() => {
    if (typeof navigator === 'undefined') return;
    if (navigator.share) {
      navigator.share({
        title: 'Bhakti+ Radio',
        text: 'Listen to Bhakti+ Radio — 24/7 devotional streaming',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, []);

  return (
    <RadioPlayerContext.Provider
      value={{
        isPlaying,
        isMuted,
        volume,
        togglePlay,
        play,
        pause,
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
