import { SubmenuWrapper } from "./SubmenuWrapper";
import { SubmenuVideoCarousel } from "./SubmenuVideoCarousel";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { SubmenuTitle } from "./SubmenuTitle";
import { Stack } from "~/components/Stack";

interface Pilgrimage {
  title?: string;
  contentId: number;
  slug?: string;
  thumbnailUrl?: string;
  thumbnailUrlVariants?: string | null;
  isNew?: boolean;
  isUpcoming?: boolean;
}

interface PilgrimagesSubmenuProps {
  id: string;
  triggerId: string;
  isActive: boolean;
  pilgrimages: Pilgrimage[];
}

export function PilgrimagesSubmenu({
  id,
  triggerId,
  isActive,
  pilgrimages,
}: PilgrimagesSubmenuProps) {
  const { strings } = useTranslations();

  const videoItems = pilgrimages.map((pilgrimage) => ({
    title: pilgrimage.title ?? "",
    link: `/pilgrimages/${pilgrimage.slug}`,
    image: pilgrimage.thumbnailUrl,
    imageVariants: pilgrimage.thumbnailUrlVariants,
    isNew: pilgrimage.isNew,
    isUpcoming: pilgrimage.isUpcoming,
  }));

  return (
    <SubmenuWrapper
      id={id}
      triggerId={triggerId}
      isActive={isActive}
      className="min-w-[674px]"
    >
      <Stack gap={2}>
        <SubmenuTitle viewAllLink="/pilgrimages">
          {strings.virtual_pilgrimages}
        </SubmenuTitle>
        <SubmenuVideoCarousel items={videoItems} viewAllLink="/pilgrimages" />
      </Stack>
    </SubmenuWrapper>
  );
}
