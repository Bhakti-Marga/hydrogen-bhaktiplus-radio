import { Button } from "~/components/Button/Button";
import { IconPlay } from "~/components/Icons";
import { useTranslations } from "~/contexts/TranslationsProvider";

interface ReplayComingSoonButtonProps {
  className?: string;
}

/**
 * Disabled button shown when a live stream has ended but the VOD is still being processed.
 * Displays "Replay coming soon" to indicate the recording will be available soon.
 */
export function ReplayComingSoonButton({ className = "" }: ReplayComingSoonButtonProps) {
  const { strings } = useTranslations();

  const buttonText = strings.live_replay_coming_soon || "Replay coming soon";

  return (
    <Button
      as="button"
      variant="secondary"
      className={`opacity-70 cursor-not-allowed ${className}`}
      icon={<IconPlay className="w-12 mr-8 relative top-[-1px]" />}
      disabled
      data-testid="cta-replay-coming-soon"
    >
      {buttonText}
    </Button>
  );
}

