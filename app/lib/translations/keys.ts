/**
 * Translation Keys Dictionary
 *
 * ⚠️ IMPORTANT: THE VALUES IN THIS FILE ARE FALLBACKS ONLY! ⚠️
 *
 * All translation strings MUST be defined in Shopify Admin as Translation metaobjects.
 * The values below are ONLY used as a last resort when:
 * 1. The key is missing from Shopify in the current locale AND
 * 2. The key is missing from the English fallback locale
 *
 * Production translations should ALWAYS come from Shopify metaobjects.
 * These hardcoded values exist solely for:
 * - Type safety and autocomplete
 * - Development/testing when Shopify is unavailable
 * - Preventing blank UI if translations fail to load
 *
 * Keys MUST match EXACTLY the keys in Shopify metaobjects (including underscores).
 *
 * When adding a new translation:
 * 1. Add the key here with a proper fallback value (English)
 * 2. Add a Translation metaobject in Shopify Admin with the EXACT same key
 *    - Go to: Shopify Admin → Content → Metaobjects → translation type
 *    - Field "key": Use the exact key from this file (e.g., 'nav_view_all')
 *    - Field "text": Add the translated text for each locale
 * 3. TypeScript will ensure the key is used correctly throughout the app
 *
 * IMPORTANT:
 * - Use underscores, not spaces, in both this file and Shopify metaobjects
 * - The app will throw an error if you try to use a key not defined here
 * - All keys must be searchable in the codebase (no dynamic lookups allowed)
 */

