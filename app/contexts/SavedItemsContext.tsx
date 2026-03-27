import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type {SavedItem, SavedItemType} from '~/lib/saved-items';

interface SavedItemsContextValue {
  savedItems: SavedItem[];
  isLoggedIn: boolean;
  isLoading: boolean;
  isSaved: (itemId: string) => boolean;
  toggleSave: (item: {
    id: string;
    type: SavedItemType;
    title: string;
    description?: string;
    imageUrl?: string;
  }) => void;
}

const SavedItemsContext = createContext<SavedItemsContextValue>({
  savedItems: [],
  isLoggedIn: false,
  isLoading: true,
  isSaved: () => false,
  toggleSave: () => {},
});

function LoginModal({onClose}: {onClose: () => void}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-16">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-brand border border-brand-light/30 rounded-2xl p-32 tablet:p-40 max-w-md w-full shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-16 right-16 text-grey-dark hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <div className="w-56 h-56 mx-auto mb-16 rounded-full bg-gold/15 flex items-center justify-center">
            <svg className="w-28 h-28 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>

          <h3 className="h2-md text-white mb-8">Save to My Radio</h3>
          <p className="body-b3 text-grey-dark opacity-70 mb-24">
            Sign in to save tracks, shows, and stations to your personal library.
          </p>

          <div className="flex flex-col gap-8">
            <a
              href="/account/login"
              className="btn btn--gold w-full text-center"
            >
              Sign In
            </a>
            <button
              onClick={onClose}
              className="btn btn--ghost w-full"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SavedItemsProvider({children}: {children: ReactNode}) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const didLoad = useRef(false);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;

    fetch('/api/saved-items')
      .then((res) => res.json())
      .then((data: {savedItems: SavedItem[]; isLoggedIn: boolean}) => {
        setSavedItems(data.savedItems || []);
        setIsLoggedIn(data.isLoggedIn ?? false);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const isSaved = useCallback(
    (itemId: string) => savedItems.some((item) => item.id === itemId),
    [savedItems],
  );

  const toggleSave = useCallback(
    (item: {
      id: string;
      type: SavedItemType;
      title: string;
      description?: string;
      imageUrl?: string;
    }) => {
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }

      const alreadySaved = isSaved(item.id);

      if (alreadySaved) {
        setSavedItems((prev) => prev.filter((s) => s.id !== item.id));
      } else {
        setSavedItems((prev) => [
          ...prev,
          {...item, savedAt: new Date().toISOString()},
        ]);
      }

      const formData = new FormData();
      formData.set('intent', alreadySaved ? 'remove' : 'save');
      formData.set('itemId', item.id);
      formData.set('type', item.type);
      formData.set('title', item.title);
      if (item.description) formData.set('description', item.description);
      if (item.imageUrl) formData.set('imageUrl', item.imageUrl);

      fetch('/api/saved-items', {method: 'POST', body: formData})
        .then((res) => res.json())
        .then((data: {savedItems?: SavedItem[]}) => {
          if (data.savedItems) setSavedItems(data.savedItems);
        })
        .catch(() => {});
    },
    [isLoggedIn, isSaved],
  );

  return (
    <SavedItemsContext.Provider
      value={{savedItems, isLoggedIn, isLoading, isSaved, toggleSave}}
    >
      {children}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </SavedItemsContext.Provider>
  );
}

export function useSavedItems() {
  return useContext(SavedItemsContext);
}
