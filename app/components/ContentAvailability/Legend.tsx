import { useTranslations } from "~/contexts/TranslationsProvider";

export function Legend() {
  const { strings } = useTranslations();

  return (
    <div className="mt-64 pt-24 border-t border-white/10">
      <h4 className="body-b4 text-white/50 mb-8">{strings.content_availability_legend}</h4>
      <ul className="body-b4 text-white/50 space-y-4">
        <li>
          <span className="text-white">(3 verified)</span> = 3 videos with human-verifeid language
        </li>
        <li>
          <span className="text-gold-light">(2 verified &amp; 1 auto-generated)</span> = 2 human-verified + 1 auto-generated (AI voice/subtitles)
        </li>
        <li>
          <span className="text-gold-light">(3 auto-generated)</span> = 3 videos with auto-generated language only
        </li>
      </ul>
    </div>
  );
}

