# Scroller

Reusable FAD scroller engine for loading, randomising, inspecting, importing, and exporting JSON-driven feed specs.

## Product

Scroller starts with 100 built-in source items and renders them immediately as a randomised feed. The same UI can load custom JSON specs from a file or paste modal, then export the whole spec or a single item.

## UX

- Click any card to open the detail modal.
- Infinite scroll appends more random cards from the active source set.
- Import accepts a raw array or `{ "items": [...] }`, `{ "sourceItems": [...] }`, or `{ "data": [...] }`.
- Import normalisation accepts flexible field names for title, type, hook, description, tags, and metrics.

## Tech

React 18, TypeScript, Vite, CSS, and lucide-react. No backend is required.

## Flow

```bash
cd ~/APPS/mstravel/scroller
npm install
npm run dev
```

## Prod

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 19012
```
