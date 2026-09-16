# Gmail IDEAS → Scroller knowledge feed

## Goal

Turn every message under the Gmail `IDEAS/*` tree into one canonical Scroller knowledge item without copying private mailbox content into the public repository.

The mailbox remains the source archive. A dedicated Gmail label, `SCROLLER/IDEAS`, is the processing/feed-source marker.

```text
Gmail IDEAS/*
    ↓
SCROLLER/IDEAS source label
    ↓
Normalize one email → one knowledge item
    ↓
Content + prompt bundle
    ↓
Private Scroller / Vault cache
    ↓
optional human approval
    ↓
public Scroller / WIKAI / MediaAI
```

## Privacy boundary

`flexappdev/scroller` is public. Never commit raw Gmail bodies, private Gmail links, recipient addresses, private attachments, authentication data, or a private generated feed to this repository.

Public git stores only the schema, transformation rules and reusable code. Actual Gmail-derived items remain private until explicitly approved for publication.

## Source discovery

Do not hard-code the current child-label list. At sync time:

1. enumerate Gmail labels;
2. select every child label whose name starts with `IDEAS/`;
3. exclude `SCROLLER/IDEAS` because it is a feed marker, not an IDEAS child source;
4. select all non-Trash messages carrying any source child label;
5. add `SCROLLER/IDEAS` to every selected message.

This makes future `IDEAS/*` labels join the pipeline automatically.

## Identity contract

Default rule: **one Gmail message = one source knowledge item**.

Primary identity:

```text
item_id = gmail:<gmail_message_id>
```

Keep these provenance fields privately:

```json
{
  "gmail_message_id": "...",
  "gmail_thread_id": "...",
  "source_label": "IDEAS/<child>",
  "source_sender": "...",
  "source_subject": "...",
  "source_received_at": "ISO-8601",
  "source_url": "private Gmail URL",
  "source_fingerprint": "normalized-content hash"
}
```

`gmail_message_id` is authoritative. `source_fingerprint` is used only to flag probable duplicates such as the same newsletter delivered to two aliases. Never collapse messages solely because they share a subject.

## Knowledge item contract

Each normalized item must expose this derived structure to the private Scroller feed:

```json
{
  "id": "gmail:<message-id>",
  "title": "Clear editorial title",
  "tagline": "One-line why-this-matters hook",
  "overview": "Concise self-contained explanation of the useful idea",
  "next_steps": [
    "Concrete action 1",
    "Concrete action 2",
    "Concrete action 3"
  ],
  "tags": ["topic", "source-family", "format"],
  "prompts": {
    "image": "...",
    "video": "...",
    "audio": "...",
    "diagram": "..."
  },
  "provenance": {
    "source_type": "gmail",
    "gmail_message_id": "...",
    "source_label": "IDEAS/<child>",
    "received_at": "..."
  },
  "state": {
    "normalized": true,
    "publish_state": "private",
    "media_state": "prompted"
  }
}
```

### Content rules

- **Title** — specific, useful and understandable out of context; do not blindly preserve newsletter clickbait.
- **Tagline** — 8–18 words; capture the reason to care.
- **Overview** — normally 80–180 words; explain the idea rather than merely summarising the email wrapper.
- **Next steps** — 1–5 concrete actions: verify, learn, test, build, visit, save, compare, or publish depending on the source.
- **Tags** — controlled topical tags plus the source family. Avoid tag spam.
- Preserve attribution/provenance privately even when the derived public wording is rewritten.
- Do not invent facts that are absent from the source. Current claims should be verified before public publication when material.

## Prompt bundle

Every item gets prompts immediately; generated media is a later stage.

### Image prompt

```text
Create exactly ONE standalone premium cinematic landscape 16:9 image for: {{title}}.
Visual thesis: {{tagline}}.
Communicate the core idea from this overview: {{overview}}.
Use one dominant hero subject/action, a clean simple composition, cinematic depth and lighting, and no collage/grid/montage.
Maximum five short explanatory labels only when labels materially improve understanding.
Make it suitable as the opening knowledge card in Scroller/WIKAI.
```

### Video prompt

