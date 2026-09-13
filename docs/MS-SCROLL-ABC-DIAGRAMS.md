# MS Scroll ABC Diagram Atlas

**Collection:** `MSSCROLL`  
**Principle:** **One engine → N channels**  
**Human source of truth:** AI26 Google Sheet  
**Implementation mirror:** `flexappdev/scroller`  
**Diagram standard:** `skills/abc-diagrams/SKILL.md`

This is the canonical architecture atlas for the MS Scroll collection. It complements:

- `docs/MS-SCROLL-MASTER-SPEC.md`
- `docs/MS-SCROLL-BACKLOG.md`
- `docs/SCROLLAI-ULTIMATE-DIAGRAM.md`

Target/WIP components are shown as architecture intent and must not be interpreted as production-complete without test/live evidence.

---

## 0. Executive view — human × AI factory

```mermaid
flowchart TB
  MAT["Mat\nintent · taste · priorities"]
  SKAI["Skai / ABC\norchestration · evidence · 1G"]
  AI26["AI26 Google Sheet\nSPEC · BACKLOG · SITES · DATA · COSTS"]
  SA["ScrollAI\nMS Scroll owner"]
  ENGINE["MS Scroll Engine\nshared Scroll + TV runtime"]
  CFG["Channel Manifests\nscroller · wikai · mediai"]
  DATA["Canonical Content Graph\nitems · assets · provenance · metrics"]
  STV["scroller.tv\nmixed discovery"]
  WTV["wikai.tv\nknowledge"]
  MTV["mediai.tv\nmedia"]
  HUMAN["Audience\nwatch · scroll · save · share · click"]
  MONEY["Revenue + Cost\nAdSense · affiliates · CostAI"]

  MAT <--> SKAI
  SKAI <--> AI26
  SKAI --> SA
  AI26 --> SA
  SA --> ENGINE
  CFG --> ENGINE
  DATA --> ENGINE
  ENGINE --> STV
  ENGINE --> WTV
  ENGINE --> MTV
  STV --> HUMAN
  WTV --> HUMAN
  MTV --> HUMAN
  HUMAN --> MONEY
  MONEY --> SKAI
  HUMAN -. "behaviour signals" .-> DATA
  MAT -. "editorial judgement" .-> SA
```

**Question answered:** who collaborates with whom, and where does the feedback return?

---

## 1. One engine → N channels

```mermaid
flowchart LR
  subgraph SHARED["SHARED ENGINE — one codebase"]
    SHELL["Shell\nsticky header/footer"]
    FEED["Feed runtime\nvertical snap"]
    TV["TV runtime\nplayer + scheduler"]
    SCORE["Feed scorer\nranking + diversity"]
    AUTH["Auth / saved / history"]
    ADS["Monetisation adapters"]
    EVENTS["Analytics event contract"]
    QA["Validation · build · e2e"]
  end

  subgraph CONFIG["CHANNEL MANIFESTS — configuration"]
    C1["scroller\nmixed sources\nserendipity ↑"]
    C2["wikai\nknowledge sources\ncontinuity ↑"]
    C3["mediai\nmedia sources\nplayability ↑"]
    CN["future channel\nnew config + data"]
  end

  C1 --> SHARED
  C2 --> SHARED
  C3 --> SHARED
  CN --> SHARED

  SHARED --> D1["scroller.tv"]
  SHARED --> D2["wikai.tv"]
  SHARED --> D3["mediai.tv"]
  SHARED --> DN["channel N"]
```

**Hard boundary:** domain/topic differences must not create permanent shell/feed/TV forks.

---

## 2. Rebuild-from-spec contract

