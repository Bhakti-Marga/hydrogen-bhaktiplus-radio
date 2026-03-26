import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Container, MobileWall } from "~/components";
import { SearchCard } from "~/components/Card/SearchCard";
import { SearchResultDto } from "~/lib/api";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { useUserContext } from "~/contexts/UserProvider";
import { encodeVideoId } from "~/lib/utils/video-id-encoder";
import { hasAccessToContent } from "~/lib/utils/content";
import type { Content } from "~/lib/types";

export const meta = () => {
  return [{ title: "Search Results - Bhakti+" }];
};

function SearchResultsSkeleton() {
  return (
    <div className="search-results-skeleton min-h-screen bg-brand-dark text-white pt-[var(--header-height)]">
      <Container className="text-white">
        <section className="flex flex-col gap-16">
          <div className="grid grid-cols-5 gap-x-8 gap-y-32">
            {Array.from({ length: 20 }).map((_, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-lg bg-brand animate-pulse"
              >
                <div className="aspect-video bg-brand"></div>
                <div className="absolute bottom-0 left-0 right-0 p-16">
                  <div className="h-16 w-3/4 bg-brand rounded mb-8"></div>
                  <div className="h-12 w-1/2 bg-brand rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}

export default function SearchResults() {
  const { strings } = useTranslations();
  const { state: userState } = useUserContext();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [searchData, setSearchData] = useState<{
    query: string;
    results: SearchResultDto[];
  } | null>(null);

  const query = searchParams.get("q");

  useEffect(() => {
    if (query) {
      fetch(`/api/search/query?q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((data: unknown) => {
          const searchData = data as { results: SearchResultDto[] };
          setSearchData({
            query,
            results: searchData.results || [],
          });
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Search error:", error);
          setSearchData({
            query,
            results: [],
          });
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [query]);

  const handleVideoClick = (result: SearchResultDto) => {
    if (result?.videoId) {
      const videoUrl = `/video?videoId=${encodeVideoId(result.videoId)}`;
      const urlWithProgress = result.startOffsetSeconds
        ? `${videoUrl}&progress=${result.startOffsetSeconds}`
        : videoUrl;
      window.location.href = urlWithProgress;
    }
  };

  if (isLoading) {
    return <SearchResultsSkeleton />;
  }

  const { results } = searchData || { results: [] };

  return (
    <MobileWall>
    <div className="search-results-page min-h-screen bg-brand-dark text-white">
      <Container className="text-white">
        {results.length === 0 ? (
          <div className="text-center py-80">
            <h2 className="h1-sm">{strings.search_no_results}</h2>
          </div>
        ) : (
          <section className="flex flex-col gap-16">
            <div className="grid grid-cols-5 gap-x-16 gap-y-48">
              {results.map((result) => {
                const isLocked = !hasAccessToContent(
                  userState.user,
                  userState.subscriptionTier,
                  result as unknown as Content
                );
                return (
                  <div key={`${result.contentId}-${result?.videoId}`} className="flex flex-col gap-8">
                    <SearchCard
                      image={result.thumbnailUrl}
                      title={result.title}
                      locked={isLocked}
                      onClick={() => handleVideoClick(result)}
                    />
                    {result.highlight && (
                      <p className="body-b3 text-white/70 line-clamp-2">
                        ...{result.highlight}...
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </Container>
    </div>
    </MobileWall>
  );
}
