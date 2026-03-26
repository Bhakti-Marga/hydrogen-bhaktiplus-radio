import Highlighter from "react-highlight-words";
import { useEffect } from "react";
import { useFetcher } from "react-router";
import { SearchResultItem } from "~/lib/types";
import { loader as searchQueryLoader } from "~/routes/($countryCode).($language).api.search.query";
import { useTranslations } from "~/contexts/TranslationsProvider";

interface SearchPredictiveProps {
  query: string;
  onSearchClick?: (query: string) => void;
}

export function SearchPredictive({
  query,
  onSearchClick,
}: SearchPredictiveProps) {
  const { strings } = useTranslations();
  const searchFetcher = useFetcher<typeof searchQueryLoader>();

  useEffect(() => {
    if (!query || query?.length < 3) return;

    if (query.trim()) {
      searchFetcher.load(`/api/search/query?q=${encodeURIComponent(query)}`);
    }
  }, [query]);

  return (
    <div className="header-search__feature z-20 overflow-hidden absolute rounded-lg top-[110%] left-0 w-full bg-white text-black shadow-lg">
      <div className="header-search__suggestions p-24">
        <h3 className="submenu__secondary-title text-[#98A0B4] mb-12 text-14 font-600 ml-16">
          {strings.search_suggestions}
        </h3>

        {searchFetcher.state === "loading" ? (
          <div className="text-center text-14 py-4">{strings.search_loading}</div>
        ) : searchFetcher.data?.results &&
          searchFetcher.data?.results?.length > 0 ? (
          <ul className="text-14 font-400">
            {searchFetcher.data.results.map((item: SearchResultItem) => (
              <li key={item.title} className="submenu__item mb-8">
                <button
                  onClick={() => onSearchClick?.(item.highlight)}
                  className="submenu__link block w-full text-left whitespace-nowrap text-14 front-400 px-16 py-4 rounded-full transition-colors focus:bg-grey-light hover:bg-grey-light"
                >
                  <Highlighter
                    highlightClassName="text-purple bg-transparent"
                    searchWords={[query]}
                    autoEscape={true}
                    textToHighlight={item.highlight}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-4 text-gray-500">{strings.search_no_results}</div>
        )}
      </div>
    </div>
  );
}
