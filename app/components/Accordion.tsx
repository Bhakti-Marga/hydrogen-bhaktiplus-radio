import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { useEffect, useRef, useState } from "react";
import { IconChevron } from "./Icons";

type AccordionProps = {
  defaultOpen?: boolean;
  header?: string;
  body?: string | React.ReactNode;
  children?: React.ReactNode;
  headerClasses?: string;
  headerOpenClasses?: string;
  bodyClasses?: string;
  index?: number;
  forceClose?: boolean;
  onToggle?: (index: number) => void;
  showChevron?: boolean;
};

const ANIMATION_DURATION = 500;

// Extracted to a separate component to satisfy React hooks rules
// (hooks cannot be called inside callbacks/render props)
function AccordionContent({
  open,
  close,
  forceClose,
  header,
  body,
  children,
  headerClasses,
  headerOpenClasses,
  bodyClasses,
  index,
  onToggle,
  showChevron,
}: {
  open: boolean;
  close: () => void;
  forceClose?: boolean;
  header?: string;
  body?: string | React.ReactNode;
  children?: React.ReactNode;
  headerClasses?: string;
  headerOpenClasses?: string;
  bodyClasses?: string;
  index?: number;
  onToggle?: (index: number) => void;
  showChevron?: boolean;
}) {
  const [height, setHeight] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      setHeight(`${ref.current?.scrollHeight}px`);
    }
  }, []);

  // Force close when forceClose prop changes
  useEffect(() => {
    if (forceClose && open) close();
  }, [forceClose, open, close]);

  // Handle closing animation
  useEffect(() => {
    if (!open && isClosing) {
      const timer = setTimeout(() => {
        setIsClosing(false);
      }, ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }

    if (!open) setIsClosing(false);
    if (open) setIsClosing(true);
  }, [open, isClosing]);

  return (
    <>
      <DisclosureButton
        aria-label={`${open ? "Close" : "Open"} accordion for ${header}`}
        onClick={() => {
          setHeight(`${ref.current?.scrollHeight}px`);
          if (typeof onToggle === "function" && index !== undefined)
            onToggle(index);
        }}
        type="button"
        className={`accordion__header flex items-center justify-between w-full ${headerClasses} ${
          open || isClosing ? headerOpenClasses : ""
        }`}
      >
        <h3 className="accordion__header__title text-brand">{header}</h3>

        {showChevron && (
          <span className={`block w-16 text-brand transition-transform duration-${ANIMATION_DURATION} ${open ? "rotate-180" : ""}`}>
            <IconChevron />
          </span>
        )}
      </DisclosureButton>

      <div
        ref={ref}
        className={`accordion__body transition-[max-height] duration-${ANIMATION_DURATION} overflow-hidden`}
        style={{ maxHeight: open ? height : 0 }}
      >
        <DisclosurePanel className={bodyClasses} unmount={false} static>
          {body ? <>{body}</> : children}
        </DisclosurePanel>
      </div>
    </>
  );
}

export function Accordion({
  defaultOpen = false,
  header,
  body,
  children,
  headerClasses,
  headerOpenClasses,
  bodyClasses,
  index,
  forceClose,
  onToggle,
  showChevron = true,
}: AccordionProps) {
  return (
    <Disclosure defaultOpen={defaultOpen}>
      {({ open, close }) => (
        <AccordionContent
          open={open}
          close={close}
          forceClose={forceClose}
          header={header}
          body={body}
          headerClasses={headerClasses}
          headerOpenClasses={headerOpenClasses}
          bodyClasses={bodyClasses}
          index={index}
          onToggle={onToggle}
          showChevron={showChevron}
        >
          {children}
        </AccordionContent>
      )}
    </Disclosure>
  );
}
