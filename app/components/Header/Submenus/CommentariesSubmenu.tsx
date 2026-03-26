import { useMemo } from "react";
import { SubmenuWrapper } from "./SubmenuWrapper";
import { SubmenuVideoCarousel } from "./SubmenuVideoCarousel";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { SubmenuTitle } from "./SubmenuTitle";
import { Stack } from "~/components/Stack";
import { useRenderCount, useWhyDidYouUpdate } from "~/hooks";

interface Commentary {
  title?: string;
  contentId: number;
  subscriptionTiers?: string[] | null;
  slug?: string;
  thumbnailUrl?: string;
  thumbnailUrlVariants?: string | null;
  isNew?: boolean;
  isUpcoming?: boolean;
}

interface CommentariesSubmenuProps {
  id: string;
  triggerId: string;
  isActive: boolean;
  publicCommentaries: Commentary[];
  exclusiveCommentaries: Commentary[];
}

export function CommentariesSubmenu({
  id,
  triggerId,
  isActive,
  publicCommentaries,
  exclusiveCommentaries,
}: CommentariesSubmenuProps) {
  const { strings } = useTranslations();

  const videoItems = useMemo(
    () =>
      publicCommentaries.map((commentary) => ({
        title: commentary.title ?? "",
        link: `/commentaries/${commentary.slug}`,
        image: commentary.thumbnailUrl,
        imageVariants: commentary.thumbnailUrlVariants,
        isNew: commentary.isNew,
        isUpcoming: commentary.isUpcoming,
      })),
    [publicCommentaries],
  );

  return (
    <SubmenuWrapper
      id={id}
      triggerId={triggerId}
      isActive={isActive}
      className="min-w-[674px]"
    >
      <Stack gap={2}>
        <SubmenuTitle viewAllLink="/commentaries">
          {strings.commentaries}
        </SubmenuTitle>
        <SubmenuVideoCarousel items={videoItems} viewAllLink="/commentaries" />
      </Stack>
    </SubmenuWrapper>
  );
}
