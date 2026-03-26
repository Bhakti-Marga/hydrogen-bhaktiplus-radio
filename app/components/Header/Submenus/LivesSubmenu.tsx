import { SubmenuWrapper } from "./SubmenuWrapper";
import { SubmenuVideoCarousel } from "./SubmenuVideoCarousel";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { SubmenuTitle } from "./SubmenuTitle";
import { Stack } from "~/components/Stack";
import { encodeVideoId } from "~/lib/utils/video-id-encoder";

interface Live {
  title?: string;
  thumbnailUrl?: string;
  thumbnailUrlVariants?: string | null;
  video: {
    videoId: number;
  };
  contentId: number;
  isNew?: boolean;
  isUpcoming?: boolean;
}

interface LivesSubmenuProps {
  id: string;
  triggerId: string;
  isActive: boolean;
  latestLives: Live[];
}

export function LivesSubmenu({
  id,
  triggerId,
  isActive,
  latestLives,
}: LivesSubmenuProps) {
  const { strings } = useTranslations();
  const videoItems = latestLives.map((live) => ({
    title: live.title ?? "",
    link: `/video?videoId=${encodeVideoId(live.video.videoId)}`,
    image: live.thumbnailUrl,
    imageVariants: live.thumbnailUrlVariants,
    isNew: live.isNew,
    isUpcoming: live.isUpcoming,
  }));

  return (
    <SubmenuWrapper
      id={id}
      triggerId={triggerId}
      isActive={isActive}
      className="min-w-[674px]"
    >
      <Stack gap={2}>
        <SubmenuTitle viewAllLink="/livestreams">
          {strings.latest_livestreams}
        </SubmenuTitle>
        <SubmenuVideoCarousel items={videoItems} viewAllLink="/livestreams" />
      </Stack>
    </SubmenuWrapper>
  );
}
