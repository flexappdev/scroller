"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

/**
 * Small provider-neutral bridge from the shared Scroller interaction model to
 * GA4. It intentionally sends no user identity or free-form personal data.
 *
 * AdSense note: we only record that our own ad slot became visible. We never
 * instrument or infer ad clicks; provider-side AdSense reporting remains the
 * authority for ad impressions/clicks/revenue.
 */
export default function AnalyticsBridge() {
  const pathname = usePathname();
  const lastFeedKey = useRef<string | null>(null);

  useEffect(() => {
    trackEvent("page_view", {
      page_path: pathname,
      channel: "scroller",
      product: "ms-scroll",
    });
  }, [pathname]);

  useEffect(() => {
    function onPosition(event: Event) {
      const detail = (event as CustomEvent<{ index?: number; total?: number }>).detail || {};
      const index = Number(detail.index);
      const total = Number(detail.total);
      if (!Number.isFinite(index)) return;

      const card = document.querySelector<HTMLElement>(`[data-card-index="${index}"]`);
      const topic = card?.getAttribute("aria-label") || undefined;
      const key = `${pathname}:${index}:${topic || ""}`;
      if (lastFeedKey.current === key) return;
      lastFeedKey.current = key;

      trackEvent("item_view", {
        channel: "scroller",
        mode: "scroll",
        item_index: index + 1,
        item_total: Number.isFinite(total) ? total : undefined,
        item_title: topic,
      });
    }

    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) {
          trackEvent("outbound_click", {
            channel: "scroller",
            link_domain: url.hostname,
            link_url: url.href,
          });
        }
      } catch {
        // Ignore malformed/unsupported URLs; navigation itself must never fail.
      }
    }

    const observedAds = new WeakSet<Element>();
    const adObserver = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue;
            if (observedAds.has(entry.target)) continue;
            observedAds.add(entry.target);
            const ad = entry.target as HTMLElement;
            trackEvent("ad_slot_view", {
              channel: "scroller",
              placement: "feed",
              after_item: Number(ad.dataset.afterItem || 0) || undefined,
            });
            adObserver?.unobserve(entry.target);
          }
        }, { threshold: [0.5] })
      : null;

    const observeAds = () => {
      if (!adObserver) return;
      document.querySelectorAll("[data-testid='adsense-feed-card']").forEach((node) => {
        if (!observedAds.has(node)) adObserver.observe(node);
      });
    };
    observeAds();

    const mutationObserver = typeof MutationObserver !== "undefined"
      ? new MutationObserver(observeAds)
      : null;
    mutationObserver?.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("scroller:position", onPosition as EventListener);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("scroller:position", onPosition as EventListener);
      document.removeEventListener("click", onClick, true);
      mutationObserver?.disconnect();
      adObserver?.disconnect();
    };
  }, [pathname]);

  return null;
}
