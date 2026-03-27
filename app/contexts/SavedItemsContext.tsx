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
          <p className="body-b3 text-grey-dark opacity-70 mb-16">
            Sign in to unlock your personal radio experience.
          </p>

          <div className="text-left mb-24 flex flex-col gap-10">
            <div className="flex items-start gap-10">
              <svg className="w-16 h-16 text-gold shrink-0 mt-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <p className="body-b4 text-grey-light">Save your favourite tracks, shows, and stations</p>
            </div>
            <div className="flex items-start gap-10">
              <svg className="w-16 h-16 text-gold shrink-0 mt-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              <p className="body-b4 text-grey-light">Build your personal My Radio library</p>
            </div>
            <div className="flex items-start gap-10">
              <svg className="w-16 h-16 text-gold shrink-0 mt-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <p className="body-b4 text-grey-light">Access your library from any device</p>
            </div>
            <div className="flex items-start gap-10">
              <svg className="w-16 h-16 text-gold shrink-0 mt-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <p className="body-b4 text-grey-light">Get personalised recommendations</p>
            </div>
          </div>

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
