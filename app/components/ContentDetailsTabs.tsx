import { ReactNode, useState } from "react";
import { Tabs } from "radix-ui";
import { AllVideos, Details, TabButton, Container, DraftBadge } from "~/components";
import { useTranslations } from "~/contexts/TranslationsProvider";
import type { TransformedVideo } from "~/lib/utils/series-videos";
import type { Content, ContentType } from "~/lib/types";
import type { Video } from "~/components/AllVideos";

interface InfoItem {
  label: string;
  value: string[];
}

interface ContentDetailsTabsProps {
  // Content data
  title: string;
  /** HTML-formatted description, rendered in the Details tab */
  descriptionHtml?: string | null;
  videoCount?: number;

  // Videos data
  videos: TransformedVideo[];
  isLoadingVideos: boolean;
  videosError?: string | null;
  videosSubtitle?: string;

  // Details data
  info: InfoItem[];

  // Hero content (rendered in About tab)
  heroContent: ReactNode;

  // Optional customization
  height?: string;
  contentClassName?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;

  // Access control
  content?: Content;
  contentType?: ContentType;
  userHasAccess?: boolean;
  /**
   * When true, video cards in the "All Videos" tab are non-clickable
   */
  disableLinks?: boolean;

  /**
   * When false, shows a "DRAFT" badge indicating unpublished content
   */
  isPublished?: boolean;
}

/**
 * Displays content details in a tabbed interface with About, All Videos, and Details tabs.
 * Used for commentary, pilgrimage, and other series content.
 */
export function ContentDetailsTabs({
  title,
  descriptionHtml,
  videoCount,
  videos,
  isLoadingVideos,
  videosError,
  videosSubtitle,
  info,
  heroContent,
  height = "600px",
  contentClassName = "",
  activeTab: controlledActiveTab,
  onTabChange,
  content,
  contentType,
  userHasAccess,
  disableLinks = false,
  isPublished,
}: ContentDetailsTabsProps) {
  const { strings } = useTranslations();
  const [internalActiveTab, setInternalActiveTab] = useState("about");

  // Use controlled value if provided, otherwise use internal state
  const activeTab =
    controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabChange = (value: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(value);
    }
    onTabChange?.(value);
  };

  const handleVideoClick = (_video: Video) => {
    // Video click handler - can be extended for navigation or modal
  };

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={handleTabChange}
      className="tabs flex relative overflow-hidden flex-col flex-1"
      style={{ minHeight: height }}
    >
      {/* DRAFT badge for unpublished content - top-left corner */}
      {isPublished === false && (
        <div className="absolute top-24 left-24 z-20">
          <DraftBadge size="md" />
        </div>
      )}
      <Tabs.List className="tabs__header flex flex-wrap items-center justify-center gap-1 pt-sp-2 z-10">
        <Tabs.Trigger value="about" className="bg-transparent border-none p-0">
          <TabButton isActive={activeTab === "about"}>
            {strings.content_about_event}
          </TabButton>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="all-videos"
          className="bg-transparent border-none p-0"
        >
          <TabButton isActive={activeTab === "all-videos"}>
            {strings.content_all_videos}
          </TabButton>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="details"
          className="bg-transparent border-none p-0"
        >
          <TabButton isActive={activeTab === "details"}>
            {strings.content_details}
          </TabButton>
        </Tabs.Trigger>
      </Tabs.List>

      <div
        className={`tabs__content flex-1 flex items-center min-h-0 [container-type:inline-size] z-10 relative ${contentClassName}`}
      >
        <Tabs.Content
          value="about"
          className="tabs__panel w-full data-[state=active]:animate-[crossFade_700ms_ease-out_forwards]"
        >
          {heroContent}
        </Tabs.Content>

        <Tabs.Content
          value="all-videos"
          className="tabs__panel w-full data-[state=active]:animate-[crossFade_700ms_ease-out_forwards]"
        >
          <Container className="overflow-visible w-full h-full flex items-center justify-center">
            {isLoadingVideos ? (
              <div className="text-white text-center">
                <div className="text-18 font-600">
                  {strings.video_loading_videos}
                </div>
              </div>
            ) : videosError ? (
              <div className="text-white text-center">
                <div className="text-18 font-600 text-red-400">
                  {strings.video_failed_to_load}
                </div>
                <div className="text-14 mt-2 opacity-70">{videosError}</div>
              </div>
            ) : videos.length > 0 ? (
              <AllVideos
                title={title}
                subtitle={
                  videosSubtitle || strings.videos_count.replace("{count}", String(videoCount || videos.length))
                }
                videos={videos}
                onVideoClick={handleVideoClick}
                content={content}
                contentType={contentType}
                userHasAccess={userHasAccess}
                disableLinks={disableLinks}
              />
            ) : (
              <div className="text-white text-center">
                <div className="text-18 font-600 opacity-70">
                  {strings.video_no_videos_available}
                </div>
              </div>
            )}
          </Container>
        </Tabs.Content>

        <Tabs.Content
          value="details"
          className="tabs__panel w-full data-[state=active]:animate-[crossFade_700ms_ease-out_forwards]"
        >
          <Details title={title} descriptionHtml={descriptionHtml} info={info} />
        </Tabs.Content>
      </div>
    </Tabs.Root>
  );
}
