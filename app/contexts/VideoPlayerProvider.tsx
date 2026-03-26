import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react";

interface VideoPlayerContextValue {
  // Hover card state (existing)
  expandedCardId: string | null;
  expandedPortalContainerId: string | null;
  setExpandedCard: (cardId: string | null, portalContainerId: string | null) => void;

  // Video playback state (new)
  playingVideoId: string | null;
  playingVideoType: 'hover' | 'background' | null;
  stopSignal: number;
  registerPlayingVideo: (videoId: string, type: 'hover' | 'background') => void;
  stopAllVideos: () => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextValue | undefined>(undefined);

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [expandedPortalContainerId, setExpandedPortalContainerId] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [playingVideoType, setPlayingVideoType] = useState<'hover' | 'background' | null>(null);
  const [stopSignal, setStopSignal] = useState(0);

  const setExpandedCard = useCallback((cardId: string | null, portalContainerId: string | null) => {
    setExpandedCardId(cardId);
    setExpandedPortalContainerId(portalContainerId);
  }, []);

  const registerPlayingVideo = useCallback((videoId: string, type: 'hover' | 'background') => {
    // If a different video is already playing, stop it first
    if (playingVideoId && playingVideoId !== videoId) {
      setStopSignal(prev => prev + 1);
    }

    setPlayingVideoId(videoId);
    setPlayingVideoType(type);
  }, [playingVideoId]);

  const stopAllVideos = useCallback(() => {
    setStopSignal(prev => prev + 1);
    setPlayingVideoId(null);
    setPlayingVideoType(null);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    expandedCardId,
    expandedPortalContainerId,
    setExpandedCard,
    playingVideoId,
    playingVideoType,
    stopSignal,
    registerPlayingVideo,
    stopAllVideos
  }), [
    expandedCardId,
    expandedPortalContainerId,
    setExpandedCard,
    playingVideoId,
    playingVideoType,
    stopSignal,
    registerPlayingVideo,
    stopAllVideos
  ]);

  return (
    <VideoPlayerContext.Provider value={contextValue}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error("useVideoPlayer must be used within a VideoPlayerProvider");
  }
  return context;
}
