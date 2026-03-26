import { useState } from "react";
import {
  type LoaderFunctionArgs,
  useLoaderData,
  type MetaFunction,
} from "react-router";
import { Tabs } from "radix-ui";
import { Container, Stack, Accordion, TabButton } from "~/components";
import { faqsLoader } from "~/sections";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { localeContext } from "~/lib/middleware";

const FAQS_HANDLE = "homepage-faqs";

type TabId = "chat" | "faq" | "contact";

export const meta: MetaFunction = () => {
  return [{ title: "Support - Bhakti+" }];
};

export async function loader(args: LoaderFunctionArgs) {
  // Get determined locale from middleware (includes user preferences, not just URL)
  const determinedLocale = args.context.get(localeContext);
  const localeOptions = {
    language: determinedLocale.language,
    country: determinedLocale.countryCode,
  };

  const faqsSchema = await faqsLoader(args.context, FAQS_HANDLE, localeOptions);
  return { faqsSchema };
}

// Icon components
function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 6L12 13L2 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

// Tab content components
function ChatTab({
  strings,
}: {
  strings: ReturnType<typeof useTranslations>["strings"];
}) {
  return (
    <Stack gap={3} className="max-w-xl mx-auto">
      <div className="flex items-center gap-sp-1.5">
        <div className="w-40 h-40 rounded-full bg-white/10 flex items-center justify-center">
          <ChatIcon className="w-20 h-20 text-white" />
        </div>
        <div>
          <h2 className="h2-sm text-white">{strings.support_chat_heading}</h2>
          <p className="body-b4 text-white/60">
            {strings.support_chat_description}
          </p>
        </div>
      </div>
      {/* Chat window with depth styling */}
      <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10">
        {/* Window header bar */}
        <div className="bg-white/10 backdrop-blur-sm px-16 py-12 flex items-center gap-8 border-b border-white/10">
          <div className="flex gap-6">
            <span className="w-10 h-10 rounded-full bg-white/20" />
            <span className="w-10 h-10 rounded-full bg-white/20" />
            <span className="w-10 h-10 rounded-full bg-white/20" />
          </div>
          <span className="body-b4 text-white/50 ml-8">
            {strings.support_chat_title}
          </span>
        </div>
        {/* Chat iframe */}
        <iframe
          title={strings.support_chatbot_title}
          src="https://app.fastbots.ai/embed/cmf5fvjk60058p71lzwipms12"
          className="w-full h-[480px] tablet:h-[530px] bg-white"
          style={{ border: "none" }}
        />
      </div>
    </Stack>
  );
}

function FaqTab({
  faqsSchema,
  strings,
}: {
  faqsSchema: { faqs: { question: string; answer: string }[] } | null;
  strings: ReturnType<typeof useTranslations>["strings"];
}) {
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  const handleAccordionToggle = (clickedIndex: number) => {
    setOpenAccordion(openAccordion === clickedIndex ? null : clickedIndex);
  };

  if (!faqsSchema?.faqs || faqsSchema.faqs.length === 0) {
    return (
      <Stack gap={2} className="max-w-3xl mx-auto text-center">
        <QuestionIcon className="w-48 h-48 text-white/40 mx-auto" />
        <p className="body-b1 text-white/60">{strings.support_faq_empty}</p>
      </Stack>
    );
  }

  return (
    <Stack gap={3} className="max-w-3xl mx-auto">
      <div className="flex items-center gap-sp-1.5">
        <div className="w-40 h-40 rounded-full bg-white/10 flex items-center justify-center">
          <QuestionIcon className="w-20 h-20 text-white" />
        </div>
        <div>
          <h2 className="h2-sm text-white">{strings.support_faq_heading}</h2>
          <p className="body-b4 text-white/60">
            {strings.support_faq_description}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-lg overflow-hidden shadow-lg">
        {faqsSchema.faqs.map((faq, index) => (
          <Accordion
            key={index}
            index={index}
            defaultOpen={false}
            showChevron={true}
            forceClose={openAccordion !== null && openAccordion !== index}
            onToggle={handleAccordionToggle}
            header={faq.question}
            body={<div className="prose prose-sm max-w-none">{faq.answer}</div>}
            headerClasses="p-24 body-b1 text-left"
            headerOpenClasses="bg-grey-light"
            bodyClasses="pb-24 px-24 bg-grey-light body-b4 text-brand/80"
          />
        ))}
      </div>
    </Stack>
  );
}

function ContactTab({
  strings,
}: {
  strings: ReturnType<typeof useTranslations>["strings"];
}) {
  return (
    <Stack gap={3} className="max-w-3xl mx-auto">
      <div className="flex items-center gap-sp-1.5">
        <div className="w-40 h-40 rounded-full bg-white/10 flex items-center justify-center">
          <EmailIcon className="w-20 h-20 text-white" />
        </div>
        <div>
          <h2 className="h2-sm text-white">
            {strings.support_contact_heading}
          </h2>
          <p className="body-b4 text-white/60">
            {strings.support_contact_description}
          </p>
        </div>
      </div>
      <a
        href="mailto:support@bhakti.plus"
        className="group flex flex-col items-center p-sp-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
      >
        <div className="w-64 h-64 rounded-full bg-white/10 flex items-center justify-center mb-sp-2 group-hover:bg-white/20 transition-colors">
          <EmailIcon className="w-32 h-32 text-white" />
        </div>
        <h3 className="h3-lg text-white mb-sp-1">
          {strings.support_email_heading}
        </h3>
        <p className="body-b3 text-white/60 mb-sp-2 text-center">
          {strings.support_email_description}
        </p>
        <span className="body-b1 text-white group-hover:underline transition-colors">
          support@bhakti.plus
        </span>
      </a>
    </Stack>
  );
}

export default function SupportPage() {
  const { faqsSchema } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const { strings } = useTranslations();

  return (
    <div className="support-page">
      <Container topPadding="lg" bottomPadding="xl">
        <Stack gap={5}>
          {/* Hero Section with Tabs */}
          <Stack gap={4} className="text-center max-w-2xl mx-auto">
            <Stack gap={2}>
              <h1 className="h1-md text-white">
                {strings.support_page_heading}
              </h1>
              <p className="body-b1 text-white/70">
                {strings.support_page_description}
              </p>
            </Stack>

            {/* Tab Buttons */}
            <Tabs.Root
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabId)}
            >
              <Tabs.List className="flex justify-center gap-sp-1">
                <Tabs.Trigger value="chat">
                  <TabButton isActive={activeTab === "chat"}>
                    {strings.support_tab_chat}
                  </TabButton>
                </Tabs.Trigger>
                <Tabs.Trigger value="faq">
                  <TabButton isActive={activeTab === "faq"}>
                    {strings.support_tab_faq}
                  </TabButton>
                </Tabs.Trigger>
                <Tabs.Trigger value="contact">
                  <TabButton isActive={activeTab === "contact"}>
                    {strings.support_tab_contact}
                  </TabButton>
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
          </Stack>

          {/* Tab Content */}
          <div>
            {activeTab === "chat" && <ChatTab strings={strings} />}
            {activeTab === "faq" && (
              <FaqTab faqsSchema={faqsSchema} strings={strings} />
            )}
            {activeTab === "contact" && <ContactTab strings={strings} />}
          </div>
        </Stack>
      </Container>
    </div>
  );
}
