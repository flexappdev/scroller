---
name: scrollai-movie
description: Create an original ScrollAI movie from a Scroller/Top100 pack using a supplied video URL only as high-level film-grammar reference. Use for /scrollai movie, reference-video movie generation, TikTok/Reels pacing references, or pack-to-movie compilation.
---

# ScrollAI Movie

Command:

```text
/scrollai movie <reference-url> [--pack <slug>] [--slug <movie-slug>]
```

Default behaviour:

1. Resolve the source Scroller/Top100 pack from the conversation. If none is explicit, use the current active ScrollAI pack rather than inventing a new topic.
2. Hand media execution to MediaAI.
3. Download the reference locally with `yt-dlp` when permitted and available.
4. Analyse only high-level film grammar: orientation, duration, scene-change timing and cut rhythm.
5. Do **not** copy reference frames, dialogue, music, captions, logos, creator identity, or exact shot compositions.
6. Reuse completed MediaAI assets before generating anything new.
7. Build original narration/captions from the verified ScrollAI source data.
8. Repeat/adapt the reference rhythm across the pack while preserving source rank/order unless the user asks for a trailer or subset.
9. Produce an MP4, subtitles and manifest recording reference analysis, source assets, shot durations and output path.

## MediaAI implementation

For the Top 100 AI News 2026 reference-film workflow:

```bash
cd ~/BO/mediai
git pull
bash scripts/scrollai_movie.sh '<reference-url>'
```

Default job currently targets `top-100-ai-news-2026` and can resume/generate missing MediaAI source media before editing.

Output convention:

```text
C:\ABC\MEDIA\MOVIES\<movie-slug>\
  FINAL-<movie-slug>.mp4
  manifest.json
  <movie-slug>.srt
  audio\
  segments\
```

## Reference rule

A reference video is inspiration for abstract film grammar only. Recreate the *idea of the pacing*, not the audiovisual work itself. Preserve no source footage or source audio in the output.

## Cost rule

Reuse existing image/audio/motion/LTX assets first. Generate only missing source-pack media. The movie edit itself should be deterministic/restart-safe and should not call an LLM merely to re-edit existing media.

## Truthfulness

A cinematic render does not upgrade the verification state of a news claim. Narration must not state an unverified item more strongly than its ScrollAI source record.
