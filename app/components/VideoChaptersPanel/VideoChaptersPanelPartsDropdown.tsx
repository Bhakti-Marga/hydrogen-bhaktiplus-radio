import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { Fragment } from "react/jsx-runtime";
import { IconChevron } from "~/components/Icons/IconChevron";
import { VideoPart } from "~/lib/types";

interface VideoChaptersPanelPartsDropdownProps {
  parts: VideoPart[];
  selectedPart: VideoPart | null;
  onPartSelect: (part: VideoPart) => void;
}

export function VideoChaptersPanelPartsDropdown({
  parts,
  selectedPart,
  onPartSelect,
}: VideoChaptersPanelPartsDropdownProps) {
  return (
    <div className="mb-8">
      <Popover className="relative">
        {({ open }) => (
          <>
            <PopoverButton className="box-border bg-brand-light rounded-full py-8 px-12 min-w-[114px] h-40 flex items-center justify-between">
              <span className="body-b2 text-white/80">
                {selectedPart?.partName || `Day ${selectedPart?.day}`}
              </span>
              <i
                className={`block size-[14px] transition-transform duration-300 ${
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
                className="w-[189px] bg-white rounded-lg shadow-lg border z-50  overflow-y-auto no-scrollbar"
              >
                <div className="px-8 py-12 max-h-[300px] overflow-y-auto">
                  {parts.map((part, idx) => (
                    <button
                      key={`${part.day}-${part.part}-${part.partName}-${idx}`}
                      className={`w-full px-8 py-10 text-left hover:bg-grey-light transition-colors rounded-md ${
                        part.partName === selectedPart?.partName &&
                        part.day === selectedPart?.day
                          ? "bg-grey-light text-brand font-400"
                          : "text-brand font-600"
                      }`}
                      onClick={() => onPartSelect(part)}
                    >
                      <span className="text-14 leading-6">
                        {`Day ${part.day} - ${part.partName}`}
                      </span>
                    </button>
                  ))}
                </div>
              </PopoverPanel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
}
