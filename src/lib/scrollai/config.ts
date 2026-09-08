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
  const amazonTag = process.env.AMAZON_ASSOCIATES_TAG?.trim() || "fs08-21";

  return {
    agent: "scrollai",
    app: "scroller",
    status: "active",
    daily_target_usd: SCROLLAI_DAILY_REVENUE_TARGET_USD,
    orchestration: ["scroller", "wikai", "mediai"],
    revenue_channels: {
      adsense: {
        configured: Boolean(adsenseClient),
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
