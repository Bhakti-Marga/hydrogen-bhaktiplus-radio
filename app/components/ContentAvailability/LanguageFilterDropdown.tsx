import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { IconChevron } from "../Icons";
import { useTranslations } from "~/contexts/TranslationsProvider";

export interface LanguageOption {
  code: string;
  name: string;
}

interface LanguageFilterDropdownProps {
  selectedLanguage: string | null;
  availableLanguages: LanguageOption[];
  onChange: (languageCode: string | null) => void;
}

export function LanguageFilterDropdown({
  selectedLanguage,
  availableLanguages,
  onChange,
}: LanguageFilterDropdownProps) {
  const { strings } = useTranslations();
  
  const selectedLanguageName = selectedLanguage
    ? availableLanguages.find(l => l.code === selectedLanguage)?.name
    : strings.content_availability_all_languages;

  return (
    <div>
      <Popover className="relative">
        {({ open, close }) => (
          <>
            <PopoverButton className="box-border border-solid border-[0.5px] border-white/50 rounded-full py-12 px-16 min-w-[200px] h-40 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors">
              <span className="body-b3 text-white">{selectedLanguageName}</span>
              <i
                className={`block size-[14px] relative top-[-1px] transition-transform duration-300 ${
                  open ? "rotate-180" : ""
                }`}
              >
                <IconChevron />
              </i>
            </PopoverButton>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <PopoverPanel
                anchor={{
                  to: "bottom start",
                  gap: 8,
                }}
                className="rounded-lg z-50 shadow-lg bg-white p-8 max-h-[400px] overflow-y-auto min-w-[200px]"
              >
                <nav>
                  <ul>
                    {/* All Languages option */}
                    <li>
                      <button
                        onClick={() => {
                          onChange(null);
                          close();
                        }}
                        className={`block w-full text-left body-b4 px-12 py-10 rounded-md transition-colors ${
                          selectedLanguage === null
                            ? "bg-brand/10 text-brand font-medium"
                            : "text-brand hover:bg-grey-light"
                        }`}
                      >
                        {strings.content_availability_all_languages}
                      </button>
                    </li>
                    {/* Language options */}
                    {availableLanguages.map((language) => (
                      <li key={language.code}>
                        <button
                          onClick={() => {
                            onChange(language.code);
                            close();
                          }}
                          className={`block w-full text-left body-b4 px-12 py-10 rounded-md transition-colors ${
                            selectedLanguage === language.code
                              ? "bg-brand/10 text-brand font-medium"
                              : "text-brand hover:bg-grey-light"
                          }`}
                        >
                          {language.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </PopoverPanel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
}

