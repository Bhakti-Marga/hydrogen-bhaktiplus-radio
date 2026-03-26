import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { localeContext } from "~/lib/middleware";
import { getStoreForCountry } from "~/lib/store-routing/config";

export const meta: MetaFunction = () => {
  return [{ title: "Terms of Service - Bhakti+" }];
};

export async function loader({ context }: LoaderFunctionArgs) {
  const { countryCode } = context.get(localeContext);
  const storeType = getStoreForCountry(countryCode);
  return { storeType };
}

// EU Terms of Service - fetched from Shopify, redirect to policies page
function EUTerms() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
      <p className="mb-4">
        Please visit our{" "}
        <a href="/policies/terms-of-service" className="text-blue-600 hover:underline">
          Terms of Service
        </a>{" "}
        page for our complete terms and conditions.
      </p>
    </>
  );
}

// International Terms of Service (Bhakti+ USA)
function InternationalTerms() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
      <p className="text-gray-600 mb-8">Bhakti+ USA — Last Updated: December 2025</p>

      <h2 className="text-2xl font-bold mb-4">§ 1 Provider, Tax Exempt Status and Scope</h2>
      <p className="mb-4">
        (1) These Terms and Conditions apply to all contracts for the use of digital content and streaming services ("Bhakti+") concluded between:
      </p>
      <ul className="list-disc pl-8 mb-4">
        <li>Bhakti Marga America, Demarest Parkway, Elmira, 14905, New York (Email: <a href="mailto:support@bhakti.plus" className="text-blue-600 hover:underline">support@bhakti.plus</a>) – hereinafter referred to as the "Provider"; and</li>
        <li>the users of the platform.</li>
      </ul>
      <p className="mb-4">
        (2) Tax-Exempt Disclosure: The Provider is a 501(c)(3) tax-exempt religious organization. Use of the Bhakti+ service constitutes a purchase of digital services. Payments are fees for service and are generally not considered tax-deductible charitable contributions for federal income tax purposes.
      </p>
      <p className="mb-8">
        (3) By completing a purchase or creating an account, you agree to be bound by these Terms.
      </p>

      <h2 className="text-2xl font-bold mb-4">§ 2 Subject Matter</h2>
      <p className="mb-4">(1) The subject matter is the provision of:</p>
      <ul className="list-disc pl-8 mb-4">
        <li>digital content (e.g. videos, livestreams, audio content),</li>
        <li>streaming access,</li>
        <li>app-based and web-based membership services (Bhakti+).</li>
      </ul>
      <p className="mb-4">(2) Access is provided via web and mobile applications; no physical media is delivered.</p>
      <p className="mb-8">(3) The Provider reserves the right to modify, update, or remove specific content within the platform at any time.</p>

      <h2 className="text-2xl font-bold mb-4">§ 3 Conclusion of Contract and Billing</h2>
      <p className="mb-4">(1) The contract is concluded when the user completes the booking process and clicks the "Subscribe & Pay" button.</p>
      <p className="mb-4">(2) Billing: The subscription fee is billed at the beginning of your subscription and each monthly renewal thereafter.</p>
      <p className="mb-4 font-bold">(3) AUTOMATIC RENEWAL: YOUR SUBSCRIPTION WILL AUTOMATICALLY RENEW AT THE END OF EACH BILLING CYCLE (MONTHLY) UNLESS YOU CANCEL AT LEAST 24 HOURS BEFORE YOUR RENEWAL DATE.</p>
      <p className="mb-8">(4) You authorize the Provider to charge your stored payment method for the recurring subscription fee until you cancel.</p>

      <h2 className="text-2xl font-bold mb-4">§ 4 Subscription Term and Cancellation</h2>
      <p className="mb-4">(1) Cancel Anytime: You have the right to cancel your subscription at any time.</p>
      <p className="mb-4">(2) Access After Cancellation: If you cancel, you will continue to have access to Bhakti+ content until the end of your current paid billing period. No partial refunds or credits will be issued for "unused" days within a month.</p>
      <p className="mb-4">(3) How to Cancel: To ensure a simple user experience, you may cancel by:</p>
      <ul className="list-disc pl-8 mb-8">
        <li>Navigating to your Account Settings on the website or app and selecting "Cancel Subscription."</li>
        <li>If you signed up via the Apple App Store or Google Play Store, you must manage and cancel your subscription through your Apple/Google account settings.</li>
      </ul>

      <h2 className="text-2xl font-bold mb-4">§ 5 Plan Changes: Upgrades and Downgrades</h2>
      <p className="mb-4">(1) Upgrades (Live to Premium): You may upgrade your subscription from "Live" to the "Premium" plan at any time through your Account Settings.</p>
      <ul className="list-disc pl-8 mb-4">
        <li>Immediate Access: Your upgrade will take effect immediately upon successful payment.</li>
        <li>Prorated Billing: You will be charged a one-time prorated amount for the remainder of your current billing cycle, of the difference in price between the two plans.</li>
        <li>Future Billing: Starting with your next scheduled renewal date, you will be billed the full monthly rate for the "Premium" plan.</li>
      </ul>
      <p className="mb-4">(2) Downgrades (Premium to Live): You may downgrade your subscription from "Premium" to "Live" at any time.</p>
      <ul className="list-disc pl-8 mb-4">
        <li>Effective Date: The change in plan will take effect at the end of your current paid billing cycle.</li>
        <li>Access: You will continue to have "Premium" level access until the end of that cycle.</li>
        <li>Future Billing: Your next monthly charge, on your regular renewal date, will be at the "Live" plan rate.</li>
      </ul>
      <p className="mb-8">(3) No Refunds for Plan Changes: As per our general policy, the Provider does not offer refunds or credits for partial months of service. By initiating a downgrade, you acknowledge that you will not receive a refund for the price difference for the remainder of the month in which the downgrade was requested.</p>

      <h2 className="text-2xl font-bold mb-4">§ 6 User Account</h2>
      <p className="mb-4">(1) Use of the services requires a personal user account.</p>
      <p className="mb-4">(2) Accounts are for personal, non-commercial use only. Sharing login credentials is strictly prohibited.</p>
      <p className="mb-4">(3) The provider is entitled to block access if misuse or a violation of these terms and Conditions is detected.</p>
      <p className="mb-8">(4) Users must be at least 13 years of age (or the age of majority in your jurisdiction).</p>

      <h2 className="text-2xl font-bold mb-4">§ 7 Prices and Payments</h2>
      <p className="mb-4">(1) Prices are stated in US Dollars.</p>
      <p className="mb-4">(2) While the Provider is tax-exempt, the user may be responsible for state or local sales tax depending on the laws of the state where the user resides.</p>
      <p className="mb-8">(3) All payments are non-refundable except as required by law or as determined in the Provider's sole discretion.</p>

      <h2 className="text-2xl font-bold mb-4">§ 8 Intellectual Property and Rights of Use</h2>
      <p className="mb-4">(1) Ownership: All content (videos, music, logos, lectures) is the property of the Provider or its licensors and is protected by U.S. and International Copyright Laws.</p>
      <p className="mb-4">(2) Limited License: The Provider grants you a personal, non-exclusive, non-transferable license to stream content for private, non-commercial use.</p>
      <p className="mb-8">(3) Prohibitions: You may not record, download (unless expressly permitted), screen-share, or publicly perform any Bhakti+ content. Sharing account credentials with individuals outside your household is strictly prohibited.</p>

      <h2 className="text-2xl font-bold mb-4">§ 9 Disclaimer of Warranties; Limitation of Liability</h2>
      <p className="mb-4">(1) "As Is" Service: The service is provided "as is" without warranties of any kind, either express or implied.</p>
      <p className="mb-8">(2) Liability Cap: To the maximum extent permitted by law, the Provider's total liability for any claim arising from the service shall not exceed the total amount paid by the user for the service during the six (6) months preceding the claim.</p>

      <h2 className="text-2xl font-bold mb-4">§ 10 Dispute Resolution</h2>
      <p className="mb-4">(1) Arbitration: You and the Provider agree that any dispute or claim arising out of these Terms shall be settled by binding arbitration rather than in court, except for small claims court if applicable.</p>
      <p className="mb-8">(2) Waiver of Class Action: All claims must be brought in the parties' individual capacity and not as a plaintiff or class member in any purported class or representative proceeding.</p>

      <h2 className="text-2xl font-bold mb-4">§ 11 App Store Provisions</h2>
      <p className="mb-8">If you access Bhakti+ via a mobile app (Apple or Google), you acknowledge that these Terms are between you and the Provider only, not Apple or Google. However, the platform operators are third-party beneficiaries of these Terms and have the right to enforce them against you.</p>

      <h2 className="text-2xl font-bold mb-4">§ 12 Governing Law</h2>
      <p className="mb-8 font-bold">(1) These terms are governed by the laws of the State of New York, without regard to conflict of law principles.</p>
    </>
  );
}

export default function TermsOfService() {
  const { storeType } = useLoaderData<typeof loader>();

  return (
    <div className="page rte bg-white text-brand-dark py-80 px-16">
      <div className="max-w-lg mx-auto">
        {storeType === 'eu' ? <EUTerms /> : <InternationalTerms />}
      </div>
    </div>
  );
}

