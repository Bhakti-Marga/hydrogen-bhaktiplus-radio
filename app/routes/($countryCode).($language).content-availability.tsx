import { useState, useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData, type MetaFunction } from "react-router";
import { Container, Stack, Button } from "~/components";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { userScopedMediaApiContext } from "~/lib/middleware";
import {
  LanguageFilterDropdown,
  ContentSection,
  LanguageSummary,
  ContentTable,
  Legend,
  type LanguageOption,
} from "~/components/ContentAvailability";
import type {
  ContentLanguagesResponseDto,
  ContentLanguageItemDto,
} from "~/lib/api/types";

export const meta: MetaFunction = () => {
  return [{ title: "Content Availability - Bhakti+" }];
};

export async function loader({ context }: LoaderFunctionArgs) {
  const userScopedMediaApi = context.get(userScopedMediaApiContext);

  const contentLanguages = await userScopedMediaApi.meta.getContentLanguages();

  return { contentLanguages };
}

/**
 * Mapping of language codes/names to their canonical ISO 639-1 code
 * This handles various formats from the API:
 * - English names: "French" → "fr"
 * - Extended codes: "fr-fr" → "fr" 
 * - ISO codes: "fr" → "fr"
 */
const CODE_TO_CANONICAL: Record<string, string> = {
  // English language names
  'french': 'fr',
  'german': 'de',
  'spanish': 'es',
  'italian': 'it',
  'portuguese': 'pt',
  'russian': 'ru',
  'chinese': 'zh',
  'japanese': 'ja',
  'korean': 'ko',
  'arabic': 'ar',
  'hindi': 'hi',
  'greek': 'el',
  'polish': 'pl',
  'turkish': 'tr',
  'ukrainian': 'uk',
  'czech': 'cs',
  'hungarian': 'hu',
  'romanian': 'ro',
  'croatian': 'hr',
  'slovenian': 'sl',
  'latvian': 'lv',
  'dutch': 'nl',
  'swedish': 'sv',
  'norwegian': 'no',
  'danish': 'da',
  'finnish': 'fi',
  'hebrew': 'he',
  'thai': 'th',
  'vietnamese': 'vi',
  'indonesian': 'id',
  'malay': 'ms',
  'filipino': 'fil',
  'bengali': 'bn',
  'tamil': 'ta',
  'telugu': 'te',
  'english': 'en',
  // Extended locale codes (e.g., "fr-fr" → "fr")
  'fr-fr': 'fr',
  'de-de': 'de',
  'es-es': 'es',
  'it-it': 'it',
  'pt-pt': 'pt',
  'pt-br': 'pt',
  'en-us': 'en',
  'en-gb': 'en',
  'zh-cn': 'zh',
  'zh-tw': 'zh',
  'ja-jp': 'ja',
  'ko-kr': 'ko',
};

/**
 * English language names that should be excluded from dropdown
 * (we prefer native names like "Français" over "French")
 */
const ENGLISH_LANGUAGE_NAMES = new Set([
  'french', 'german', 'spanish', 'italian', 'portuguese',
  'russian', 'chinese', 'japanese', 'korean', 'arabic', 'hindi',
  'greek', 'polish', 'turkish', 'ukrainian', 'czech', 'hungarian',
  'romanian', 'croatian', 'slovenian', 'latvian', 'dutch', 'swedish',
  'norwegian', 'danish', 'finnish', 'hebrew', 'thai', 'vietnamese',
  'indonesian', 'malay', 'filipino', 'bengali', 'tamil', 'telugu',
]);

/**
 * Get the canonical code for a given language code
 */
function getCanonicalCode(code: string): string {
  const normalized = code.toLowerCase();
  // Check if there's an explicit mapping
  if (CODE_TO_CANONICAL[normalized]) {
    return CODE_TO_CANONICAL[normalized];
  }
  // For extended codes like "xx-xx", extract the base language
  if (normalized.includes('-')) {
    const base = normalized.split('-')[0];
    return base;
  }
  return normalized;
}

/**
 * Check if a language name is an English name for a non-English language
 */
function isEnglishLanguageName(name: string): boolean {
  return ENGLISH_LANGUAGE_NAMES.has(name.toLowerCase());
}

/**
 * Helper to add a language to the map and track code aliases
 */
