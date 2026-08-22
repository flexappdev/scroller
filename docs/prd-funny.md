# Funny 100

## Overview

`/funny` is an original, shareable Top 100 collection of universal everyday comedy. The same structured item is rendered as copy, an editorial diagram, a lightweight image card, or a playable 24-second video concept.

## User stories

- As a visitor, I can browse all 100 ranked items without an account.
- As a creator, I can switch format and reuse an idea as copy, a diagram, an image concept, or a short-video storyboard.
- As a visitor, I can search, filter, copy, and share the collection.

## Requirements

### Must have

- Exactly 100 original ranked items.
- Copy, Diagram, Image, and Video modes.
- Search and category filtering.
- Responsive navigation entry and SEO metadata.
- Accessible controls and empty state.

### Nice to have

- Persisted favourites and reactions.
- Generated per-item hero artwork and rendered MP4 shorts.
- Analytics for format use, copies, plays, and shares.

## Data model

Each `FunnyThing` stores rank, title, copy, category, emoji, setup, turn, and punchline. All views derive from this single source.

## UI/UX

The hero establishes an editorial comedy identity. A sticky toolbar holds the four modes, search, category filter, and share action. Results use responsive grids with a clear rank on every card.

## API

No API is required for V1; the list is statically rendered and indexable.

## Dependencies

Next.js, React, Lucide icons, and the existing Scroller shell.

## Status

Implemented.