```mermaid
flowchart LR
  SPEC["MSSCROLL Master Spec"]
  MANIFEST["Channel Manifest"]
  ENGINE["Shared Engine Code"]
  ITEMS["Canonical Items / Data Access"]
  ASSETS["Reusable Asset References"]
  ENV["Environment / provider config"]
  BUILD["Rebuild"]
  VALIDATE["Validate + build + e2e"]
  CHANNEL["Reproducible Channel"]
  DRIFT["Undocumented production tweak"]

  SPEC --> BUILD
  MANIFEST --> BUILD
  ENGINE --> BUILD
  ITEMS --> BUILD
  ASSETS --> BUILD
  ENV --> BUILD
  BUILD --> VALIDATE
  VALIDATE -->|green| CHANNEL
  VALIDATE -->|fail| SPEC
  DRIFT -->|must be pulled back into| SPEC
```

Acceptance requires functional parity, not merely a successful compile.

---

## 3. Request/runtime resolution

```mermaid
sequenceDiagram
  participant U as Viewer
  participant E as Edge / Next.js
  participant R as Channel Resolver
  participant M as Manifest
  participant A as Source Adapter
  participant G as Feed/TV Engine
  participant D as Data / Assets
  participant T as Telemetry

  U->>E: GET scroller.tv / wikai.tv / mediai.tv
  E->>R: hostname + route + auth state
  R->>M: load channel manifest
  M-->>R: source adapter + theme + weights + flags
  R->>A: request eligible candidates
  A->>D: fetch canonical items + asset refs
  D-->>A: items + provenance + media state
  A-->>G: normalized candidates
  G->>G: eligibility → score → diversity → mode
  G-->>U: Scroll feed or TV programme
  U-->>T: impression / dwell / completion / save / click
  T-->>G: aggregate ranking signals
```

A domain resolves configuration; it does not select a separate application fork.

---

## 4. Canonical content/data graph

```mermaid
erDiagram
  SPEC ||--o{ BACKLOG : drives
  SPEC ||--o{ CHANNEL : configures
  CHANNEL ||--o{ ITEM : serves
  ITEM ||--o{ ITEM_SOURCE : provenance
  ITEM ||--o{ ASSET : references
  ITEM ||--o{ RANKING : ranked_in
  ITEM ||--o{ SCHEDULE_SLOT : scheduled_in
  ITEM ||--o{ EVENT : generates
  ITEM ||--o{ MONEY_EVENT : monetises
  ASSET ||--o{ MEDIA_STATE : has
  EVENT }o--|| CHANNEL : occurred_on
  MONEY_EVENT }o--|| CHANNEL : attributed_to
  BACKLOG ||--o{ EVIDENCE : closed_by

  SPEC {
    string spec_id PK
  }
  BACKLOG {
    string backlog_id PK
    string spec_id FK
  }
  CHANNEL {
    string channel_id PK
    string domain
  }
  ITEM {
    string item_id PK
    string canonical_entity_id
    string publish_state
  }
  ASSET {
    string asset_id PK
    string type
    string uri
  }
  SCHEDULE_SLOT {
    string pom_id PK
    datetime starts_at
  }
  EVENT {
    string event_id PK
    string event_type
  }
  MONEY_EVENT {
    string money_id PK
    decimal revenue
    decimal cost
  }
  EVIDENCE {
    string evidence_id PK
    string url_or_sha
  }
```

**Rule:** join systems with stable IDs before adding a dedicated graph database.

---

## 5. Content factory — reuse first

```mermaid
flowchart LR
  SOURCES["Sources\nWikipedia · Wikivoyage · Wikimedia\nTMDB · Books · GitHub · YouTube · trends"]
  OWNED["Owned MS26 content\nTrinity · lists · apps · sites"]
  EXISTING["Existing MediaAI / Vault assets"]
  INGEST["1 Ingest"]
  NORMALIZE["2 Normalize + dedupe"]
  PAGE["3 Article / context"]
  LIST["4 Rank / Top 100"]
  IMG["5 Images"]
  AUDIO["6 Audio"]
  VIDEO["7 Video"]
  QA["8 QA + eligibility"]
  PUBLISH["9 Schedule + publish"]
  METRICS["10 Analytics + money"]

  SOURCES --> INGEST
  OWNED --> INGEST
  EXISTING --> INGEST
  INGEST --> NORMALIZE --> PAGE --> LIST
  LIST --> IMG --> AUDIO --> VIDEO --> QA --> PUBLISH --> METRICS
  EXISTING -. "reuse before generation" .-> IMG
  EXISTING -. "reuse before generation" .-> AUDIO
  EXISTING -. "reuse before generation" .-> VIDEO
  QA -->|invalid| NORMALIZE
  METRICS -. "refresh winners" .-> LIST
```