function addLanguageToMap(
  languageMap: Map<string, string>,
  codeAliasMap: Map<string, Set<string>>,
  code: string,
  name: string
) {
  const normalizedCode = code.toLowerCase();
  const normalizedName = name.toLowerCase();
  const canonicalCode = getCanonicalCode(normalizedCode);

  // Always add this code variant to the alias map
  if (!codeAliasMap.has(canonicalCode)) {
    codeAliasMap.set(canonicalCode, new Set([canonicalCode]));
  }
  codeAliasMap.get(canonicalCode)!.add(normalizedCode);

  // Skip adding English names to the dropdown (we prefer native names)
  if (isEnglishLanguageName(normalizedName)) {
    return;
  }

  // Add to dropdown with canonical code, preferring native names
  if (!languageMap.has(canonicalCode)) {
    languageMap.set(canonicalCode, name);
  }
}

/**
 * Extract all unique languages and their code aliases
 * Returns both the language options for the dropdown and a map of code aliases
 */
function extractAllLanguages(data: ContentLanguagesResponseDto): {
  languages: LanguageOption[];
  codeAliases: Map<string, Set<string>>;
} {
  const languageMap = new Map<string, string>();
  const codeAliasMap = new Map<string, Set<string>>();

  // Collect from summaries
  const summaries = [
    data.summary.satsangs,
    data.summary.talks,
    data.summary.pilgrimages,
    data.summary.commentaries,
  ];

  for (const summary of summaries) {
    for (const lang of summary.audioLanguages) {
      addLanguageToMap(languageMap, codeAliasMap, lang.languageCode, lang.languageName);
    }
    for (const lang of summary.subtitleLanguages) {
      addLanguageToMap(languageMap, codeAliasMap, lang.languageCode, lang.languageName);
    }
  }

  // Also collect from per-item data
  const allItems = [
    ...data.talks,
    ...data.pilgrimages,
    ...data.commentaries,
    ...data.premiumIncluded.pilgrimages,
    ...data.premiumIncluded.commentaries,
  ];

  for (const item of allItems) {
    for (const lang of item.audioLanguages) {
      addLanguageToMap(languageMap, codeAliasMap, lang.languageCode, lang.languageName);
    }
    for (const lang of item.subtitleLanguages) {
      addLanguageToMap(languageMap, codeAliasMap, lang.languageCode, lang.languageName);
    }
  }

  // Convert to sorted array
  const languages = Array.from(languageMap.entries())
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { languages, codeAliases: codeAliasMap };
}

/**
 * Filter content items by selected language
 * Uses code aliases to match variant codes (e.g., "fr" and "french")
 */
function filterByLanguage(
  items: ContentLanguageItemDto[],
  languageCode: string | null,
  codeAliases: Map<string, Set<string>>
): ContentLanguageItemDto[] {
  if (!languageCode) return items;

  // Get the canonical code for the selected language
  const canonicalCode = getCanonicalCode(languageCode);

  // Get all codes that match this language (including aliases)
  const matchingCodes = codeAliases.get(canonicalCode) || new Set([canonicalCode]);

  return items.filter(
    (item) =>
      item.audioLanguages.some((l) => matchingCodes.has(l.languageCode.toLowerCase())) ||
      item.subtitleLanguages.some((l) => matchingCodes.has(l.languageCode.toLowerCase()))
  );
}

