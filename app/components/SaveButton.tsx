import {useSavedItems} from '~/contexts/SavedItemsContext';
import type {SavedItemType} from '~/lib/saved-items';

interface SaveButtonProps {
  itemId: string;
  type: SavedItemType;
  title: string;
  description?: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
}

const SIZES = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
};

export function SaveButton({
  itemId,
  type,
  title,
  description,
  imageUrl,
  size = 'md',
  variant = 'icon',
  className = '',
}: SaveButtonProps) {
  const {isSaved, toggleSave, isLoading} = useSavedItems();
  const saved = isSaved(itemId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave({id: itemId, type, title, description, imageUrl});
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`inline-flex items-center gap-6 text-12 font-600 px-12 py-6 rounded-full transition-all duration-200 ${
          saved
            ? 'bg-gold/20 text-gold'
            : 'bg-brand-light/50 text-grey-dark hover:text-gold hover:bg-gold/10'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
      >
        <svg className={SIZES[size]} viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        {saved ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`p-4 transition-all duration-200 ${
        saved
          ? 'text-gold scale-110'
          : 'text-grey-dark hover:text-gold'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
    >
      <svg className={SIZES[size]} viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
