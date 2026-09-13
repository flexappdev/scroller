# ScrollAI Ultimate Architecture — 2026-09-13

This document is the portfolio/1G architecture view for ScrollAI and MS Scroll.

For implementation-level diagrams, use:

- `docs/MS-SCROLL-ABC-DIAGRAMS.md`
- `docs/MS-SCROLL-MASTER-SPEC.md`
- `docs/MS-SCROLL-BACKLOG.md`
- `skills/abc-diagrams/SKILL.md`

## 1G objective

Build one reusable Scroll + TV system that powers `scroller.tv`, `wikai.tv`, `mediai.tv`, reuses existing knowledge/media, scales winning packs, and drives toward **$100/day gross revenue** without multiplying codebases, builds or provider spend.

The KPI is a target, not a guarantee.

---

## L0 — Human × AI collaboration

```mermaid
flowchart TB
  MAT["Mat\nhuman intent · taste · priorities"]
  SKAI["Skai / ABC\nAI orchestrator"]
  AI26["AI26\nportfolio source of truth"]
  SA["ScrollAI\nMS Scroll owner"]
  ENGINE["Shared MS Scroll Engine"]
  CHANNELS["scroller.tv · wikai.tv · mediai.tv"]
  USERS["Audience"]
  MONEY["Revenue · Cost · Profit signal"]

  MAT <--> SKAI
  SKAI <--> AI26
  SKAI --> SA
  SA --> ENGINE --> CHANNELS --> USERS --> MONEY
  MONEY --> SKAI
  USERS -. behaviour .-> SA
  MAT -. editorial judgement .-> SA
```

The collaboration model is intentionally asymmetric:

- human chooses direction, taste, risk and final priorities;
- AI researches, structures, generates, tests, measures and proposes;
- evidence returns to the human/ABC loop.

---

## L1 — Master architecture

```mermaid
flowchart TB
  MAT["Mat / DJ / 1G"]
  ABC["ABC / Skai\norchestration · portfolio · evidence"]
  SHEET["AI26 Google Sheet\nSPEC · BACKLOG · SITES · AGENTS · DATA · COSTS · MS SCROLL · TV 2026"]

  subgraph CONTROL["CONTROL PLANE"]
    SA["ScrollAI\nresearch · rank · programme · publish · optimise"]
    SPEC["MSSCROLL\nmaster spec"]
    BL["MSS-*\nshared backlog"]
    MAN["Channel manifests\nscroller · wikai · mediai"]
    QA["Validation / parity gate"]
  end

  subgraph KNOWLEDGE["KNOWLEDGE + ASSET PLANE"]
    SOURCES["Wikipedia · Wikivoyage · Wikimedia\nTMDB · Books · GitHub · YouTube · trends"]
    VAULT["VaultAI\ncanonical IDs · provenance · context"]
    WIKI["WIKAI\nknowledge adapter"]
    MEDIA["MediaAI\nimages · audio · motion · video"]
    LIST["ListAI\nTop 100 / ranked structures"]
  end

  subgraph ENGINE["ONE SHARED MS SCROLL ENGINE"]
    RESOLVE["domain/channel resolver"]
    SHELL["universal shell"]
    FEED["Scroll feed"]
    TV["TV player + scheduler"]
    SCORE["feed scorer + diversity"]
    AUTH["auth · saved · history"]
    MON["monetisation adapters"]
    EVT["analytics events"]
  end

  subgraph FLAGSHIPS["FLAGSHIP CHANNELS"]
    STV["scroller.tv\nmixed discovery"]
    WTV["wikai.tv\nknowledge"]
    MTV["mediai.tv\nmedia"]
  end

  subgraph OPS["OPERATIONS"]
    BO["BOAI / private Live\nmanifest · schedule · tasks · publish"]
    APP["AppAI\nshared runtime engineering"]
    COST["CostAI\nhosting · generation · provider cost"]
  end

  subgraph MONEY["MONEY + FEEDBACK"]
    ADS["AdSense"]
    AFF["Affiliates"]
    DIRECT["Later: direct / sponsor / membership"]
    REV["Gross revenue"]
    PROFIT["Net contribution"]
    WINNER["Winner score"]
  end

  MAT <--> ABC
  ABC <--> SHEET
  ABC --> SA
  SHEET --> SPEC --> BL
  SPEC --> MAN
  SOURCES --> WIKI --> VAULT
  MEDIA <--> VAULT
  LIST <--> VAULT
  VAULT --> SA
  SA --> MAN --> RESOLVE
  RESOLVE --> SHELL
  SHELL --> FEED
  SHELL --> TV
  SCORE --> FEED
  AUTH --> SHELL
  MON --> SHELL
  EVT --> SHELL

  ENGINE --> STV
  ENGINE --> WTV
  ENGINE --> MTV

  BO --> ENGINE
  APP --> ENGINE
  COST --> PROFIT

  STV --> ADS
  WTV --> ADS
  MTV --> ADS
  STV --> AFF
  WTV --> AFF
  MTV --> AFF
  ADS --> REV
  AFF --> REV
  DIRECT --> REV
  REV --> PROFIT --> WINNER
  WINNER --> ABC
  WINNER --> SA
  WINNER --> SHEET
```

---

## Operating rule

**One engine, three flagship channels, many packs.**

```text
human idea / live topic / source signal
  ↓
ScrollAI
  ↓
research + canonical item/list/page
  ↓
reuse assets first; enrich only gaps
  ↓
validate eligibility
  ↓
shared runtime
  ↓
scroller.tv | wikai.tv | mediai.tv
  ↓
Scroll / TV / Latest / Top
  ↓
traffic + engagement
  ↓
AdSense + affiliates + later direct offers
  ↓
revenue − cost
  ↓
ABC / CostAI winner score
  ↓
refresh / rerank / scale proven winners
```

