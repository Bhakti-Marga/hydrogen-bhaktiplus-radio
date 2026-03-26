import { useTranslations } from '~/contexts/TranslationsProvider';

export default function Security() {
  const { strings } = useTranslations();

  return (
    <div className="security">
      <h2 className="text-32 font-700 mb-32">{strings.account_security}</h2>
      <p className="text-grey-light">
        {strings.account_security_coming_soon}
      </p>
    </div>
  );
}
