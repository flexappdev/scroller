# Revenue telemetry (`/api/revenue`)

One endpoint reports revenue for scroller.tv, wikai.tv and mediai.tv so ABC can read it (BL-081, BL-118).

`GET https://scroller.tv/api/revenue` returns `ms-scroll-revenue/v1`:

- `totals_usd` and per-site `revenue_usd` for `today`, `yesterday` and `last_7d` (Europe/London days).
- `ladder`: the $1 → $10 → $100/day rungs, judged on yesterday's total.
- `sites[].adsense`: AdSense Management API earnings, page views and clicks by domain.
- `sites[].amazon`: Amazon Associates earnings from `data/revenue/ledger.json` (Amazon has no reporting API).
- `sites[].ga4_events`: `page_view`, `affiliate_click`, `outbound_click`, `ad_slot_view` counts by hostname.
- `sites[].live`: a live check that each homepage serves its `ca-pub-` and `G-` IDs and that `ads.txt` lists the publisher.
- `finance_entries`: yesterday's evidenced revenue in ABC finance-ledger shape.

Unconnected sources are `null`, never `0`. Add `?probe=0` to skip the live checks.

## Environment (Vercel, scroller project)

| Variable | Purpose |
| --- | --- |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` | One Google OAuth client and refresh token with `adsense.readonly` and `analytics.readonly` scopes |
| `ADSENSE_ACCOUNT_ID` | Defaults to `pub-1457156776981797` |
| `GA4_PROPERTY_ID` | Numeric GA4 property ID (not the `G-` ID) |
| `REVENUE_API_TOKEN` | Optional. When set, callers send `Authorization: Bearer <token>` or `?token=` |
| `REVENUE_GBP_USD` | Optional rate used to include GBP ledger entries in USD totals |

## Amazon ledger entry

```json
{ "date": "2026-10-06", "site": "wikai", "source": "amazon", "amount": 1.84, "currency": "GBP", "evidence": "Associates Central earnings report" }
```
