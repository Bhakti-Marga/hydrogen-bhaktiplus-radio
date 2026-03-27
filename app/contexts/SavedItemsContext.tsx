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

export function SavedItemsProvider({children}: {children: ReactNode}) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
        window.location.href = '/account/login';
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
    </SavedItemsContext.Provider>
  );
}

export function useSavedItems() {
  return useContext(SavedItemsContext);
}
