import { useEffect } from "react";
import { useFetcher } from "react-router";
import { loader as historyLoader } from "~/routes/($countryCode).($language).api.search.history";
import { loader as trendingLoader } from "~/routes/($countryCode).($language).api.search.trending";
import { Content, SearchHistoryItem, SearchResultItem, SearchTrendingItem } from "~/lib/types";
import { CardSkeleton } from "../Loading";
import { SearchCard } from "../Card/SearchCard";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { encodeVideoId } from "~/lib/utils/video-id-encoder";

interface SearchFeaturedProps {
  onSearchClick?: (query: SearchResultItem | string) => void;
}

export function SearchFeatured({ onSearchClick }: SearchFeaturedProps) {
  const { strings } = useTranslations();
  const historyFetcher = useFetcher<typeof historyLoader>();
  const trendingFetcher = useFetcher<typeof trendingLoader>();

  // Load data when component mounts
  useEffect(() => {
    historyFetcher.load("/api/search/history");
    trendingFetcher.load("/api/search/trending");
  }, []);

  const clearHistory = async () => {
    try {
      await fetch("/api/search/history", { method: "DELETE" });
      historyFetcher.load("/api/search/history");
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  return (
    <div className="header-search__feature z-20 overflow-hidden grid grid-cols-12 absolute rounded-lg top-[110%] h-[400px] left-0 w-full bg-white text-black shadow-lg">
      {historyFetcher.state === "loading" ? (
        <SearchHistoryLoading />
      ) : (
        <SearchHistory
          history={historyFetcher.data?.history}
          onSearchClick={onSearchClick}
          clearHistory={clearHistory}
        />
      )}
      {trendingFetcher.state === "loading" ? (
        <SearchTrendingLoading />
      ) : (
        <SearchTrending
          trending={trendingFetcher.data?.trending}
          onSearchClick={onSearchClick}
        />
      )}
    </div>
  );
}

function SearchHistory({
  history,
  onSearchClick,
  clearHistory,
}: {
  history?: SearchHistoryItem[];
  onSearchClick?: (query: string) => void;
  clearHistory: () => void;
}) {
  const { strings } = useTranslations();
  if (!history) return null;

  if (history.length === 0)
    return (
      <div className="header-search__search-history p-24 col-span-8">
        <p>{strings.search_no_past_searches}</p>
      </div>
    );

  return (
    <div className="header-search__search-history p-24 col-span-8">
      <div className="header-search__search flex items-center justify-between mb-12">
        <h3 className="submenu__secondary-title text-[#98A0B4] text-14 font-600 ml-16">
          {strings.search_recent_searches}
        </h3>

        {/* TODO-TYPOGRAPHY: Could use body-b4 or body-b5 class */}
        <button onClick={clearHistory} className="text-12 font-500 text-purple">
          {strings.search_remove_all}
        </button>
      </div>

      <ul className="text-14 font-400">
        {history?.map((item: SearchHistoryItem) => (
          <li key={item.query} className="submenu__item mb-8">
            <button
              onClick={() => onSearchClick?.(item.query)}
              className="submenu__link block w-full text-left whitespace-nowrap text-14 front-400 px-16 py-4 rounded-full transition-colors focus:bg-grey-light hover:bg-grey-light"
            >
              {item.query}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchHistoryLoading() {
  const { strings } = useTranslations();
  return (
    <div className="header-search__search-history p-24 col-span-8">
      <div className="header-search__search flex items-center justify-between mb-12">
        <h3 className="submenu__secondary-title text-[#98A0B4] text-14 font-600 ml-16">
          {strings.search_recent_searches}
        </h3>
      </div>
      <div className="">
        <div className="w-full h-12 bg-grey-light rounded-full ml-16 mb-16"></div>
        <div className="w-full h-12 bg-grey-light rounded-full ml-16 mb-16"></div>
        <div className="w-full h-12 bg-grey-light rounded-full ml-16"></div>
      </div>
    </div>
  );
}

function SearchTrending({
  trending,
  onSearchClick,
}: {
  trending?: SearchTrendingItem[];
  onSearchClick?: (query: SearchResultItem) => void;
}) {
  const { strings } = useTranslations();
  if (!trending) return null;

  return (
    <div className="header-search__featured-searches p-24 bg-grey-light overflow-y-auto no-scrollbar col-span-4">
      <h3 className="text-14 font-600 text-[#98A0B4] mb-12">
        {strings.search_top_searches}
      </h3>
      {trending && (
        <ul className="text-14 font-400 grid gap-8">
          {trending?.map((item: SearchTrendingItem) => (
            <li key={item.contentId} className="submenu__featured-item">
              <SearchCard
                title={item.title ?? ""}
                image={item.thumbnailUrl ?? ""}
                onClick={() => {
                  if (item?.videoId) {
                    window.location.href = `/video?videoId=${encodeVideoId(item.videoId)}`;
                  }
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SearchTrendingLoading() {
  return (
    <div className="header-search__featured-searches p-24 bg-grey-light col-span-4">
      <CardSkeleton className="w-full mb-16" />
      <CardSkeleton className="w-full mb-16" />
      <CardSkeleton className="w-full" />
    </div>
  );
}
