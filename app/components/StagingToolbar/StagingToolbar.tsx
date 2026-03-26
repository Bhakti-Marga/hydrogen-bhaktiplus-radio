import { useIncludeUnpublishedContent } from '~/hooks';
import { Z_INDEX } from '~/lib/constants';

/**
 * A fixed toolbar that appears in non-production environments (staging, development).
 * Provides admin controls for testing features like viewing draft content.
 * 
 * This toolbar is hidden in production environments.
 * Renders immediately on SSR with disabled controls, then enables after hydration.
 */
export function StagingToolbar() {
  const {
    includeUnpublished,
    toggleIncludeUnpublished,
    isLoading,
    isEnabled,
    environment,
  } = useIncludeUnpublishedContent();

  // Don't render in production
  if (!isEnabled) return null;

  const envLabel = environment === 'development' ? 'Development' : 'Staging';

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 ${Z_INDEX.header} px-16 py-8 flex items-center justify-between text-12 font-mono`}
      style={{ backgroundColor: '#EAB308', color: '#000' }}
    >
      <div className="flex items-center gap-16">
        <span className="font-bold uppercase tracking-wide">
          ENV: {envLabel}
        </span>
        
        <label 
          className={`flex items-center gap-8 select-none ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        >
          <input
            type="checkbox"
            checked={includeUnpublished}
            onChange={toggleIncludeUnpublished}
            disabled={isLoading}
            className={`w-16 h-16 ${isLoading ? 'cursor-wait' : 'cursor-pointer'}`}
            style={{ accentColor: '#000' }}
          />
          <span>Show draft content</span>
        </label>
      </div>

      <div className="text-10" style={{ opacity: 0.7 }}>
        {isLoading ? 'Loading...' : 'Changes require page reload'}
      </div>
    </div>
  );
}
