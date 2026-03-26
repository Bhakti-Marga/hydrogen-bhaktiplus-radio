import { Button } from "../Button";
import { Modal } from "./Modal";
import { useTranslations } from "~/contexts/TranslationsProvider";

interface GeneralModalProps {
  title: string;
  description?: string;
  restriction?: string;
  cta?: {
    text: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
}

export const GeneralModal = ({
  title,
  description,
  restriction,
  cta,
  children,
}: GeneralModalProps) => {
  const { strings } = useTranslations();

  return (
    <div>
      <div className="py-64 px-48 flex flex-col gap-24 text-brand">
        {restriction && (
          <div className="font-figtree text-brand-lighter text-16 font-400">
            {restriction}
          </div>
        )}
        {/* TODO-TYPOGRAPHY: Could use h2-md class (but uses font-avenir instead of font-avenir-next) */}
        <h2 className="font-avenir text-24 font-600">{title}</h2>
        {description && (
          <>
            {/* TODO-TYPOGRAPHY: Could use body-b2 class */}
            <p className="font-figtree text-16 font-400">{description}</p>
          </>
        )}
        {children}
        {cta && (
          <div className="flex gap-4">
            <Button
              onClick={cta.onClick}
              variant="primary"
              className="bg-gold text-brand"
              showArrow
            >
              {cta.text}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
