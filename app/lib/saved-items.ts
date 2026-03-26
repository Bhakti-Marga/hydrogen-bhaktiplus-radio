export type SavedItemType = 'station' | 'show' | 'track' | 'schedule_slot';

export interface SavedItem {
  id: string;
  type: SavedItemType;
  title: string;
  description?: string;
  imageUrl?: string;
  savedAt: string;
}

export const SAVED_ITEMS_METAFIELD_NAMESPACE = 'custom';
export const SAVED_ITEMS_METAFIELD_KEY = 'saved_items';

export function parseSavedItems(metafieldValue: string | null | undefined): SavedItem[] {
  if (!metafieldValue) return [];
  try {
    const parsed = JSON.parse(metafieldValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addSavedItem(items: SavedItem[], newItem: Omit<SavedItem, 'savedAt'>): SavedItem[] {
  if (items.some((item) => item.id === newItem.id)) return items;
  return [...items, {...newItem, savedAt: new Date().toISOString()}];
}

export function removeSavedItem(items: SavedItem[], itemId: string): SavedItem[] {
  return items.filter((item) => item.id !== itemId);
}

export function isSavedItem(items: SavedItem[], itemId: string): boolean {
  return items.some((item) => item.id === itemId);
}

export const SAVED_ITEM_TYPE_LABELS: Record<SavedItemType, string> = {
  station: 'Station',
  show: 'Show',
  track: 'Track',
  schedule_slot: 'Schedule',
};

export const SAVED_ITEM_TYPE_ICONS: Record<SavedItemType, string> = {
  station: 'radio',
  show: 'calendar',
  track: 'music',
  schedule_slot: 'clock',
};