A new topic creates data/pack state. A new channel creates a manifest + adapters/data. Neither should automatically create a new application fork.

---

## Rebuild contract

```mermaid
flowchart LR
  SPEC["MSSCROLL spec"]
  MAN["channel manifest"]
  DATA["canonical data"]
  ASSET["asset refs"]
  CODE["shared engine"]
  ENV["provider/env config"]
  BUILD["rebuild"]
  TEST["validate + e2e"]
  LIVE["reproducible channel"]

  SPEC --> BUILD
  MAN --> BUILD
  DATA --> BUILD
  ASSET --> BUILD
  CODE --> BUILD
  ENV --> BUILD
  BUILD --> TEST --> LIVE
```

Undocumented live tweaks are drift; they must be pulled back into the spec/config.

---

## Content quality ladder

```mermaid
flowchart LR
  RAW["24K+ candidate inventory"] --> VALID["21.9K schedulable"]
  VALID --> CURATED["10K curated"]
  CURATED --> PREMIUM["1K premium"]
  PREMIUM --> T100["Top 100"]
  T100 --> T10["Top 10"]
  T10 --> T1["Top 1"]
```

The exact intermediate quality tiers are evidence-driven, not arbitrary guarantees.

---

## TV system

```mermaid
flowchart LR
  ITEMS["eligible catalogue"] --> RULES["programming rules"] --> CAL["TV 2026"]
  CAL --> DAY["60 × 24-minute POM/day"]
  DAY --> NOW["current slot"] --> PLAYER["Live TV player"]
  PLAYER --> NEXT["next POM"] --> PLAYER
```

- 60 × 24 minutes = 24 hours/day.
- 21,900 POM slots/year.
- Catalogue can exceed the linear schedule capacity.

---

## Feed intelligence

```mermaid
flowchart LR
  C["candidates"] --> E["eligibility"] --> S["score"] --> D["diversity/caps"] --> F["feed"]
  F --> V["viewer events"] --> A["aggregates"]
  A -. feedback .-> S
  H["human editorial signal"] -.-> S

  Q["quality"] --> S
  FR["freshness"] --> S
  I["interest"] --> S
  N["novelty"] --> S
  EN["engagement"] --> S
  SE["serendipity"] --> S
```

Start explainable; add heavier personalisation only when data justifies it.

---

## Monetisation loop

```mermaid
flowchart LR
  CONTENT["useful content"] --> TRAFFIC["traffic"] --> ENGAGE["engagement"]
  ENGAGE --> ADS["ads"] --> REV["gross"]
  ENGAGE --> AFF["affiliates"] --> REV
  REV --> NET["net contribution"]
  COST["hosting + generation cost"] --> NET
  NET --> SCORE["winner score"] --> SCALE["scale winners"] --> CONTENT
```

Unknown provider telemetry stays unknown; never convert missing values to zero.

---

## Deployment-cost circuit breaker

```mermaid
flowchart LR
  CHANGE{"What changed?"}
  DATA["Pack/data/ranking/schedule/assets"]
  CODE["Shared runtime code"]
  VALIDATE["Validate"]
  CONTENT["Publish through existing runtime"]
  TEST["Build + e2e"]
  ONEDEPLOY["One controlled deploy"]
  VERIFY["Live verification"]

  CHANGE -->|data only| DATA --> VALIDATE --> CONTENT
  CHANGE -->|shared code| CODE --> TEST --> ONEDEPLOY --> VERIFY
```

### Hard rules

1. Do **not** fork Scroller code per topic/domain.
2. Do **not** deploy for every generated item/media asset.
3. Batch shared-runtime code changes into controlled releases.
4. Prefer data/config refreshes against the existing runtime.
5. Generate expensive media only after useful text/list stages validate.
6. Reuse WIKAI/VaultAI/MediaAI assets before generation.
7. Scale only items/topics with measured value.
8. Keep monetisation away from primary navigation and comply with provider/consent rules.
9. AI26 is the human/portfolio source of truth.
10. ScrollAI is the MS Scroll control plane; ABC is the portfolio orchestrator.

---

## Migration

```mermaid
flowchart LR
  S["Scroller codebase"] --> CONTRACT["shared contracts"]
  W["WIKAI codebase"] --> CONTRACT
  M["MediaAI codebase"] --> CONTRACT
  CONTRACT --> ENGINE["shared engine"]
  W --> WA["WIKAI adapter"] --> ENGINE
  M --> MA["MediaAI adapter"] --> ENGINE
  S --> SA["mixed adapter"] --> ENGINE
  ENGINE --> PARITY["3-domain parity gate"]
  PARITY --> RETIRE["retire duplicated UI/runtime"]
```

Specialist data/media services may remain separate. The goal is to eliminate duplicated product/runtime layers, not to force every subsystem into one process.

---

## Source-of-truth loop

```mermaid
flowchart LR
  DJ["DJ / conversation"] --> AI26["AI26 spec"] --> BL["MSS-* backlog"]
  AI26 --> DIAG["ABC diagrams"]
  BL --> CODE["code/config/data"]
  DIAG --> CODE
  CODE --> TEST["test/live"] --> EVIDENCE["evidence"] --> BL
```

Architecture-changing decisions must update the diagram atlas in the same documentation change.

Full detailed diagrams: `docs/MS-SCROLL-ABC-DIAGRAMS.md`.
