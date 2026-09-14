# MS Scroll — GA4 + AdSense + BOAI Live Status

**Date:** 2026-09-14  
**Spec:** `MSSCROLL`  
**Backlog:** `MSS-010`, `MSS-011`, `MSS-012`, `MSS-013`  
**Goal:** evidence-backed traffic + monetisation loop for `scroller.tv`, `wikai.tv`, `mediai.tv`  
**1G:** **$100/day gross revenue** target — never a guarantee.

## Current state

| Surface | GA4 code | AdSense code | ads.txt | Provider telemetry |
|---|---|---|---|---|
| `scroller.tv` | Ready: gtag component + shared event bridge | Ready: loader + anonymous feed unit after every 20 content items | Publisher declaration added | Not connected |
| `wikai.tv` | Ready: gtag component | Ready: loader + article ad configuration | Publisher declaration added | Not connected |
| `mediai.tv` | Ready: static GA loader + TV events, disabled until a real `G-` ID is configured | Loader is gated and disabled until AdSense is active/approved | Publisher declaration added | Not connected |
| BOAI | Live-status code implemented | Provider/config/tag status implemented | Checks `/ads.txt` per domain | Revenue remains Unknown until reporting is connected |

A code-ready state is **not** the same as a live/verified provider state. The public production pages must be rechecked after deployment and provider configuration.

## GA4 strategy

Use one MS Scroll GA4 measurement strategy across the three tightly related channels. Prefer one GA4 web data stream / Measurement ID (`G-...`) on all three domains, then compare by hostname and explicit `channel` event parameter.

Configure cross-domain measurement for:

```text
scroller.tv
wikai.tv
mediai.tv
```

### Canonical event contract

All channels should progressively converge on these events:

| Event | Required parameters |
|---|---|
| `page_view` | `channel`, `page_path`, `product=ms-scroll` |
| `item_view` | `channel`, `mode`, `item_id`, `item_index`, optional `item_title`, `item_total` |
| `item_open` | `channel`, `mode`, `item_id` |
| `scroll_depth` | `channel`, `mode`, `depth` |
| `completion` | `channel`, `mode`, `item_id`, `completion_pct` |
| `media_play` | `channel`, `item_id`, `media_kind` |
| `save` | `channel`, `item_id`, `state` |
| `share` | `channel`, `item_id`, optional `method` |
| `outbound_click` | `channel`, `item_id`, `link_domain`, optional `commercial_type` |
| `affiliate_click` | `channel`, `item_id`, `provider` |
| `ad_slot_view` | `channel`, `placement`, `after_item` |
| `tv_control` | `channel`, `action` |
| `tv_session_start` | `channel`, `item_total` |

Do not send personal identity, email addresses, free-form private text, or secrets to analytics.

## AdSense strategy

Publisher account evidence identifies publisher `pub-1457156776981797`. The last verified account evidence says the account was **deactivated because onboarding was incomplete**. Treat the account as inactive until Google confirms reactivation.

### Activation order

1. Reactivate the AdSense account and complete onboarding.
2. Add/approve `scroller.tv`, `wikai.tv`, and `mediai.tv` in AdSense as required.
3. Keep the shared `ads.txt` publisher declaration live on every domain.
4. Configure a Google-certified CMP / TCF flow before personalised ads for UK/EEA/Switzerland traffic.
5. Configure publisher client + ad-unit slots in production environments.
6. Verify live tags and ad requests on production.
7. Connect provider reporting to BOAI before showing revenue/RPM values.

### Product rules

- Anonymous visitors only for feed display ads where specified.
- Signed-in feed stays ad-free.
- Feed cadence: one clearly labelled ad after every **20 content items**.
- Ad cards are never part of content rank/count/save indexes.
- Ads stay away from primary navigation/swipe controls.
- No encouragement to click ads.
- Missing revenue stays `Unknown` / `null`, never `$0`.

## BOAI dashboard

BOAI route:

```text
/ms-scroll
```

Status API:

```text
GET /api/ms-scroll/status
```

The dashboard is designed to show:

- 3-site HTTP health + latency;
- GA4 tag detection + discovered `G-...` IDs;
- AdSense script/publisher detection;
- `/ads.txt` availability + publisher declaration;
- configured provider IDs;
- provider account status when explicitly configured;
- 1G target;
- verified revenue only after reporting is connected;
- `Unknown` for missing provider data.

The first implementation is a **read-only operational status** surface. Provider reporting and editing controls are later layers.

## Provider reporting layer

The dashboard should distinguish three states:

```text
CODE READY
  ↓
TAG LIVE / VERIFIED
  ↓
PROVIDER REPORTING CONNECTED
```

Only the third state may populate traffic/revenue KPI cards with authoritative provider values.

Desired GA4 cards:

- users / sessions today;
- views and item views;
- average engagement time;
- scroll depth / item depth;
- top channel;
- top item/topic;
- outbound clicks;
- 7-day trend.

Desired AdSense cards:

- estimated earnings today;
- page views / impressions;
- RPM;
- CTR where available and appropriate;
- coverage;
- earnings by site/channel where provider granularity supports it.

Then join with CostAI:

```text
gross revenue
- hosting cost
- generation cost
= net contribution
```

## Rollout gate

### Phase A — complete now

- GA4/AdSense scaffolding in Scroller/WIKAI.
- Scroller item/outbound/ad-slot event bridge.
- MediaAI GA4/TV-event bridge, provider-gated.
- `ads.txt` in all three repos.
- BOAI `/ms-scroll` dashboard + status API.
- AI26 spec/backlog evidence updated.

### Phase B — account/config action

- obtain the real GA4 `G-...` Measurement ID;
- configure it on all 3 channels;
- configure cross-domain measurement;
- reactivate AdSense;
- complete site approval + CMP;
- add live publisher/slot settings;
- deploy/restart the affected runtimes.

### Phase C — evidence

- production probe finds GA4 on all 3 domains;
- production probe finds expected `ads.txt` on all 3 domains;
- AdSense tag/request visible only where enabled;
- GA4 DebugView/realtime receives events;
- BOAI provider data is connected;
- revenue remains Unknown until provider values exist.

## Definition of done

`MSS-010` / `MSS-011` are not DONE until:

1. all three domains send the agreed GA4 event contract;
2. live production tags are verified;
3. AdSense account/site/CMP requirements are complete;
4. ad cadence/auth rules are verified;
5. BOAI displays provider-backed analytics/revenue;
6. CostAI can calculate gross vs cost vs net contribution;
7. evidence links are written back to AI26.
