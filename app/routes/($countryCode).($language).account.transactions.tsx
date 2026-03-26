import { useTranslations } from '~/contexts/TranslationsProvider';

export default function Transactions() {
  const { strings } = useTranslations();

  return (
    <div className="transactions">
      <h2 className="text-32 font-700 mb-32">{strings.account_transactions}</h2>
      <p className="text-grey-light">
        {strings.account_transactions_coming_soon}
      </p>
    </div>
  );
}