**Cost rule:** Page + List must be useful before expensive media generation.

---

## 6. Feed algorithm v1

```mermaid
flowchart TB
  CAND["Candidate items"]
  ELIG["Eligibility gate\nprovenance · publish · playable · safety"]
  FEATURES["Features"]
  QUALITY["quality"]
  FRESH["freshness"]
  INTEREST["interest"]
  NOVELTY["novelty"]
  DIVERSITY["source/topic diversity"]
  ENGAGE["completion / dwell / saves"]
  SERENDIP["controlled serendipity"]
  SCORE["Explainable weighted score"]
  CAPS["Hard repetition / clustering caps"]
  FEED["Ordered feed"]
  EVENTS["Viewer events"]
  AGG["Aggregates / cohorts"]
  HUMAN["Human editorial signal"]

  CAND --> ELIG
  ELIG --> FEATURES
  QUALITY --> SCORE
  FRESH --> SCORE
  INTEREST --> SCORE
  NOVELTY --> SCORE
  DIVERSITY --> SCORE
  ENGAGE --> SCORE
  SERENDIP --> SCORE
  FEATURES --> QUALITY
  FEATURES --> FRESH
  FEATURES --> INTEREST
  FEATURES --> NOVELTY
  FEATURES --> DIVERSITY
  FEATURES --> ENGAGE
  FEATURES --> SERENDIP
  SCORE --> CAPS --> FEED --> EVENTS --> AGG
  AGG -. "measured feedback" .-> ENGAGE
  AGG -. "interest" .-> INTEREST
  HUMAN -. "taste / priority" .-> SCORE
```

Channel manifests alter weights, not the scoring architecture.

---

## 7. Scroll ↔ TV state model

```mermaid
stateDiagram-v2
  [*] --> Scroll
  Scroll --> Detail: open item
  Detail --> Scroll: close
  Scroll --> TV: switch mode
  TV --> Scroll: switch mode
  TV --> TV: auto-advance next programme
  Scroll --> Scroll: swipe next/previous
  Scroll --> Saved: save
  TV --> Saved: save
  Saved --> Scroll: resume item
  Saved --> TV: watch item

  note right of Scroll
    canonical item_id retained
    rank/feed context retained
  end note

  note right of TV
    same item_id
    programme/POM context added
  end note
```

Mode changes must not manufacture a second identity for the same content item.

---

## 8. 24-hour TV programming

```mermaid
flowchart LR
  CATALOGUE["Eligible catalogue\n24K+ stretch inventory"]
  RULES["Programming rules\nchannel · quality · freshness · repetition"]
  CAL["TV 2026\n21,900 POM slots/year"]
  DAY["1 day\n60 × 24 min = 24h"]
  NOW["Current time"]
  LIVE["Live / Schedule"]
  PLAYER["TV player"]
  NEXT["Next POM"]

  CATALOGUE --> RULES --> CAL --> DAY
  NOW --> LIVE
  DAY --> LIVE --> PLAYER --> NEXT
  NEXT --> PLAYER
```

```text
00:00–00:24  POM 01
00:24–00:48  POM 02
...
23:36–00:00  POM 60
```

The catalogue can be larger than the linear schedule to allow rotation, replacement and QA failures.

---

## 9. ABC / agent ownership

