import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { IconSearch } from "../Icons";
import { IconClose } from "../Icons/IconClose";
import { useCountryCode } from "~/hooks";
import { useTranslations } from "~/contexts/TranslationsProvider";

interface SearchProps {
  onSearch?: (query: string) => void;
  onSearchOpenCallback?: () => void;
  onSearchCloseCallback?: () => void;
  initialIsSearchOpen?: boolean;
  initialSearchValue?: string;
}

export function Search({
  onSearch,
  onSearchOpenCallback,
  onSearchCloseCallback,
  initialIsSearchOpen = false,
  initialSearchValue = "",
}: SearchProps) {
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [isSearchOpen, setIsSearchOpen] = useState(initialIsSearchOpen);
  const navigate = useNavigate();
  const { urlPrefix } = useCountryCode();
  const searchRef = useRef<HTMLDivElement>(null);
  const { strings } = useTranslations();

  const openSearchInputClasses = "w-[80vw] max-w-[800px] bg-white text-brand";
  const closeSearchInputClasses = "bg-[#2F3C5FCC] text-white";

  useEffect(() => {
    const handleOpenSearchWithQuery = (event: CustomEvent) => {
      const { query } = event.detail;
      setSearchValue(query);
      setIsSearchOpen(true);
      onSearchOpenCallback?.();
    };

    document.addEventListener(
      "openSearchWithQuery",
      handleOpenSearchWithQuery as EventListener,
    );

    return () => {
      document.removeEventListener(
        "openSearchWithQuery",
        handleOpenSearchWithQuery as EventListener,
      );
    };
  }, [onSearchOpenCallback]);

  useEffect(() => {
    setIsSearchOpen(initialIsSearchOpen);
  }, [initialIsSearchOpen]);

  useEffect(() => {
    setSearchValue(initialSearchValue);
  }, [initialSearchValue]);

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSearchOpen &&
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        handleCloseSearch();
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      const searchPath = `${urlPrefix}/search?q=${encodeURIComponent(searchValue.trim())}`;
      navigate(searchPath);
      onSearch?.(searchValue);
    }
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
    onSearchOpenCallback?.();
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchValue("");
    onSearchCloseCallback?.();
  };

  return (
    <div ref={searchRef} className="header-search flex items-center gap-8 z-20">
      <form onSubmit={handleSearch} className="header-search__wrapper relative">
        <input
          name="search"
          placeholder={strings.search_placeholder}
          autoComplete="off"
          className={`rounded-full px-40 py-8 min-w-96 border border-transparent focus:outline-none focus:bg-white focus:text-black focus:border-gold transition-all duration-300 caret-purple ${
            isSearchOpen ? openSearchInputClasses : closeSearchInputClasses
          }`}
          onFocus={handleSearchClick}
          onChange={(e) => setSearchValue(e.target.value)}
          value={searchValue}
        />
        <div
          className={`header-search__icon absolute w-24 left-12 top-1/2 -translate-y-1/2 ${
            isSearchOpen ? "text-brand-dark" : "text-grey"
          }`}
        >
          <IconSearch />
        </div>
      </form>
      {isSearchOpen && (
        <button
          onClick={handleCloseSearch}
          className="text-white w-16"
          title={strings.search_close}
        >
          <span className="sr-only">{strings.aria_close}</span>
          <IconClose />
        </button>
      )}
    </div>
  );
}
