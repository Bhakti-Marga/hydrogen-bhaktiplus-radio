import { SubmenuWrapper } from "./SubmenuWrapper";
import { SubmenuLinkList } from "./SubmenuLinkList";
import { SubmenuVideoCarousel } from "./SubmenuVideoCarousel";
import { SubmenuTitle } from "./SubmenuTitle";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { Stack } from "~/components/Stack";
import { encodeVideoId } from "~/lib/utils/video-id-encoder";

interface Category {
  id: number;
  name?: string | null;
}

interface Satsang {
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

interface SatsangsSubmenuProps {
  id: string;
  triggerId: string;
  isActive: boolean;
  categories: Category[];
  latestReleases: Satsang[];
}

export function SatsangsSubmenu({
  id,
  triggerId,
  isActive,
  categories,
  latestReleases,
}: SatsangsSubmenuProps) {
  const { strings } = useTranslations();
  const categoryLinks = categories.map((category) => ({
    name: category.name ?? "",
    link: `/satsangs/${category.id}`,
  }));

  const videoItems = latestReleases.map((satsang) => ({
    title: satsang.title ?? "",
    link: `/video?videoId=${encodeVideoId(satsang.video.videoId)}`,
    image: satsang.thumbnailUrl,
    imageVariants: satsang.thumbnailUrlVariants,
    isNew: satsang.isNew,
    isUpcoming: satsang.isUpcoming,
  }));

  return (
    <SubmenuWrapper id={id} triggerId={triggerId} isActive={isActive}>
      <div className="submenu__primary max-h-full mr-80">
        <Stack gap={2}>
          <SubmenuTitle viewAllLink="/satsangs">
            {strings.nav_satsangs}
          </SubmenuTitle>
          <SubmenuLinkList
            links={categoryLinks}
            columns={categories.length < 5 ? 1 : categories.length < 8 ? 2 : 3}
          />
        </Stack>
      </div>
      <div className="submenu__secondary max-h-full flex-1 min-w-0">
        <Stack gap={2}>
          <SubmenuTitle>{strings.nav_latest_releases}</SubmenuTitle>
          <SubmenuVideoCarousel items={videoItems} viewAllLink="/satsangs" />
        </Stack>
      </div>
    </SubmenuWrapper>
  );
}