```mermaid
flowchart TB
  MAT["Mat\nintent · final human taste"]
  SKAI["Skai"]
  ABC["ABC\nportfolio orchestrator"]
  AI26["AI26\nsource of truth"]

  subgraph MSS["MSSCROLL COLLECTION"]
    SCROLLAI["ScrollAI\nproduct · feed · TV · publish"]
    APPAI["AppAI\nshared runtime engineering"]
    BOAI["BOAI\nprivate controls"]
    WIKAI["WIKAI\nknowledge adapters"]
    MEDIAI["MediaAI\nasset factory"]
    LISTAI["ListAI\nranked/list logic"]
    VAULTAI["VaultAI\nIDs · context · provenance"]
    COSTAI["CostAI\ncost + profitability"]
  end

  MAT <--> SKAI
  SKAI <--> ABC
  ABC <--> AI26
  ABC --> SCROLLAI
  SCROLLAI --> APPAI
  SCROLLAI --> BOAI
  SCROLLAI --> WIKAI
  SCROLLAI --> MEDIAI
  SCROLLAI --> LISTAI
  SCROLLAI --> VAULTAI
  SCROLLAI --> COSTAI
  APPAI -. evidence .-> AI26
  BOAI -. status .-> AI26
  WIKAI -. evidence .-> AI26
  MEDIAI -. evidence .-> AI26
  COSTAI -. cost/profit .-> AI26
```

ABC orchestrates; specialist agents own their bounded capabilities.

---

## 10. Monetisation / 1G feedback loop

```mermaid
flowchart LR
  CONTENT["Useful content"]
  TRAFFIC["Traffic\nsearch · direct · social"]
  ENGAGE["Engagement\ndepth · completion · repeat"]
  ADS["AdSense\neligible anonymous inventory"]
  AFF["Affiliates\nAmazon · travel · contextual"]
  DIRECT["Later\nsponsors · offers · membership"]
  REV["Gross revenue"]
  COST["CostAI\nhosting · generation · provider"]
  NET["Net contribution"]
  SCORE["Winner score"]
  SCALE["Top 100 → 1K → 10K"]
  ABC["ABC priorities"]

  CONTENT --> TRAFFIC --> ENGAGE
  ENGAGE --> ADS --> REV
  ENGAGE --> AFF --> REV
  ENGAGE --> DIRECT --> REV
  REV --> NET
  COST --> NET
  NET --> SCORE --> SCALE --> CONTENT
  SCORE --> ABC --> CONTENT
```

**1G:** `$100/day gross` is a target, never an assumed result. Missing telemetry remains unknown, not zero.

---

## 11. Deployment circuit breaker

```mermaid
flowchart TB
  CHANGE{"What changed?"}
  DATA["Data / pack / ranking / schedule / asset refs"]
  CODE["Shared runtime / route / component / adapter code"]
  VALIDATE["Schema + pack validation"]
  PUBLISH["Publish through existing runtime"]
  TEST["Build + tests + e2e"]
  DEPLOY["One controlled production deploy"]
  VERIFY["HTTP + functional verification"]
  BLOCK["Block / fix"]

  CHANGE -->|data only| DATA --> VALIDATE
  VALIDATE -->|green| PUBLISH
  VALIDATE -->|fail| BLOCK

  CHANGE -->|shared code| CODE --> TEST
  TEST -->|green| DEPLOY --> VERIFY
  TEST -->|fail| BLOCK
  VERIFY -->|fail| BLOCK
```

No per-item redeploys. No per-topic app forks.

---

## 12. Current → target migration