export const TRANSLATION_KEYS = {
  // Navigation
  nav_view_all: "View all",
  nav_explore: "Explore",
  nav_search: "Search",
  nav_account: "Account",
  nav_login: "Login",
  nav_logout: "Logout",
  nav_profile: "Profile",
  nav_sign_out: "Sign out",
  nav_sign_in: "Sign in",
  nav_choose_plan: "Choose plan",
  nav_livestreams: "Livestreams",
  nav_satsangs: "Satsangs",
  nav_commentaries: "Commentaries",
  nav_virtual_pilgrimages: "Virtual Pilgrimages",
  nav_talks: "Talks",
  nav_latest_releases: "Latest releases",

  // Homepage - General
  homepage_button_play: "Play",
  homepage_button_details: "Details",
  homepage_button_subscribe: "Subscribe",
  homepage_hero_title: "Welcome to Bhakti Marga",
  homepage_hero_description: "Experience spiritual teachings and live satsangs",

  // Homepage - Unsubscribed Hero (marketing page)
  homepage_unsubscribed_hero_title:
    '<span class="text-gold">Paramahamsa Vishwananda\'s</span> wisdom<span class="available-soon-badge"></span> in one place',
  homepage_unsubscribed_hero_description:
    "Watch everywhere, anytime in one place. Available in 28+ languages.",
  homepage_unsubscribed_hero_button: "Check plans",
  homepage_unsubscribed_live_hero_title:
    'Attend <span class="text-red">LIVE</span>streams to be in His presence',
  homepage_unsubscribed_live_hero_description:
    "There's a unique power in experiencing Guruji's teachings LIVE, as they are given in the moment—filled with divine energy and direct guidance for your soul.",
  homepage_unsubscribed_hero_button_watch_preview: "Watch preview",
  homepage_unsubscribed_learn_more: "Learn more about Bhakti+",

  // Homepage - Continue Watching
  homepage_continue_watching_title: "Continue watching",
  homepage_history_title: "Watch history",

  // Homepage - Latest Releases
  homepage_latest_releases_title: "Latest releases",

  // Homepage - Satsangs
  homepage_satsang_title: "Satsangs",
  homepage_satsang_topic_title: "Watch Satsangs by topic",
  homepage_satsang_premium_title: "Premium content",
  homepage_satsang_live_title: "LIVE Satsangs",
  homepage_satsang_god_title: "God",
  homepage_satsang_saints_title: "Saints",
  homepage_satsang_bhakti_title: "Bhakti",
  homepage_satsang_happiness_title: "Happiness",
  homepage_satsang_week_title: "Satsangs of the week",
  homepage_satsang_week_description:
    "Immerse yourself in each satsang.<br />Receive 7 satsangs, one for each day.<br />They&apos;ll be refreshed every Monday.",
  hero_satsang_of_the_day: "Satsang of the day",
  hero_satsang_day: "Day",

  // Homepage - Commentaries
  homepage_commentaries_title: "Scripture commentaries",
  homepage_commentaries_scripture_title: "Scripture commentaries",
  homepage_commentaries_year_title: "Year of Commentaries",

  // Homepage - Pilgrimages
  homepage_pilgrimages_title: "Pilgrimages",
  homepage_pilgrimages_premium_title: "Premium pilgrimages",

  // Homepage - Talks
  homepage_talks_title: "Talks",

  // Homepage - Live
  homepage_live_title: "LIVE",

  // Homepage - Upgrade Messages
  homepage_upgrade_satsang_message: "Upgrade to access all Satsangs",
  homepage_upgrade_commentaries_message: "Upgrade to access Commentaries",
  homepage_upgrade_pilgrimages_message: "Upgrade to access Pilgrimages",

  // Homepage - Plan Benefits
  homepage_plan_benefits_title: "Choose your plan",

  // Livestreams
  livestream_watch_live: "Watch LIVE",
  livestream_upcoming: "Upcoming",
  livestream_schedule: "Schedule",

  // Upcoming Live (preview/upcoming states)
  upcoming_live_join_at: "Join Live at",
  upcoming_live_coming_soon: "Live coming soon",
  live_starting_soon: "Starting soon",

  // VOD processing state (after live ends, before replay is ready)
  live_replay_coming_soon: "Replay coming soon",
  live_watch_replay: "Watch replay",

  // Search
  search_placeholder: "Search videos, topics...",
  search_no_results: "No results found",
  search_featured: "Featured",
  search_recent: "Recent searches",
  search_suggestions: "Suggestions",
  search_loading: "Loading...",
  search_recent_searches: "Recent searches",
  search_top_searches: "Top searches",
  search_no_past_searches: "No past searches",
  search_remove_all: "Remove all",

  // Video Player
  video_player_loading: "Loading video...",
  video_player_error: "Error loading video",
  video_player_ended: "Video ended",
  video_player_next: "Next",
  video_player_previous: "Previous",
  video_load_error: "Video failed to load",
  video_load_error_description:
    "There was a problem loading the video. Please try refreshing the page.",
  refresh_page: "Refresh page",

  // Account
  account_subscription: "Subscription",
  account_settings: "Settings",
  account_watch_history: "Watch history",
  account_billing: "Billing",
  account_sign_out: "Sign out",
  account_manage_membership: "My Bhakti Plus",
  account_my_purchases: "My purchases",
  account_more_on_bhakti_plus: "More on Bhakti +",
  account_bhakti_plus_catalog: "Bhakti+ Catalog",
  account_catalog: "Bhakti+ Catalog",
  account_transactions: "Transactions",
  account_security: "Security",
  account_current_subscription: "Current subscription",
  account_payment_method: "Payment method",
  account_billing_shipping: "Billing & Shipping",
  account_invoice_history: "Invoice history",
  account_no_active_subscription: "No active subscription",
  account_cancel_subscription: "Cancel subscription",
  account_upgrade_plan: "Upgrade plan",
  account_subscription_renews: "Your subscription renews on",
  account_change_plan: "Change your plan",
  account_cancel_confirmation:
    "Are you sure you want to cancel your subscription? You'll lose access to all premium content.",
  account_keep_subscription: "Keep subscription",
  account_cancel_confirm: "Yes, cancel",
  account_manage_payment: "Manage payment",
  account_edit_address: "Edit address",
  account_invoice_date: "Date",
  account_invoice_amount: "Amount",
  account_invoice_status: "Status",
  account_invoice_plan: "Plan",
  account_invoice_receipt: "Receipt",
  account_invoice_download_pdf: "Download PDF",

  // Subscription Tiers
  subscription_unsubscribed: "Free",
  subscription_live: "Live",
  subscription_core: "Core",
  subscription_premium: "Premium",
  subscription_supporter: "Supporter",

  // Common Actions
  action_play: "Play",
  action_pause: "Pause",
  action_stop: "Stop",
  action_watch: "Watch",
  action_continue: "Continue",
  action_start: "Start",
  action_cancel: "Cancel",
  action_confirm: "Confirm",
  action_close: "Close",
  action_save: "Save",
  action_edit: "Edit",
  action_delete: "Delete",
  cancel: "Cancel",
  confirm: "Confirm",
  processing: "Processing...",

  // Common Labels
  label_duration: "Duration",
  label_date: "Date",
  label_category: "Category",
  label_description: "Description",
  label_title: "Title",

  // Error Messages
  error_general: "Something went wrong",
  error_network: "Network error",
  error_auth: "Authentication error",
  error_not_found: "Not found",

  // Loading States
  loading_general: "Loading...",
  loading_videos: "Loading videos...",
  loading_content: "Loading content...",

  // Content/Video specific
  content_about_event: "About event",
  content_continue_watching: "Continue watching",
  content_watch: "Watch",
  content_join_for: "Join for",
  content_join: "Join",
  content_join_online_for: "Join online for",
  content_join_online: "Join online",
  content_choose_plan: "Choose plan",
  content_join_plan: "Join {plan}",
  content_upgrade_plan: "Upgrade plan",
  content_purchase_separately: "Purchase separately",
  content_purchase_separately_for: "Purchase separately for",
  content_buy_for: "Buy for",
  content_not_available_in_plan: "Not available in any Plan",
  content_all_videos: "All videos",
  content_details: "Details",

  // Video states
  video_loading_videos: "Loading videos...",
  video_failed_to_load: "Failed to load videos",
  video_no_videos_available: "No videos available",
  video_see_chapters: "See chapters",
  video_chapters: "Chapters",
  video_loading: "Loading...",
  video_videos: "Videos",
  video_chapter_title_placeholder: "Chapter title",

  // Livestream specific
  livestream_play: "Play",

  // Tooltips
  tooltip_supporter_and_premium_header: "Supporter & Premium",
  tooltip_supporter_and_premium_description:
    "Access exclusive content with Supporter or Premium membership",

  // Exclusive Content Tooltips (Option A: Template-based)
  // Note: {{PLANS}} will be replaced with plan names (e.g., "Premium & Supporter")
  // Plan names are NOT translated as they are product identifiers
  exclusive_content_ppv_only: "Available as a standalone purchase",
  exclusive_content_plans_only: "Included in {{PLANS}} plan",

  // Tooltip details (description provides more info, header uses the same text as the visible label)
  exclusive_content_tooltip_plan_details:
    "Your membership provides unlimited access to this content without needing to purchase it separately.",
  exclusive_content_tooltip_plan_details_no_access:
    "If you upgrade to the Premium plan, you'll receive access to this content without needing to purchase it separately.",
  exclusive_content_tooltip_ppv_details:
    "This content is only available as a standalone purchase. It is not included in any membership.",

  // Tier conjunction (for joining plan names)
  tier_conjunction_and: "&",

  // Mobile Wall
  mobile_platform_title: "Bhakti Marga Media Platform",
  mobile_watch_teachings: "Watch spiritual teachings anytime, anywhere",
  mobile_button_download: "Download app",
  mobile_button_open_app: "Open in App",

  // Subscription UI
  subscription_tiers_title: "Choose your plan",
  subscription_tiers_description:
    "Select the plan that fits your spiritual journey",
  subscription_yearly: "Yearly",
  subscription_monthly: "Monthly",
  subscription_save_annual: "Save with annual billing",
  subscription_one_month_free: "1 MONTH FREE",
  subscription_one_month_free_tooltip_title: "Annual commitment.",
  subscription_one_month_free_tooltip_subtitle:
    "12 months access. 1 month free.",
  subscription_one_month_free_tooltip_description:
    "If you upgrade to one of the following plans, you'll receive full access to this content without needing to purchase it separately.",
  subscription_support_us: "Support us",
  subscription_select_plan: "Select plan",

  // Generic actions (used in various places)
  play: "Play",
  see_chapters: "See chapters",

  // Blocked/Access Modals
  blocked_modal_live_title: "Upgrade to Access",
  blocked_modal_live_description_top:
    "This content requires a Live subscription or higher.",
  blocked_modal_live_description_bottom:
    "Upgrade your plan to watch this content.",
  blocked_modal_core_eyebrow: "Core subscription required",
  blocked_modal_core_title: "Upgrade to Core",
  blocked_modal_core_description:
    "This content requires a Core subscription or higher.",
  blocked_modal_fallback_title: "Upgrade required",
  blocked_modal_fallback_description:
    "Upgrade your subscription to access this content.",

  // General content categories
  commentaries: "Commentaries",
  virtual_pilgrimages: "Virtual Pilgrimages",
  latest_livestreams: "Latest livestreams",
  latest_talks: "Latest talks",
  explore_all: "Explore all",

  // My Content sections (index pages)
  my_commentaries: "My commentaries",
  all_commentaries: "All commentaries",
  my_pilgrimages: "My pilgrimages",
  all_pilgrimages: "All pilgrimages",
  my_talks: "My talks",
  all_talks: "All talks",

  // "All" pages - showing count
  showing_all_talks: "Showing all {count} talks",
  showing_all_satsangs: "Showing all {count} satsangs",

  // ============================================
  // NEW KEYS - Added for translation coverage
  // ============================================

  // Aria Labels (Accessibility)
  aria_close: "Close",
  aria_open_nav_menu: "Open navigation menu",
  aria_close_nav_menu: "Close navigation menu",
  aria_mobile_navigation: "Mobile navigation",
  aria_profile_menu: "Profile menu",
  aria_content_details: "Content details",

  // Alt Text (Images)
  alt_logo_bhakti_plus: "Bhakti+",
  alt_logo_bhaktimarga: "Bhakti Marga",
  alt_bhakti_plus_lotus: "Bhakti+ Lotus",

  // Modal - Access
  modal_access_upgrade_button: "Upgrade my plan",

  // Modal - Coming Soon
  modal_coming_soon_title: "Coming soon",
  modal_coming_soon_description:
    "{contentTypeDisplay} will be available when Bhakti+ fully launches.",
  modal_coming_soon_plans_info:
    "Full access plans will be available for purchase soon.",
  modal_coming_soon_free_content:
    "In the meantime, enjoy free access to Ramcharitamanas Live and the live stream archive!",
  modal_coming_soon_button: "Continue exploring",

  // Modal - Subscription
  modal_subscription_choose_plans:
    "Choose one of the following plans to access {contentType}",
  modal_subscription_upgrade_from:
    "Upgrade from {plan} to one of the following plans to access {contentType}",
  modal_subscription_eyebrow: "Subscriber content",
  modal_subscription_title: "Subscribe to watch {title}",
  modal_subscription_current_plan: "Your current plan",
  modal_subscription_upgrade: "Upgrade",
  modal_subscription_downgrade: "Downgrade",

  // Modal - Plan Change Confirmation
  modal_plan_change_confirm_title: "Confirm Bhakti+ plan change",
  modal_plan_change_confirm_description:
    "Are you sure you want to {action} your plan to {tier}? Plan membership changes take effect immediately, and charges will be pro-rated.",
  modal_plan_change_confirm_description_downgrade:
    "Downgrades will be scheduled for the next billing cycle.",

  // Modal - Account Subscription
  modal_account_subscription_choose:
    "Choose one of the following plans to access Bhakti+ content",
  modal_account_subscription_current:
    "You're currently on the {plan} plan. Select a plan to upgrade or downgrade.",
  modal_account_subscription_current_live:
    'You\'re currently on the <span class="tier-name">Live</span> plan. Select a plan to upgrade or downgrade.',
  modal_account_subscription_current_premium:
    'You\'re currently on the <span class="tier-name">Premium</span> plan. Select a plan to upgrade or downgrade.',
  modal_account_subscription_current_supporter:
    'You\'re currently on the <span class="tier-name">Supporter</span> plan. Select a plan to upgrade or downgrade.',
  modal_choose_plan_title: "Choose a plan",
  modal_change_plan_title: "Change your plan",
  modal_purchase_access_title: "Purchase access",
  modal_ppv_unavailable_on_plan:
    "This content is unavailable on your plan",
  modal_ppv_purchase_description:
    "Purchase separately to get access to {contentTitle}",
  modal_ppv_purchase_description_no_title:
    "Purchase separately to get access.",
  modal_ppv_only_description:
    "This content is available for individual purchase.",
  modal_plans_and_ppv_description:
    "Choose a subscription plan or purchase this content individually.",
  modal_or_purchase_separately:
    "Or purchase this content individually:",
  modal_no_access_options:
    "No purchase options are currently available for this content.",

  // Modal - Cancel Subscription
  modal_cancel_subscription_title: "Cancel subscription",
  modal_cancel_subscription_error: "Failed to cancel subscription",
  modal_cancel_subscription_success: "Subscription cancelled successfully",
  modal_cancel_subscription_warning:
    "Are you sure you want to cancel your subscription? You'll lose access to all member benefits and exclusive content at the end of your current billing period.",
  modal_cancel_subscription_note:
    "This action cannot be undone. You can always resubscribe later if you change your mind.",
  modal_cancel_subscription_keep: "Keep subscription",
  modal_cancel_subscription_cancelling: "Cancelling...",
  modal_cancel_subscription_confirm: "Yes, cancel",

  // Labels
  label_note: "Note:",

  // Account - Navigation
  account_my_account: "My account",
  account_my_profile: "My profile",
  account_region_label: "Region: ",
  account_nav_my_bhakti_plus: "My Bhakti Plus",
  account_nav_purchases: "Purchases",
  account_nav_catalog: "Bhakti+ Catalog",
  account_nav_transactions: "Transactions",
  account_nav_security: "Security",

  // Account - Invoice Status
  invoice_status_paid: "Paid",
  invoice_status_pending: "Pending",
  invoice_status_authorized: "Authorized",
  invoice_status_partially_paid: "Partially paid",
  invoice_status_refunded: "Refunded",
  invoice_status_partially_refunded: "Partially refunded",
  invoice_status_voided: "Voided",
  invoice_status_expired: "Expired",
  invoice_refunded_label: "Refunded: ",
  account_no_invoices: "No invoices yet",

  // Account - Billing & Payment
  account_no_billing_address: "No billing address on file.",
  account_manage_payment_shopify:
    "Manage your payment methods through your Shopify account.",

  // Account - Membership Card
  account_previous_plan:
    "Previous Plan: {planName} - {currencySymbol}{amount} per {interval}",
  account_subscription_paused:
    "Your {planName} plan is paused. Resume it to continue your subscription.",
  account_subscription_cancelled:
    "Your {planName} plan was cancelled. Subscribe again to reactivate.",
  account_resuming: "Resuming...",
  account_resume_plan: "Resume {planName} Plan",
  account_refreshing: " - Refreshing...",
  account_subscribe_to_plan: "Subscribe to {planName} Plan",
  account_choose_another_plan: "Choose another plan",
  account_subscribe_cta: "Subscribe to access exclusive content and features.",
  account_choose_plan: "Choose a plan",
  account_active_plan_details:
    "{planName} plan - {currencySymbol}{amount} per {interval}",
  account_renews_on: "Renews on: {date}",
  account_upgrade_downgrade: "Upgrade/Downgrade",
  account_next_payment: "Next payment",
  account_access_until: "You will continue to have access until {date}",
  account_amount: "Amount",
  plan: "plan",

  // Account - Routes
  account_security_coming_soon:
    "Coming soon: Manage your account security settings here.",
  account_transactions_coming_soon:
    "Coming soon: View your transaction history here.",
  account_no_purchases: "You haven't made any purchases yet.",
  catalog_empty_state: "No products available in the catalog at this time.",

  // Header & Search
  search_close: "Close search",
  loading_navigation: "Loading navigation...",

  // FAQs Section
  faqs_check_more: "Check more FAQs",

  // Support Page
  support_page_heading: "How can we help?",
  support_page_description:
    "Find answers to common questions, chat with our AI assistant, or reach out to our support team.",
  support_tab_chat: "Chat",
  support_tab_faq: "FAQ",
  support_tab_contact: "Contact us",
  support_chat_heading: "Chat with our AI Assistant",
  support_chat_description: "Get instant answers to your questions",
  support_chat_title: "Bhakti+ Assistant",
  support_chatbot_title: "Support chatbot",
  support_faq_empty: "No FAQs available at the moment.",
  support_faq_heading: "Frequently asked questions",
  support_faq_description: "Quick answers to common questions",
  support_contact_heading: "Contact us",
  support_contact_description:
    "Can't find what you're looking for? Reach out directly.",
  support_email_heading: "Email support",
  support_email_description:
    "Send us an email and we'll get back to you as soon as possible.",

  // Welcome Page
  welcome_heading: "What would you like to do today?",
  welcome_create_account: "Create a Bhakti+ Account",
  welcome_manage_account: "Manage account",

  // Footer
  footer_help: "Help",
  footer_terms: "Terms",
  footer_privacy: "Privacy",
  footer_imprint: "Imprint",
  footer_right_of_withdrawal: "Right of Withdrawal",
  footer_copyright: "© {year} Bhakti Marga",

  // Footer Menu Links - Column 2 (Account & Support)
  footer_link_my_profile: "My profile",
  footer_link_my_purchases: "My purchases",
  footer_link_help_center: "Help center",

  // 404 Page
  error_404_code: "404",
  error_404_title: "Page not found",
  error_404_description:
    "Sorry, the page you're looking for doesn't exist or has been moved.",
  error_404_button: "Go to Homepage",

  // Router - Error Messages
  router_error_checkout_prepare:
    "We couldn't prepare your checkout. Please try again.",
  router_error_product_unavailable: "This product is currently unavailable.",
  router_error_cart: "There was an issue with your cart. Please try again.",
  router_error_plan_unavailable: "The selected plan is not available.",
  router_error_already_subscribed:
    "You already have an active subscription. Please manage your existing membership from your account.",
  router_error_payment:
    "Payment could not be processed. Please check your payment details and try again.",
  router_error_session_expired: "Your session has expired. Please try again.",
  router_error_unexpected: "An unexpected error occurred. Please try again.",
  router_error_payment_failed:
    "Payment failed. Please update your payment method.",
  router_error_yearly_to_monthly:
    "Switching from yearly to monthly billing requires contacting our support team. Please email support@bhakti.plus and we'll help you with your request.",
  router_error_contact_support:
    "This plan change requires contacting our support team. Please email support@bhakti.plus and we'll help you with your request.",
  router_error_cannot_pause:
    "Cannot pause subscription that is already paused or cancelled.",
  router_error_already_active: "Your subscription is already active!",
  router_error_cannot_reactivate:
    'Cannot reactivate subscription with status "{status}". Please contact support.',
  router_error_connection:
    "We couldn't connect to our servers. Please try again.",
  router_error_message: "We encountered an unexpected error. Please try again.",

  // Router - Success Messages
  router_success_plan_updated_billing:
    "Your plan has been {action} to {tier} {billing}!",
  router_success_plan_updated:
    "Your plan has been successfully {action} to {tier}!",
  router_success_cancelled:
    "Your subscription has been cancelled. You'll continue to have access until the end of your current billing period.",
  router_success_paused:
    "Your subscription has been paused. You can reactivate it at any time.",
  router_success_reactivated:
    "Your subscription has been reactivated! Welcome back.",
  router_info_already_on_plan:
    "You're already on this plan. No changes were made.",

  // Router - UI Labels & Page Content
  router_checkout_preparing: "Preparing your checkout…",
  router_checkout_wait: "Please wait a moment.",
  router_redirect_us_store: "You'll be redirected to our US store.",
  router_redirect_checkout: "You'll be redirected to checkout.",
  router_continue_checkout: "Continue to Checkout",
  router_title_cancelled: "Subscription cancelled",
  router_title_welcome_back: "Welcome back!",
  router_title_paused: "Subscription paused",
  router_title_current_plan: "Current plan",
  router_title_plan_updated: "Plan updated!",
  router_title_contact_required: "Contact required",
  router_title_error: "Something went wrong",
  router_title_connection_error: "Connection error",
  router_title_already_subscribed: "Already subscribed",
  router_label_paused_until: "Paused until",
  router_label_next_billing: "Next billing",
  router_label_amount: "Amount",
  router_billing_period: "/{period}",
  router_button_contact_support: "Contact support",
  router_button_return_home: "Return home",
  router_button_try_again: "Try again",
  router_button_go_home: "Go home",
  router_button_view_content: "View my content",
  router_support_prompt: "If the problem persists, please contact",
  router_processing: "Processing",
  router_processing_message: "Please wait while we update your subscription...",

  // Router - Loading Messages
  router_loading_updating: "Updating your subscription...",
  router_loading_cancelling: "Cancelling your subscription...",
  router_loading_pausing: "Pausing your subscription...",
  router_loading_reactivating: "Reactivating your subscription...",
  router_loading_payment_redirect: "Redirecting to payment settings...",
  router_loading_processing: "Processing your request...",
  router_loading_wait: "Please wait, this may take a few seconds...",
  router_step_checking_account: "Checking your account",
  router_step_determining_region: "Determining your region",
  router_step_preparing_checkout: "Preparing checkout",

  // Router - Login & Country
  router_login_title: "Welcome to Bhakti+",
  router_login_subtitle: "Please log in to continue",
  router_country_title: "Confirm your country",
  router_country_description:
    "To ensure the best experience and accurate pricing, please confirm which country you're in.",
  router_country_note:
    "You can change your country later in your account settings.",

  // Video & Content Routes
  video_subscription_required: "This content requires a subscription",
  video_subscription_description:
    "Subscribe to unlock this video and get access to exclusive content",
  video_view_plans_button: "View subscription plans",
  video_pilgrimage_day: "Day {day} - {partName}",
  all_satsangs_title: "All satsangs",
  showing_satsangs_count: "Showing {count} of {total} satsangs",
  load_more: "Load more",
  empty_no_content_title: "No content available",
  empty_no_satsangs_subcategory:
    "There are currently no satsangs available in this subcategory.",
  latest_satsangs: "Latest satsangs",
  commentaries_premium_access: "Available for Supporter & Premium",
  show_less: "Show less",
  show_more: "Show more",
  videos_count: "Videos ({count})",
  pilgrimages_join_heading:
    "Join Paramahamsa Vishwananda on His virtual pilgrimages",
  days_count: "Days ({count})",
  all_talks_title: "All talks",
  showing_talks_count: "Showing {count} of {total} talks",
  latest_releases: "Latest releases",
  all_livestreams: "All livestreams",
  watch_more: "Watch more",

  // Homepage - Prelaunch
  homepage_prelaunch_greeting: "Jai Gurudev!",
  homepage_prelaunch_welcome:
    "Welcome to the Pre-Launch of Bhakti+. You have access to Ramcharitamanas Live and the live stream archive until {date}. Full access to Bhakti+ feature plans will be available to purchase soon. Hope you enjoy!",
  homepage_prelaunch_cta_heading: "Bhakti+ Pre-Launch",
  homepage_prelaunch_cta_description:
    "Sign up now to get free access to Paramahamsa Vishwananda Ramcharitamanas Live and the complete live stream archive until {date}",
  homepage_prelaunch_signup_button: "Sign up for free access",
  homepage_live_archive_title: "Live stream archive",

  content_purchase_separately_prelaunch: "Purchase separately",

  // Homepage - Lives Archive (relative dates)
  streamed_today: "Streamed today",
  streamed_yesterday: "Streamed yesterday",
  streamed_days_ago: "Streamed {days} days ago",
  streamed_on_date: "Streamed {date}",

  // Homepage - Content Types
  content_type_satsang: "Satsang",

  // Region Suggestion Banner
  region_banner_message:
    "It looks like you're in {country}. Would you like to switch to our {country} store?",
  region_banner_accept: "Yes, switch to {country}",
  region_banner_decline: "No, stay in {country}",
  region_banner_current_country: "current country",

  // Video/Content Cards
  video_singular: "video",
  video_plural: "videos",

  // ============================================
  // Tier Features (Subscription Plan Benefits)
  // ============================================

  // Live tier features
  tier_feature_live_streams: "LIVEstreams with Paramahamsa Vishwananda",
  tier_feature_live_recordings_30_days: "Access to LIVE recordings for 30 days",
  tier_feature_featured_satsang_daily: "Featured satsang each day",
  tier_feature_weekly_7_satsangs: "Weekly access to 7 satsangs",

  // Premium tier features
  tier_feature_everything_from_live: "Everything from the LIVE plan",
  tier_feature_unlimited_livestreams: "Unlimited access to all LIVEstreams",
  tier_feature_exclusive_satsangs: "100+ exclusive satsangs",
  tier_feature_scripture_commentaries: "x2 Scripture commentaries",
  tier_feature_virtual_pilgrimages: "x2 Virtual pilgrimages",
  tier_feature_smart_search_beta: "Smart search (test version)",

  // Premium tier feature tooltips (shown on hover of info icon)
  tier_tooltip_exclusive_satsangs:
    "More satsangs will be uploaded regularly throughout the year.",
  tier_tooltip_scripture_commentaries:
    "Scripture commentaries will be updated each January.",
  tier_tooltip_virtual_pilgrimages:
    "Virtual pilgrimages will be updated each January.",

  // TODO: remove after prelaunch
  // Supporter tier features
  tier_feature_everything_from_premium: "Everything from Premium plan",
  tier_feature_all_commentaries_pilgrimages:
    "+ All Scripture Commentaries and Virtual Pilgrimages",
  tier_feature_all_exclusive_talks:
    "+ All Exclusive Talks of Paramahamsa Vishwananda",
  tier_feature_future_programs:
    "+ Access to future programs, Commentaries, and Virtual Pilgrimages of Paramahamsa Vishwananda",
  tier_feature_12_month_commitment: "Minimum 12 month commitment",

  // Coming Soon (used for disabled tiers and features)
  // TODO: after prelaunch update the "Which devices can I use to access Bhakti+" text to remove [COMING SOON]
  coming_soon: "Coming soon",
  available_soon_banner_text: "Available soon!",

  // ============================================
  // Subscription Tier Card UI
  // ============================================

  // Tier card labels and badges
  tier_my_plan: "MY PLAN",
  tier_your_current_plan: "Your current plan",
  tier_unlocks_content_more: "UNLOCKS CONTENT",

  // Tier card button text
  tier_reactivate: "Reactivate",
  tier_change_frequency: "Change frequency",
  tier_contact_us: "Contact us",
  tier_upgrade: "Upgrade",
  tier_not_included: "Not included",
  tier_cancel_pending_downgrade: "Cancel downgrade",
  tier_scheduled_downgrade: "Downgrade",
  tier_downgrade_scheduled_info: "Your downgrade to this plan is scheduled",

  // Pending downgrade messages for MembershipCard
  account_downgrade_scheduled_to_live:
    "Your subscription will change to Live on {date}",
  account_downgrade_scheduled_to_premium:
    "Your subscription will change to Premium on {date}",

  // Price interval labels
  tier_interval_year: "year",
  tier_interval_month: "month",

  // Aria labels for tier cards
  aria_collapse_features: "Collapse features",
  aria_expand_features: "Expand features",

  // ============================================
  // All Plans Include Benefits Column
  // ============================================
  tier_benefits_title: "Benefits of Bhakti+",
  tier_benefits_live_interpretation: "LIVE human interpretation",
  tier_benefits_ai_audio: "AI audio interpretation",
  tier_benefits_ai_audio_test: "(test version)",
  tier_benefits_ios_android: "iOS & Android apps",
  tier_benefits_offline_viewing: "Offline viewing",
  tier_benefits_new_monthly_content: "New monthly content",
  tier_benefits_airplay_support: "AirPlay Support",
  tier_benefits_background_play: "Background play",

  // ============================================
  // Content Availability Page
  // ============================================

  // Page header
  content_availability_title: "Content availability by language",
  content_availability_subtitle:
    "See what's available in your preferred language",

  // Language filter
  content_availability_filter_label: "Filter by Language",
  content_availability_all_languages: "All languages",

  // Section titles
  content_availability_premium_plan: "Premium plan",
  content_availability_premium_plan_subtitle:
    "Included with Premium membership",
  content_availability_ppv_content: "Pay-Per-View Content",
  content_availability_ppv_content_subtitle:
    "Available for individual purchase",

  // Content type labels
  content_availability_satsangs: "Satsangs",
  content_availability_talks: "Talks",
  content_availability_pilgrimages: "Pilgrimages",
  content_availability_commentaries: "Commentaries",

  // Counts and labels
  content_availability_videos_available: "{count} videos available",
  content_availability_video_count: "{count} videos",
  content_availability_included_count: "{type} Included ({count})",
  content_availability_excludes_premium: "Excludes {count} included in Premium",

  // Table headers
  content_availability_audio: "Audio",
  content_availability_subtitles: "Subtitles",
  content_availability_title_column: "Title",

  // Expand/collapse
  content_availability_view_all: "View all {type}",
  content_availability_hide_all: "Hide all {type}",
  content_availability_more_languages: "+ {count} more",

  // Legend
  content_availability_legend: "Legend",
  content_availability_auto_generated:
    "[auto] = Auto-generated (AI voice or machine translation)",

  // Empty/error states
  content_availability_no_results: "No content available in {language}",
  content_availability_no_results_subtitle:
    "Try selecting a different language or view all content",
  content_availability_view_all_content: "View all content",

  // ============================================
  // Promo Banners
  // ============================================
  promo_banner_holi_2026: "Join the Holi 2026 pilgrimage",
  promo_holi_header_plan: "Premium Yearly plan",
  promo_holi_header_prefix_member: "Included in your",
  promo_holi_description_member:
    "Thank you for your support! Your membership includes free access to the Holi 2026 Virtual Pilgrimage.",
} as const;

export type TranslationKey = keyof typeof TRANSLATION_KEYS;
export type TranslationDictionary = Record<TranslationKey, string>;
