import { IconOrnamentLine } from '~/components/Icons/IconOrnamentLine';

export type Genre = 'Darshan' | 'Event' | 'Q&A' | 'Exclusive';

interface GenreEyebrowProps {
  /** The genre value from the API (e.g., 'Darshan', 'Event'). Optional - if not provided, only contentType is shown. */
  genre?: Genre;
  /** The content type label (e.g., 'Satsang', 'Talk', 'Live') */
  contentType: string;
  /** The parent content title (e.g., 'Bhagavad Gita' for Commentary, 'Vrindavan 2024' for Pilgrimage). 
   * When provided and contentType is 'Commentary' or 'Pilgrimage', this is shown instead of the contentType. */
  contentTitle?: string;
  className?: string;
}

/**
 * Displays a genre-specific text eyebrow above video titles.
 * Shows genre in gold italic display-serif followed by content type in gold Avenir Next.
 * If no genre is provided, only the content type is shown.
 * For Commentary and Pilgrimage types, shows the parent content title instead.
 * Includes decorative ornament line underneath that scales with text width.
 * Example: "DarshanSatsang" where "Darshan" is gold italic and "Satsang" is gold.
 */
export function GenreEyebrow({ genre, contentType, contentTitle, className = '' }: GenreEyebrowProps) {
  // For Commentary and Pilgrimage, show the parent content title instead of genre/contentType
  const showContentTitle = (contentType === 'Commentary' || contentType === 'Pilgrimage') && contentTitle;

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <p className="text-16 tracking-[-0.96px] leading-normal mb-0">
        {showContentTitle ? (
          <span className="font-display-serif font-bold text-gold">{contentTitle}</span>
        ) : genre ? (
          <>
            <span className="font-display-serif font-bold text-gold">{genre}</span>
            <span className="font-avenir-next text-gold">{contentType}</span>
          </>
        ) : (
          <span className="font-display-serif font-bold text-gold">{contentType}</span>
        )}
      </p>
      <IconOrnamentLine className="w-full h-auto text-gold mb-8" />
    </div>
  );
}
