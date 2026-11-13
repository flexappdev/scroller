# Scroller Ltd: agentic-first operating model

Plan: [scroller.tv 7-week plan to 27 Dec](https://claude.ai/artifact/87XuKAEzktzkSTESnX4NP1).

Scroller runs as scheduled agents with budgets and one metric each. Mat sets taste and approves money; nothing else waits on a human.

## Principles

1. Every recurring job is an agent with a written role, a cost cap and one metric.
2. Agents ship through PRs with green CI. Only money, legal and taste wait for Mat.
3. One ledger of truth: `/api/revenue` (scroller#17) plus the usage ledger.
4. Kill rule: an agent that costs more than it earns for 4 weeks is paused.

## Agent roster

| Agent | Job | Cadence | Metric | Runs as | Cost cap |
| --- | --- | --- | --- | --- | --- |
| Editor | Writes kbits and fbits, follows the taste brief | Daily | Cards kept vs skipped in /play | wikai daily-publish workflow | ~$1/day |
| Studio | Renders clips and Shorts from kbits | Daily | Clips published | wikai shorts workflow + GPU box | Free |
| Distributor | YouTube Shorts uploads, share links, sitemaps | Daily | External sessions | wikai shorts-publish workflow | Free |
| Growth | SEO pages, Top 100 packs, internal links | Weekly | Organic sessions | Claude routine (paused) | Within Editor cap |
| Revenue | Affiliate and ad slots, CTA tests | Weekly | £ per 1,000 sessions | Claude routine (paused) | Free |
| Treasurer | Reads revenue and usage, flags overspend | Daily | Margin | `/api/revenue` | Free |
| Board secretary | Writes the Sunday board pack | Weekly | Decisions closed | `.github/workflows/board-pack.yml` | Free |

## Mat's three hats

- **Super user:** use [/play](https://scroller.tv/play) instead of TikTok. Skips, "More" and "Never" train the feed.
- **Taste nudge:** [/taste](https://scroller.tv/taste), 20 cards twice a week. Export the JSON and drop it in `data/taste/` so the Editor reads it.
- **Director of the board:** read `docs/board/<date>.md` on Sunday; tick up to 3 decisions. No reply means the default applies.

## Play mechanics (product reference)

| Mechanic | What it does | Event |
| --- | --- | --- |
| Reward mix | ~60% kbits, ~30% fbits, 10% surprises; funny share follows taste | `play_card_view` |
| Gold drop | 1 in 50 kbits is gold and saved to the vault | `play_gold` |
| Duel | Two ranked items, guess the higher; streaks and near-miss messages | `play_duel_answer` |
| Spin | Reel animation, then 5 cards from one random pack | `play_spin` |
| Skip learning | Under 1.2 s is a skip (less of that tag); over 3.5 s counts as learned | `play_skip` |
| More / Never | Strong taste signals; Never hides the card for good | `play_more`, `play_never` |
| Deep-dive drawer | Full text, sources, wikai.tv article, affiliate CTA | `affiliate_click` |
| Session timer | Self-set 10/20/30 min, then a "you learned N things" summary | — |
| Shared duels | `/play?duel=<pack>~<idA>~<idB>` opens that duel first | `play_share` |