```mermaid
flowchart LR
  subgraph NOW["CURRENT — live specialist codebases"]
    S0["Scroller repo\nshell + mixed feed"]
    W0["WIKAI repo\nknowledge UI + services"]
    M0["MediaAI repo\nmedia UI + factory"]
  end

  CONTRACT["Shared contracts\nmanifest · item · routes · events"]
  ENGINE["Shared MS Scroll Engine\nflexappdev/scroller"]
  WA["WIKAI adapter"]
  MA["MediaAI adapter"]
  SA["Mixed discovery adapter"]
  PARITY["Three-domain parity gate\nshell · scroll · TV · auth · money · metrics"]
  RETIRE["Retire duplicated UI/runtime only"]
  KEEP["Keep specialist services where useful"]

  S0 --> CONTRACT
  W0 --> CONTRACT
  M0 --> CONTRACT
  CONTRACT --> ENGINE
  S0 --> SA --> ENGINE
  W0 --> WA --> ENGINE
  M0 --> MA --> ENGINE
  ENGINE --> PARITY
  PARITY -->|green| RETIRE
  W0 --> KEEP
  M0 --> KEEP
```

Migration is adapter-first, not a freeze-and-rewrite programme.

---

## 13. Spec → backlog → evidence sync

```mermaid
flowchart LR
  IDEA["Walk-and-talk / DJ / product decision"]
  SPEC["AI26 SPEC / MS SCROLL\nMSSCROLL"]
  BACKLOG["AI26 BACKLOG\nMSS-* IDs"]
  DOCS["GitHub docs / diagrams"]
  CODE["Code / config / data"]
  TEST["Validation / tests"]
  LIVE["Live verification"]
  EVIDENCE["Commit · URL · metric · source proof"]
  DONE["BACKLOG DONE"]

  IDEA --> SPEC --> BACKLOG
  SPEC --> DOCS
  BACKLOG --> CODE --> TEST --> LIVE --> EVIDENCE --> DONE
  EVIDENCE --> BACKLOG
  CODE -. architecture change .-> DOCS
  DOCS -. spec drift found .-> SPEC
```

A task is DONE only when evidence returns to the source-of-truth backlog.

---

## 14. Mobile product anatomy

```mermaid
flowchart TB
  HEADER["Sticky Header\nchannel · mode · context"]
  CARD["Full-height active card\nimage/video + title + context"]
  RAIL["Action rail\nlike/save/share/open"]
  SWIPE["Vertical swipe\nprevious / next"]
  MODE["Scroll ↔ TV"]
  FOOTER["Sticky Footer\nHome · Explore · Gen · Saved · Me"]
  DETAIL["Detail / article sheet"]

  HEADER --> CARD
  CARD --> RAIL
  CARD --> SWIPE
  CARD --> MODE
  CARD --> DETAIL
  CARD --> FOOTER
```

Mobile default is Scroll unless a channel manifest explicitly overrides it.

---

## 15. Documentation graph

```mermaid
flowchart TB
  README["README.md\nproject entry point"]
  DOCS["docs/README.md\ndocument index"]
  SPEC["MS-SCROLL-MASTER-SPEC.md\nwhat/why/contracts"]
  BACKLOG["MS-SCROLL-BACKLOG.md\nwork/evidence"]
  ATLAS["MS-SCROLL-ABC-DIAGRAMS.md\nvisual architecture"]
  ULT["SCROLLAI-ULTIMATE-DIAGRAM.md\nportfolio/1G view"]
  SKILL["skills/abc-diagrams/SKILL.md\ndiagram standard"]
  CODE["runtime/config/tests"]

  README --> DOCS
  DOCS --> SPEC
  DOCS --> BACKLOG
  DOCS --> ATLAS
  DOCS --> ULT
  SKILL --> ATLAS
  SPEC --> BACKLOG
  SPEC --> ATLAS
  BACKLOG --> CODE
  ATLAS --> CODE
```

---

# Maintenance contract

When an architecture decision changes:

1. update AI26 (`MSSCROLL` and affected `MSS-*` rows);
2. update `MS-SCROLL-MASTER-SPEC.md`;
3. update the relevant diagrams in this atlas;
4. update `MS-SCROLL-BACKLOG.md` dependencies/acceptance criteria;
5. change code/config/data;
6. validate/test/live-check;
7. attach evidence back to AI26;
8. only then mark DONE.

The diagrams are part of the implementation contract, not a post-hoc illustration.
