# ScrollAI Ultimate Diagram — 2026-09-10

This is the source-of-truth architecture for the September ScrollAI monetisation push.

## 1G

Build one reusable Scroller system that powers **3 flagship domains**, launches **33 Scrollers**, scales winning packs from **100 → 1K → 10K items**, and drives toward **$100/day gross revenue** without multiplying application code or Vercel builds.

## Master architecture

```mermaid
flowchart TB
  MAT["Mat / DJ / 1G\nTopic, priorities, commercial intent"]
  ABC["ABC LIVE / Skai\nPortfolio + daily orchestration"]
  SHEET["Google Sheet *2026*\nSITES · APPS · AGENTS · COSTS · SCROLLERS"]

  subgraph CONTROL["CONTROL PLANE"]
    SA["ScrollAI\nResearch · Rank · Build · Refresh · Publish · Optimise"]
    SPEC["Scroller Spec\nsite config + pack manifest + monetisation + theme"]
    QA["Validation Gate\nscroller:validate · tests · build"]
    DEPLOY["Deploy Gate\nData-first · runtime deploy only when code changes"]
  end

  subgraph KNOWLEDGE["KNOWLEDGE + ASSET PLANE"]
    WEB["Live sources / feeds / APIs"]
    WIKI["WikAI\nWikipedia · Wikivoyage · Wikimedia\narticles · entities · attribution"]
    VAULT["VaultAI\ncanonical items · snapshots · metadata · asset refs"]
    MEDIA["MediAI\nimages · audio · shorts · long-form video"]
  end

  subgraph ENGINE["ONE SHARED SCROLLER ENGINE"]
    RUNTIME["Scroller Runtime\n/scroller/[slug]\nvertical snap feed"]
    UI["Universal UX\nHome · Explore · Gen · Saved · Me\ndark default · sticky header/footer"]
    PACKS["Scroller Packs\n33 initial packs\nTop 100 → 1K → 10K winners"]
  end

  subgraph FLAGSHIPS["3 FLAGSHIP DOMAINS"]
    STV["scroller.tv\nDiscovery + mixed topic feed"]
    WTV["wikai.tv\nKnowledge-first feed"]
    MTV["mediai.tv\nMedia-first feed"]
  end

  subgraph LEGACY["LEGACY + NICHE DISTRIBUTION"]
    L14["14 legacy domains\nMS / YB100 / WBP / London / World Cup AI / etc."]
    SUBS["Subdomain apps\nembed the same Scroller packs"]
  end

  subgraph TRAFFIC["DISTRIBUTION"]
    SEO["Search / Discover / direct"]
    YTL["YouTube long-form"]
    YTS["YouTube Shorts"]
    TT["TikTok"]
    SOCIAL["Other social\nsecondary / promotional"]
  end

  subgraph MONEY["MONETISATION"]
    ADS["Google AdSense\nanonymous feed ad every 20 items"]
    AMZ["Amazon Associates\nproduct-intent links"]
    TRAVEL["Travel affiliates\nBooking / activities / transport where relevant"]
    YTM["YouTube monetisation"]
    TTSHOP["TikTok Shop / affiliate"]
    LEADS["Direct offers / leads / sponsors"]
  end

  subgraph MEASURE["MEASURE + FEEDBACK"]
    GA4["GA4\nsessions · depth · item opens"]
    REV["Revenue telemetry\nAdSense · Amazon · YouTube · TikTok · affiliates"]
    COST["CostAI / Vercel cost\nbuilds · hosting · generation"]
    SCORE["Winner score\ntraffic × RPM × conversion − cost"]
  end

  MAT --> ABC --> SA
  ABC <--> SHEET
  SHEET <--> SA

  WEB --> WIKI --> VAULT
  MEDIA <--> VAULT
  WIKI --> SA
  VAULT --> SA
  SA --> SPEC --> PACKS
  SA --> MEDIA
  MEDIA --> PACKS

  PACKS --> QA --> DEPLOY --> RUNTIME
  UI --- RUNTIME

  RUNTIME --> STV
  RUNTIME --> WTV
  RUNTIME --> MTV
  RUNTIME --> L14
  RUNTIME --> SUBS

  STV --> SEO
  WTV --> SEO
  MTV --> SEO
  STV --> YTS
  WTV --> YTL
  MTV --> YTS
  MTV --> TT
  L14 --> SEO

  STV --> ADS
  WTV --> ADS
  MTV --> ADS
  STV --> AMZ
  WTV --> AMZ
  MTV --> AMZ
  WTV --> TRAVEL
  L14 --> TRAVEL
  YTL --> YTM
  YTS --> YTM
  TT --> TTSHOP
  STV --> LEADS

  SEO --> GA4
  STV --> GA4
  WTV --> GA4
  MTV --> GA4
  ADS --> REV
  AMZ --> REV
  TRAVEL --> REV
  YTM --> REV
  TTSHOP --> REV
  LEADS --> REV

  DEPLOY --> COST
  MEDIA --> COST
  GA4 --> SCORE
  REV --> SCORE
  COST --> SCORE
  SCORE --> ABC
  SCORE --> SA
  SCORE --> SHEET

  SA -. "refresh winners" .-> PACKS
  SA -. "scale only proven topics" .-> MEDIA
```