```text
Create one 24-second vertical 9:16 knowledge video for: {{title}}.
Hook in the first 2 seconds using: {{tagline}}.
Explain the single core idea from: {{overview}}.
Use 4–6 coherent shots, one visual thesis, restrained on-screen text, clear motion, and a final practical takeaway based on {{next_steps}}.
No collage aesthetic, no unrelated stock montage, no invented factual claims.
```

### Audio prompt

```text
Write and voice one concise 24-second narration for: {{title}}.
Open with a sharp natural hook, explain the useful idea in plain English, and end with the strongest practical next step.
Target roughly 55–70 spoken words. No hype, filler or unsupported claims.
Source context: {{overview}}.
```

### Diagram prompt

```text
Create exactly ONE clean MS/ABC-style 16:9 explanatory diagram for: {{title}}.
Use the overview as the factual basis: {{overview}}.
Prefer one left-to-right or top-to-bottom causal/system flow with 3–7 primary nodes, clear hierarchy, short labels, arrows that explain relationships, generous spacing and a dark premium technical aesthetic.
Add a small 'NEXT' area containing the most important action from {{next_steps}}.
Do not create a generic mind map or crowded poster.
```

## Source-family normalization

Use the same item schema but adapt the editorial lens:

- **Events / listings** — extract who/what/when/why, practical attendance value, date sensitivity and booking/visit next step.
- **Google Alerts / news digests** — identify the strongest underlying knowledge point in the message, keep the email as the single source item, and preserve links for later verification. Do not present a digest wrapper as the idea.
- **Books / learning newsletters** — extract the transferable concept, its practical interpretation and one experiment or exercise.
- **Business-idea newsletters** — distinguish observed evidence from the newsletter author's speculation; capture the business model, user problem, wedge and a smallest test.
- **Podcast / creator newsletters** — capture the central lesson or episode thesis; keep quotes minimal and use original wording only where needed.

## Feed behaviour

Private `/scroller` view should render, in order:

1. title;
2. tagline;
3. overview;
4. next steps;
5. tags;
6. media prompt tabs: Image · Video · Audio · Diagram;
7. source/provenance controls;
8. Save / Generate / Publish actions.

Sort modes:

- Latest;
- Random;
- Source label;
- Topic;
- Saved;
- Published;
- Needs verification.

`SCROLLER/IDEAS` is a source label, not a public publication flag.

## Read-state semantics

Gmail read/unread is a processing convenience, not canonical data.

A source message may be marked read only after it has been included in `SCROLLER/IDEAS` and is therefore recoverable by the feed sync. Marking read must never remove the original `IDEAS/*` labels or the `SCROLLER/IDEAS` source label.

For future incremental syncs:

```text
new IDEAS/* mail
→ add SCROLLER/IDEAS
→ normalize/cache private item
→ mark source mail read
```

Failures remain unread so they are naturally retryable.

## Commands

Recommended ScrollAI commands:

```text
/scrollai ideas
/scrollai ideas sync
/scrollai ideas status
/scrollai ideas random
/scrollai ideas <source-label>
/scrollai ideas publish <item-id>
```

Semantics:

- `/scrollai ideas` — open the private mixed feed.
- `sync` — discover all `IDEAS/*` labels, add missing messages to `SCROLLER/IDEAS`, normalize new source messages, then mark only successful source messages read.
- `status` — source-label counts, feed-source count, unprocessed count, probable duplicates, private/public counts, media gaps.
- `random` — serendipity mode across the whole private knowledge pool.
- `<source-label>` — filter to one IDEAS source family.
- `publish` — explicit promotion gate; never publish Gmail-derived content by default.

## Definition of done

- every existing message in every current `IDEAS/*` child label is included in `SCROLLER/IDEAS`;
- future child labels are discovered automatically;
- one source email has one stable Gmail-derived item id;
- every normalized item has title, tagline, overview, next steps and tags;
- every normalized item has image, video, audio and diagram prompts;
- raw private Gmail content is absent from public git/client bundles;
- public publication is explicit, never automatic;
- source emails are marked read only after successful source ingestion;
- `IDEAS/*` and `SCROLLER/IDEAS` labels remain intact so the full source set can always be rebuilt.