export default function ContentAvailabilityPage() {
  const { contentLanguages } = useLoaderData<typeof loader>();
  const { strings } = useTranslations();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  // Debug: Log content data counts
  console.log('[ContentAvailability] Raw API data:', JSON.stringify({
    talks: contentLanguages.talks?.length ?? 'undefined',
    pilgrimages: contentLanguages.pilgrimages?.length ?? 'undefined',
    commentaries: contentLanguages.commentaries?.length ?? 'undefined',
    premiumPilgrimages: contentLanguages.premiumIncluded?.pilgrimages?.length ?? 'undefined',
    premiumCommentaries: contentLanguages.premiumIncluded?.commentaries?.length ?? 'undefined',
    satsangsTotalCount: contentLanguages.summary?.satsangs?.totalCount ?? 'undefined',
    satsangsTotalVideoCount: contentLanguages.summary?.satsangs?.totalVideoCount ?? 'undefined',
  }));

  // Extract all available languages and code aliases for the filter dropdown
  const { languages: availableLanguages, codeAliases } = useMemo(
    () => extractAllLanguages(contentLanguages),
    [contentLanguages]
  );

  // Filter content based on selected language
  const filteredData = useMemo(() => {
    if (!selectedLanguage) return contentLanguages;

    return {
      ...contentLanguages,
      talks: filterByLanguage(contentLanguages.talks, selectedLanguage, codeAliases),
      pilgrimages: filterByLanguage(contentLanguages.pilgrimages, selectedLanguage, codeAliases),
      commentaries: filterByLanguage(contentLanguages.commentaries, selectedLanguage, codeAliases),
      premiumIncluded: {
        pilgrimages: filterByLanguage(contentLanguages.premiumIncluded.pilgrimages, selectedLanguage, codeAliases),
        commentaries: filterByLanguage(contentLanguages.premiumIncluded.commentaries, selectedLanguage, codeAliases),
      },
    };
  }, [contentLanguages, selectedLanguage, codeAliases]);

  // Get PPV content (excluding premium-included items)
  const ppvPilgrimages = useMemo(() => {
    const premiumIds = new Set(filteredData.premiumIncluded.pilgrimages.map((p) => p.contentId));
    return filteredData.pilgrimages.filter((p) => !premiumIds.has(p.contentId));
  }, [filteredData]);

  const ppvCommentaries = useMemo(() => {
    const premiumIds = new Set(filteredData.premiumIncluded.commentaries.map((c) => c.contentId));
    return filteredData.commentaries.filter((c) => !premiumIds.has(c.contentId));
  }, [filteredData]);

  // Check if there's any content after filtering
  const hasContent =
    contentLanguages.summary.satsangs.totalCount > 0 ||
    filteredData.talks.length > 0 ||
    filteredData.pilgrimages.length > 0 ||
    filteredData.commentaries.length > 0;

  // Debug: Log filtered data and hasContent
  console.log('[ContentAvailability] Filtered data:', JSON.stringify({
    selectedLanguage,
    filteredTalks: filteredData.talks?.length ?? 'undefined',
    filteredPilgrimages: filteredData.pilgrimages?.length ?? 'undefined',
    filteredCommentaries: filteredData.commentaries?.length ?? 'undefined',
    hasContent,
    availableLanguagesCount: availableLanguages?.length ?? 'undefined',
  }));

  const selectedLanguageName = selectedLanguage
    ? availableLanguages.find((l) => l.code === selectedLanguage)?.name
    : null;

  // Get all matching language codes for the selected language (including aliases)
  const matchingLanguageCodes = useMemo(() => {
    if (!selectedLanguage) return null;
    const canonicalCode = getCanonicalCode(selectedLanguage);
    const codes = codeAliases.get(canonicalCode);
    return codes ? Array.from(codes) : [canonicalCode];
  }, [selectedLanguage, codeAliases]);

  return (
    <div className="content-availability-page">
      <Container topPadding="lg" bottomPadding="lg">
        <Stack gap={6}>
          {/* Page Header */}
          <div>
            <h1 className="h1-md text-white mb-8">
              {strings.content_availability_title}
            </h1>
            <p className="body-b2 text-white/70">
              {strings.content_availability_subtitle}
            </p>
          </div>

          {/* Language Filter */}
          <div>
            <label className="body-b4 text-white/50 mb-8 block">
              {strings.content_availability_filter_label}
            </label>
            <LanguageFilterDropdown
              selectedLanguage={selectedLanguage}
              availableLanguages={availableLanguages}
              onChange={setSelectedLanguage}
            />
          </div>

          {/* Empty State */}
          {!hasContent && selectedLanguage && (
            <div className="text-center py-64">
              <h2 className="h2-md text-white mb-8">
                {strings.content_availability_no_results.replace('{language}', selectedLanguageName || '')}
              </h2>
              <p className="body-b2 text-white/70 mb-24">
                {strings.content_availability_no_results_subtitle}
              </p>
              <Button variant="secondary" onClick={() => setSelectedLanguage(null)}>
                {strings.content_availability_view_all_content}
              </Button>
            </div>
          )}

          {hasContent && (
            <>
              {/* Premium Plan Section */}
              <section>
                <div className="mb-24">
                  <h2 className="h2-md text-white">
                    {strings.content_availability_premium_plan}
                  </h2>
                  <p className="body-b3 text-white/70 mt-4">
                    {strings.content_availability_premium_plan_subtitle}
                  </p>
                </div>

                <Stack gap={3}>
                  {/* Satsangs Card */}
                  <ContentSection
                    title={strings.content_availability_satsangs}
                    videoCount={contentLanguages.summary.satsangs.totalVideoCount}
                    durationSeconds={contentLanguages.summary.satsangs.totalDurationSeconds}
                  >
                    <LanguageSummary
                      audioLanguages={contentLanguages.summary.satsangs.audioLanguages}
                      subtitleLanguages={contentLanguages.summary.satsangs.subtitleLanguages}
                      layout="columns"
                      maxVisible={8}
                      matchingLanguageCodes={matchingLanguageCodes}
                    />
                  </ContentSection>

                  {/* Pilgrimages Included */}
                  {filteredData.premiumIncluded.pilgrimages.length > 0 && (
                    <ContentSection
                      title={strings.content_availability_included_count
                        .replace('{type}', strings.content_availability_pilgrimages)
                        .replace('{count}', String(filteredData.premiumIncluded.pilgrimages.length))}
                    >
                      <ContentTable
                        items={filteredData.premiumIncluded.pilgrimages}
                        matchingLanguageCodes={matchingLanguageCodes}
                      />
                    </ContentSection>
                  )}

                  {/* Commentaries Included */}
                  {filteredData.premiumIncluded.commentaries.length > 0 && (
                    <ContentSection
                      title={strings.content_availability_included_count
                        .replace('{type}', strings.content_availability_commentaries)
                        .replace('{count}', String(filteredData.premiumIncluded.commentaries.length))}
                    >
                      <ContentTable
                        items={filteredData.premiumIncluded.commentaries}
                        matchingLanguageCodes={matchingLanguageCodes}
                      />
                    </ContentSection>
                  )}
                </Stack>
              </section>

              {/* Pay-Per-View Section */}
              <section>
                <div className="mb-24">
                  <h2 className="h2-md text-white">
                    {strings.content_availability_ppv_content}
                  </h2>
                  <p className="body-b3 text-white/70 mt-4">
                    {strings.content_availability_ppv_content_subtitle}
                  </p>
                </div>

                <Stack gap={3}>
                  {/* Talks */}
                  {filteredData.talks.length > 0 && (
                    <ContentSection
                      title={strings.content_availability_talks}
                      count={filteredData.talks.length}
                    >
                      <div className="mb-16">
                        <LanguageSummary
                          audioLanguages={contentLanguages.summary.talks.audioLanguages}
                          subtitleLanguages={contentLanguages.summary.talks.subtitleLanguages}
                          layout="inline"
                          maxVisible={4}
                          matchingLanguageCodes={matchingLanguageCodes}
                        />
                      </div>
                      <ContentTable
                        items={filteredData.talks}
                        showVideoCount={false}
                        matchingLanguageCodes={matchingLanguageCodes}
                      />
                    </ContentSection>
                  )}

                  {/* PPV Pilgrimages */}
                  {ppvPilgrimages.length > 0 && (
                    <ContentSection
                      title={strings.content_availability_pilgrimages}
                      count={ppvPilgrimages.length}
                      subtitle={
                        contentLanguages.premiumIncluded.pilgrimages.length > 0
                          ? strings.content_availability_excludes_premium.replace(
                            '{count}',
                            String(contentLanguages.premiumIncluded.pilgrimages.length)
                          )
                          : undefined
                      }
                    >
                      <div className="mb-16">
                        <LanguageSummary
                          audioLanguages={contentLanguages.summary.pilgrimages.audioLanguages}
                          subtitleLanguages={contentLanguages.summary.pilgrimages.subtitleLanguages}
                          layout="inline"
                          maxVisible={4}
                          matchingLanguageCodes={matchingLanguageCodes}
                        />
                      </div>
                      <ContentTable
                        items={ppvPilgrimages}
                        matchingLanguageCodes={matchingLanguageCodes}
                      />
                    </ContentSection>
                  )}

                  {/* PPV Commentaries */}
                  {ppvCommentaries.length > 0 && (
                    <ContentSection
                      title={strings.content_availability_commentaries}
                      count={ppvCommentaries.length}
                      subtitle={
                        contentLanguages.premiumIncluded.commentaries.length > 0
                          ? strings.content_availability_excludes_premium.replace(
                            '{count}',
                            String(contentLanguages.premiumIncluded.commentaries.length)
                          )
                          : undefined
                      }
                    >
                      <div className="mb-16">
                        <LanguageSummary
                          audioLanguages={contentLanguages.summary.commentaries.audioLanguages}
                          subtitleLanguages={contentLanguages.summary.commentaries.subtitleLanguages}
                          layout="inline"
                          maxVisible={4}
                          matchingLanguageCodes={matchingLanguageCodes}
                        />
                      </div>
                      <ContentTable
                        items={ppvCommentaries}
                        matchingLanguageCodes={matchingLanguageCodes}
                      />
                    </ContentSection>
                  )}
                </Stack>
              </section>

              {/* Legend */}
              <Legend />
            </>
          )}
        </Stack>
      </Container>
    </div>
  );
}

