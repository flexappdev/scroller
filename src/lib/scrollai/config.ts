import { GA_ID, isAnalyticsEnabled } from "@/lib/analytics";

export const SCROLLAI_DAILY_REVENUE_TARGET_USD = 100 as const;

export const SCROLLAI_REVENUE_CHANNELS = [
  {
    id: "adsense",
    label: "Google AdSense",
    role: "Display advertising revenue",
  },
  {
    id: "amazon",
    label: "Amazon Associates",
    role: "Attributed affiliate revenue",
  },
] as const;

export function getScrollAIStatus() {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || null;
  const adsenseFeedSlot = process.env.NEXT_PUBLIC_ADSENSE_FEED_SLOT?.trim() || null;
  const adsenseAccountStatus = process.env.ADSENSE_ACCOUNT_STATUS?.trim() || "unknown";
  const amazonTag = process.env.AMAZON_ASSOCIATES_TAG?.trim() || "fs08-21";

  return {
    agent: "scrollai",
    app: "scroller",
    status: "active",
    daily_target_usd: SCROLLAI_DAILY_REVENUE_TARGET_USD,
    orchestration: ["scroller", "wikai", "mediai"],
    analytics: {
      ga4: {
        configured: isAnalyticsEnabled(),
        measurement_id: isAnalyticsEnabled() ? GA_ID : null,
        reporting_telemetry: "not-connected",
        network_strategy: "one MS Scroll web stream; compare by hostname/channel",
      },
    },
    revenue_channels: {
      adsense: {
        configured: Boolean(adsenseClient),
        feed_slot_configured: Boolean(adsenseFeedSlot),
        account_status: adsenseAccountStatus,
        anonymous_feed_cadence: "after every 20 content items when configured",
        revenue_telemetry: "not-connected",
      },
      amazon: {
        configured: Boolean(amazonTag),
        tag: amazonTag,
        revenue_telemetry: "not-connected",
      },
    },
    abc_reporting: {
      revenue: "evidence-only",
      unknown_policy: "missing telemetry is null/unknown, never zero",
    },
  };
}
