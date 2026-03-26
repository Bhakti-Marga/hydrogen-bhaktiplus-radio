import { SubmenuWrapper } from "./SubmenuWrapper";
import { SubmenuVideoCarousel } from "./SubmenuVideoCarousel";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { SubmenuTitle } from "./SubmenuTitle";
import { Stack } from "~/components/Stack";
import { encodeVideoId } from "~/lib/utils/video-id-encoder";

interface Talk {
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

interface TalksSubmenuProps {
  id: string;
  triggerId: string;
  isActive: boolean;
  latestTalks: Talk[];
}

export function TalksSubmenu({
  id,
  triggerId,
  isActive,
  latestTalks,
}: TalksSubmenuProps) {
  const { strings } = useTranslations();
  const videoItems = latestTalks.map((talk) => ({
    title: talk.title ?? "",
    link: `/video?videoId=${encodeVideoId(talk.video.videoId)}`,
    image: talk.thumbnailUrl,
    imageVariants: talk.thumbnailUrlVariants,
    isNew: talk.isNew,
    isUpcoming: talk.isUpcoming,
  }));

  return (
    <SubmenuWrapper
      id={id}
      triggerId={triggerId}
      isActive={isActive}
      className="min-w-[674px]"
    >
      <Stack gap={2}>
        <SubmenuTitle viewAllLink="/talks">
          {strings.latest_talks || "Latest Talks"}
        </SubmenuTitle>
        <SubmenuVideoCarousel items={videoItems} viewAllLink="/talks" />
      </Stack>
    </SubmenuWrapper>
  );
}
