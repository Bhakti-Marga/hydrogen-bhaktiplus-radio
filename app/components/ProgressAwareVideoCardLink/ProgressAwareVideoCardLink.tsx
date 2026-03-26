import { ReactNode, useState } from 'react';
import { Link } from '~/components/Link/Link';
import SubscriptionModal from '~/components/SubscriptionModal';
import { ComingSoonModal } from '~/components/Modal/ComingSoonModal';
import { hasAccessToContent } from '~/lib/utils/content';
import { isContentFreeInPrelaunch } from '~/lib/utils/prelaunch';
import { usePrelaunch } from '~/contexts/PrelaunchProvider';
import { useVideoProgress } from '~/contexts/WatchProgressProvider';
import { buildVideoUrl } from '~/lib/utils/video-id-encoder';
import type { Content, SubscriptionTier, User } from '~/lib/types';
import type { MembershipListResponseDto } from '~/lib/api/types';

/** Props passed to children when using render prop pattern */
export interface ProgressAwareVideoCardLinkRenderProps {
  hasAccess: boolean;
}

interface ProgressAwareVideoCardLinkProps {
  content: Content;
  user: User | null;
  subscriptionTier?: SubscriptionTier;
  memberships?: MembershipListResponseDto | null;
  contentType?: 'livestream' | 'satsang' | 'commentary' | 'pilgrimage' | 'video' | 'talk';
  /** Children can be ReactNode or a render function receiving { hasAccess } */
  children: ReactNode | ((props: ProgressAwareVideoCardLinkRenderProps) => ReactNode);
  /** If provided, uses explicit progress instead of looking it up (for history items) */
  explicitProgress?: number;
  /** If provided, uses this videoId instead of content.video.videoId (for watch history items) */
  videoId?: number;
  /**
   * When true, clicking is completely disabled (no navigation, no modal).
   * Hover events still work so video previews can play.
   */
  disableNavigation?: boolean;
}

/**
 * Wraps video cards in a Link with progress-aware URLs.
 *
 * - Always renders as <Link> (preserves link semantics for all content)
 * - Uses useVideoProgress hook for progress lookup (no Suspense)
 * - If user lacks access, onClick calls e.preventDefault() and shows modal
 * - If user has access, onClick does nothing (normal link navigation)
 */
export function ProgressAwareVideoCardLink({
  content,
  user,
  subscriptionTier,
  memberships,
  contentType = 'video',
  children,
  explicitProgress,
  videoId: videoIdProp,
  disableNavigation = false,
}: ProgressAwareVideoCardLinkProps) {
  const [showModal, setShowModal] = useState(false);
  const { isPrelaunchActive } = usePrelaunch();

  // Use videoId prop if provided, otherwise fall back to content.video.videoId
  const videoId = videoIdProp ?? content.video?.videoId;

  // Get progress from context (returns undefined if not loaded or not found)
  const contextProgress = useVideoProgress(videoId);

  // Use explicit progress if provided, otherwise use context progress
  const progress = explicitProgress ?? contextProgress;

  // Determine if this content is free in prelaunch mode
  const prelaunchContentType = contentType === 'livestream' ? 'live' : contentType;
  const isFreeInPrelaunch = isPrelaunchActive && isContentFreeInPrelaunch(prelaunchContentType);

  // Check access inline
  const userHasAccess = isFreeInPrelaunch && user
    ? true
    : user && subscriptionTier
      ? hasAccessToContent(user, subscriptionTier, content)
      : false;

  // Click handler: prevent navigation if disabled or user lacks access
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disableNavigation) {
      // Completely disable click - no navigation, no modal
      e.preventDefault();
      return;
    }
    if (!userHasAccess) {
      e.preventDefault();
      setShowModal(true);
    }
  };

  // Render children - support both ReactNode and render function
  const renderedChildren = typeof children === 'function'
    ? children({ hasAccess: userHasAccess })
    : children;

  // If no videoId available, just render children without link
  if (!videoId) {
    return <>{renderedChildren}</>;
  }

  // Helper to render the modal
  const renderModal = () => {
    if (!showModal) return null;

    if (isPrelaunchActive && !isFreeInPrelaunch) {
      return (
        <ComingSoonModal
          onClose={() => setShowModal(false)}
          contentType={contentType}
        />
      );
    }

    return (
      <SubscriptionModal
        content={content}
        contentTitle={content.title}
        contentType={contentType}
        userCurrentPlan={subscriptionTier}
        memberships={memberships}
        onClose={() => setShowModal(false)}
      />
    );
  };

  return (
    <>
      <Link
        to={buildVideoUrl(videoId, progress)}
        prefetch="intent"
        onClick={handleClick}
      >
        {renderedChildren}
      </Link>
      {renderModal()}
    </>
  );
}
