import { useFetcher } from 'react-router';
import { Button } from '~/components/Button/Button';
import { useTranslations } from '~/contexts/TranslationsProvider';

interface CancelSubscriptionModalProps {
  contractId: string;
  onClose: () => void;
}

export default function CancelSubscriptionModal({
  contractId,
  onClose,
}: CancelSubscriptionModalProps) {
  const fetcher = useFetcher();
  const { strings } = useTranslations();

  const isLoading = fetcher.state !== 'idle';

  const handleConfirm = () => {
    fetcher.submit(
      {
        intent: 'cancelSubscription',
        contractId,
      },
      { method: 'post' }
    );
  };

  // Close modal on successful submission
  if (fetcher.data?.success) {
    setTimeout(() => {
      onClose();
      window.location.reload(); // Refresh to show updated data
    }, 500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-16 bg-black/60">
      <div className="bg-brand-dark rounded-lg max-w-[500px] w-full">
        <div className="p-32">
          <h2 className="text-28 font-700 text-white mb-16">{strings.modal_cancel_subscription_title}</h2>

          {fetcher.data?.success === false && (
            <div className="bg-red-500/20 text-red-400 p-16 rounded-md mb-24 border border-red-500/30">
              {fetcher.data.error || fetcher.data.message || strings.modal_cancel_subscription_error}
            </div>
          )}

          {fetcher.data?.success === true && (
            <div className="bg-green-500/20 text-green-400 p-16 rounded-md mb-24 border border-green-500/30">
              {fetcher.data.message || strings.modal_cancel_subscription_success}
            </div>
          )}

          <p className="text-grey-light text-16 mb-24">
            {strings.modal_cancel_subscription_warning}
          </p>

          <div className="bg-gold/10 border border-gold/30 p-16 rounded-md mb-24">
            <p className="text-gold text-14">
              <strong>{strings.label_note}</strong> {strings.modal_cancel_subscription_note}
            </p>
          </div>

          <div className="flex justify-end gap-12">
            <Button
              variant="ghost"
              shape="rectangle"
              onClick={onClose}
              disabled={isLoading}
            >
              {strings.modal_cancel_subscription_keep}
            </Button>
            <Button
              variant="red"
              shape="rectangle"
              onClick={handleConfirm}
              loading={isLoading}
            >
              {isLoading ? strings.modal_cancel_subscription_cancelling : strings.modal_cancel_subscription_confirm}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
