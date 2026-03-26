import { Button } from "~/components/Button/Button";
import { IconPlay } from "~/components/Icons";
import { useTranslations } from "~/contexts/TranslationsProvider";

interface UpcomingLiveButtonProps {
  startDate?: string | null;
  className?: string;
}

/**
 * Formats a date string to a localized time with timezone.
 * Uses the browser's native formatting - displays time in user's local timezone.
 * Example: "4:00 PM CET" or "4:00 PM GMT+1" depending on browser/locale
 */
function formatLiveTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // Format time with timezone abbreviation using browser's native formatting
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    
    return timeFormatter.format(date);
  } catch {
    return dateString;
  }
}

/**
 * Disabled button shown for upcoming live content.
 * Displays "Join Live at [scheduled time]" to indicate when the stream will start.
 */
export function UpcomingLiveButton({ startDate, className = "" }: UpcomingLiveButtonProps) {
  const { strings } = useTranslations();

  // Format the scheduled time
  const formattedTime = startDate ? formatLiveTime(startDate) : null;
  
  // Button text: "Join Live at 4:00 PM CET" or fallback
  const buttonText = formattedTime
    ? `${strings.upcoming_live_join_at} ${formattedTime}`
    : strings.upcoming_live_coming_soon;

  return (
    <Button
      as="button"
      variant="secondary"
      className={`opacity-70 cursor-not-allowed ${className}`}
      icon={<IconPlay className="w-12 mr-8 relative top-[-1px]" />}
      disabled
      data-testid="cta-upcoming-live"
    >
      {buttonText}
    </Button>
  );
}

