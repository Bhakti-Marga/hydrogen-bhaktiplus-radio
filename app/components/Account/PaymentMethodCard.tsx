import { useTranslations } from '~/contexts/TranslationsProvider';

interface PaymentMethod {
  brand: string;
  last4: string;
}

interface PaymentMethodCardProps {
  paymentMethod?: PaymentMethod | null;
  customerAccountUrl: string;
  regionId?: number | null;
}

export default function PaymentMethodCard({ paymentMethod, customerAccountUrl, regionId }: PaymentMethodCardProps) {
  const { strings } = useTranslations();

  // Use router endpoint for payment management
  // Router links should be absolute (no locale prefix)
  const accountUrl = `/router?intent=account&return_to=/profile`;

  return (
    <div className="bg-brand-dark rounded-lg">
      <h3 className="text-18 desktop:text-20 font-700 mb-12 desktop:mb-16 text-white">{strings.account_payment_method}</h3>

      {paymentMethod ? (
        <div className="mb-12 desktop:mb-16">
          <p className="text-white capitalize text-16 mb-4">
            {paymentMethod.brand} •••• {paymentMethod.last4}
          </p>
        </div>
      ) : (
        <p className="text-grey-light text-14 mb-12 desktop:mb-16">
          {strings.account_manage_payment_shopify}
        </p>
      )}

      <a
        href={accountUrl}
        className="inline-block px-16 desktop:px-24 py-10 desktop:py-12 border border-grey-light text-grey-light rounded-md hover:bg-white/5 transition-colors text-14"
      >
        {strings.account_manage_payment}
      </a>
    </div>
  );
}
