export interface ScrollerTopic {
  slug: string;
  label: string;
  emoji: string;
  accent: string;
  /** Free-text search seed — used by /browse?topic=<slug>&q=<seed>. */
  q?: string;
}

export const SCROLLER_TOPICS: ScrollerTopic[] = [
  { slug: "ai", label: "AI", emoji: "🤖", accent: "#ec4899", q: "artificial intelligence" },
  { slug: "tech", label: "Tech", emoji: "💻", accent: "#22d3ee", q: "technology" },
  { slug: "movies", label: "Movies", emoji: "🎬", accent: "#ef4444", q: "film" },
  { slug: "music", label: "Music", emoji: "🎵", accent: "#a78bfa" },
  { slug: "books", label: "Books", emoji: "📚", accent: "#f59e0b" },
  { slug: "travel", label: "Travel", emoji: "✈️", accent: "#3b82f6" },
  { slug: "food", label: "Food", emoji: "🍜", accent: "#f97316" },
  { slug: "sports", label: "Sports", emoji: "⚽", accent: "#10b981" },
  { slug: "science", label: "Science", emoji: "🔬", accent: "#06b6d4" },
  { slug: "news", label: "News", emoji: "📰", accent: "#e5e7eb" },
  { slug: "art", label: "Art", emoji: "🎨", accent: "#f472b6" },
  { slug: "games", label: "Games", emoji: "🎮", accent: "#8b5cf6" },
  { slug: "history", label: "History", emoji: "🏛️", accent: "#d4a574" },
  { slug: "fashion", label: "Fashion", emoji: "👗", accent: "#ec4899" },
  { slug: "business", label: "Business", emoji: "📈", accent: "#059669" },
  { slug: "space", label: "Space", emoji: "🚀", accent: "#6366f1" },
  { slug: "nature", label: "Nature", emoji: "🌿", accent: "#22c55e" },
  { slug: "cars", label: "Cars", emoji: "🏎️", accent: "#dc2626" },
];

export function topicBySlug(slug: string | undefined | null): ScrollerTopic | null {
  if (!slug) return null;
  return SCROLLER_TOPICS.find((t) => t.slug === slug) ?? null;
}
