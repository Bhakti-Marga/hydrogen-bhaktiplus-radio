import { useTranslations } from '~/contexts/TranslationsProvider';

interface Address {
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
}

interface BillingAddressCardProps {
  customerName?: string;
  address?: Address | null;
  customerAccountUrl: string;
  regionId?: number | null;
}

export default function BillingAddressCard({
  customerName,
  address,
  customerAccountUrl,
  regionId,
}: BillingAddressCardProps) {
  const { strings } = useTranslations();

  // Use router endpoint for address management
  // Router links should be absolute (no locale prefix)
  const editUrl = `/router?intent=account&return_to=/profile`;

  return (
    <div className="bg-brand-dark rounded-lg">
      <h3 className="text-18 desktop:text-20 font-700 mb-12 desktop:mb-16 text-white">{strings.account_billing || 'Billing'}</h3>

      {address ? (
        <div className="mb-12 desktop:mb-16">
          {customerName && (
            <p className="text-white text-16 font-600 mb-8">{customerName}</p>
          )}
          <div className="text-grey-light text-14 space-y-4">
            {address.address1 && <p>{address.address1}</p>}
            {address.address2 && <p>{address.address2}</p>}
            <p>
              {[address.city, address.province, address.zip].filter(Boolean).join(', ')}
            </p>
            {address.country && <p>{address.country}</p>}
          </div>
        </div>
      ) : (
        <p className="text-grey-light text-14 mb-12 desktop:mb-16">
          {strings.account_no_billing_address}
        </p>
      )}

      <a
        href={editUrl}
        className="inline-block px-16 desktop:px-24 py-10 desktop:py-12 border border-grey-light text-grey-light rounded-md hover:bg-white/5 transition-colors text-14"
      >
        {strings.account_edit_address}
      </a>
    </div>
  );
}