## Operating rule

**One engine, three flagship domains, many packs.** A new topic creates data, not a new Next.js application.

```text
DJ / topic
  ↓
ScrollAI
  ↓
page.md → items.json → reusable assets → manifest.json
  ↓
validate
  ↓
shared Scroller runtime
  ↓
scroller.tv | wikai.tv | mediai.tv | legacy embeds
  ↓
traffic
  ↓
AdSense + Amazon + travel + YouTube + TikTok + direct offers
  ↓
ABC / CostAI profitability score
  ↓
refresh, rerank, scale winners
```

## Deployment-cost circuit breaker

```mermaid
flowchart LR
  CHANGE{"What changed?"}
  DATA["Pack/data only"]
  CODE["Shared runtime code"]
  VALIDATE["Validate pack"]
  TEST["Full build + e2e"]
  CONTENT["Publish content through existing runtime"]
  ONEDEPLOY["One controlled production deploy"]
  BLOCK["Block duplicate / low-value deploys"]

  CHANGE -->|items, article, rankings, asset refs| DATA --> VALIDATE --> CONTENT
  CHANGE -->|UI, engine, routing, monetisation code| CODE --> TEST --> ONEDEPLOY
  ONEDEPLOY --> BLOCK
```

### Hard rules

1. Do **not** fork Scroller code per topic or per domain.
2. Do **not** deploy for every generated item or media asset.
3. Batch runtime code changes into controlled releases.
4. Prefer data refreshes against the existing runtime.
5. Generate expensive media only after Page + List validate.
6. Reuse WikAI/VaultAI/MediAI assets before generating anything new.
7. Scale only packs with measured traffic/revenue signal.
8. Keep ads out of logged-in feeds and away from navigation.
9. `SCROLLERS` in the *2026* sheet becomes the operational fleet view; SITES/APPS remain portfolio hierarchy.
10. ABC is the portfolio truth; ScrollAI is the Scroller control plane.

## September target state

- **3 flagship sites:** `scroller.tv`, `wikai.tv`, `mediai.tv`.
- **33 Scroller packs** in one fleet view.
- **100 items minimum per new pack**; winners progressively expand to 1K/10K.
- **Same pages/routes/UX contract** across all three domains.
- **AdSense + affiliate disclosure + conversion tracking** wired once at engine level.
- **YouTube long + Shorts + TikTok** fed from the same canonical content/media graph.
- **Single profitability loop:** traffic + revenue − hosting/generation cost.
- September = proof and first revenue signal; October = break-even target; November = positive target.

## Next implementation order

1. Lock this architecture and site/domain routing.
2. Add the `SCROLLERS` fleet model and sheet sync.
3. Define the 3 domain configs using one shared runtime.
4. Create the first 33 pack registry entries without generating new app code.
5. Add monetisation adapters and disclosures once in the shared engine.
6. Add analytics/revenue/cost event schema.
7. Add deployment circuit breaker and batch-release policy.
8. Validate the 3 flagship sites end-to-end.
9. Fill Top 100 packs and reuse existing WikAI/MediAI/VaultAI content.
10. Scale only measured winners.
