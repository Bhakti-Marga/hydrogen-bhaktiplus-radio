import { useTranslations } from '~/contexts/TranslationsProvider';

/**
 * Generates the PDF receipt download URL for an order
 * Based on the Liquid template: https://checkout.bhakti.plus/apps/download-pdf/orders/d58fa690b1d7aafe6cb3/{{ order.id | times: 4321 }}/{{ order.name | handleize }}.pdf
 */
function getPdfReceiptUrl(orderNumber: string, orderName: string): string {
  // Multiply order ID by 4321 (matching Liquid's `order.id | times: 4321`)
  const orderIdHash = BigInt(orderNumber) * BigInt(4321);
  // Handleize the order name (remove # and make URL-safe, e.g., "#1001" -> "1001")
  const handleizedName = orderName.replace(/^#/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `https://checkout.bhakti.plus/apps/download-pdf/orders/d58fa690b1d7aafe6cb3/${orderIdHash}/${handleizedName}.pdf`;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currencyCode: string;
  status: string; // Shopify financialStatus values
  planName: string;
  refundedAmount?: number;
  orderNumber?: string;
  orderName?: string; // Order name like "#1001"
}

interface InvoiceTableProps {
  invoices: Invoice[];
  regionId?: number | null;
}

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-grey-light/20 text-grey-light border-grey-light/30',
  PENDING: 'bg-gold/20 text-gold border-gold/30',
  AUTHORIZED: 'bg-neutral-blue/20 text-neutral-blue border-neutral-blue/30',
  PARTIALLY_PAID: 'bg-grey-light/20 text-grey-light border-grey-light/30',
  REFUNDED: 'bg-gold-light/20 text-gold-light border-gold-light/30',
  PARTIALLY_REFUNDED: 'bg-gold-light/20 text-gold-light border-gold-light/30',
  VOIDED: 'bg-red/20 text-red border-red/30',
  EXPIRED: 'bg-red/20 text-red border-red/30',
};

export default function InvoiceTable({ invoices, regionId }: InvoiceTableProps) {
  const { strings } = useTranslations();
  // PDF receipts are only available for EU region (regionId === 1)
  const showPdfReceipts = regionId === 1;

  const STATUS_LABELS: Record<string, string> = {
    PAID: strings.invoice_status_paid,
    PENDING: strings.invoice_status_pending,
    AUTHORIZED: strings.invoice_status_authorized,
    PARTIALLY_PAID: strings.invoice_status_partially_paid,
    REFUNDED: strings.invoice_status_refunded,
    PARTIALLY_REFUNDED: strings.invoice_status_partially_refunded,
    VOIDED: strings.invoice_status_voided,
    EXPIRED: strings.invoice_status_expired,
  };
  if (invoices.length === 0) {
    return (
      <div className="bg-brand-dark rounded-lg">
        <h3 className="text-18 desktop:text-20 font-700 mb-12 desktop:mb-16 text-white">{strings.account_invoice_history}</h3>
        <p className="text-grey-light">{strings.account_no_invoices}</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-dark rounded-lg">
      <h3 className="text-18 desktop:text-20 font-700 mb-12 desktop:mb-16 text-white">{strings.account_invoice_history}</h3>

      {/* Desktop: Traditional table */}
      <div className="hidden desktop:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-grey-light/20">
              <th className="pb-12 text-grey-light text-14 font-600">{strings.account_invoice_date}</th>
              <th className="pb-12 text-grey-light text-14 font-600">{strings.account_invoice_amount}</th>
              <th className="pb-12 text-grey-light text-14 font-600">{strings.account_invoice_status}</th>
              <th className="pb-12 text-grey-light text-14 font-600">{strings.account_invoice_plan}</th>
              {showPdfReceipts && <th className="pb-12 text-grey-light text-14 font-600">{strings.account_invoice_receipt}</th>}
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const currencySymbol = invoice.currencyCode === 'EUR' ? '€' : '$';
              const statusStyle = STATUS_STYLES[invoice.status] || 'bg-grey-light/20 text-grey-light border-grey-light/30';
              const statusLabel = STATUS_LABELS[invoice.status] || invoice.status;
              const hasRefund = invoice.refundedAmount && invoice.refundedAmount > 0;

              const formattedDate = new Date(invoice.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const pdfUrl = invoice.orderNumber && invoice.orderName
                ? getPdfReceiptUrl(invoice.orderNumber, invoice.orderName)
                : null;

              return (
                <tr
                  key={invoice.id}
                  className="border-b border-grey-light/10 hover:bg-white/5 transition-colors"
                >
                  <td className="py-16 text-14">
                    <span className="text-white">{formattedDate}</span>
                  </td>
                  <td className="py-16 text-white text-14">
                    <div>
                      <span className={hasRefund ? 'line-through text-grey-light' : ''}>
                        {currencySymbol}
                        {invoice.amount.toFixed(2)}
                      </span>
                      {hasRefund && invoice.refundedAmount && (
                        <div className="text-red-400 text-12 mt-4">
                          {strings.invoice_refunded_label}{currencySymbol}
                          {invoice.refundedAmount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-16">
                    <span
                      className={`inline-block px-12 py-4 rounded-full text-12 font-600 border ${statusStyle}`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="py-16 text-white text-14 capitalize">
                    {invoice.planName}
                  </td>
                  {showPdfReceipts && (
                    <td className="py-16 text-14">
                      {pdfUrl ? (
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold hover:underline"
                        >
                          {strings.account_invoice_download_pdf}
                        </a>
                      ) : (
                        <span className="text-grey-light">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: Stacked cards */}
      <div className="desktop:hidden space-y-12">
        {invoices.map((invoice) => {
          const currencySymbol = invoice.currencyCode === 'EUR' ? '€' : '$';
          const statusStyle = STATUS_STYLES[invoice.status] || 'bg-grey-light/20 text-grey-light border-grey-light/30';
          const statusLabel = STATUS_LABELS[invoice.status] || invoice.status;
          const hasRefund = invoice.refundedAmount && invoice.refundedAmount > 0;

          const formattedDate = new Date(invoice.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          const pdfUrl = invoice.orderNumber && invoice.orderName
            ? getPdfReceiptUrl(invoice.orderNumber, invoice.orderName)
            : null;

          return (
            <div key={invoice.id} className="bg-white/5 p-12 rounded-md">
              {/* Row 1: Date and Status */}
              <div className="flex justify-between items-center mb-8">
                <span className="text-white text-14">{formattedDate}</span>
                <span
                  className={`inline-block px-8 py-2 rounded-full text-11 font-600 border ${statusStyle}`}
                >
                  {statusLabel}
                </span>
              </div>

              {/* Row 2: Amount and Plan */}
              <div className="flex justify-between items-baseline mb-8">
                <div>
                  <span className={`text-white text-16 font-600 ${hasRefund ? 'line-through text-grey-light' : ''}`}>
                    {currencySymbol}{invoice.amount.toFixed(2)}
                  </span>
                  {hasRefund && invoice.refundedAmount && (
                    <span className="text-red-400 text-12 ml-8">
                      (-{currencySymbol}{invoice.refundedAmount.toFixed(2)})
                    </span>
                  )}
                </div>
                <span className="text-grey-light text-14 capitalize">{invoice.planName}</span>
              </div>

              {/* Row 3: PDF Download Link (EU only) */}
              {showPdfReceipts && pdfUrl && (
                <div className="pt-8 border-t border-grey-light/10">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold text-13 hover:underline"
                  >
                    {strings.account_invoice_download_pdf}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
