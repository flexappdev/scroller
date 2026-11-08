import type { MediaiArticle } from "@/lib/mediai";

export function cardSource(item: MediaiArticle): string {
  if (item.kind === "book") return "book";
  if (item.provider === "chatgpt") return "chatgpt";
  if (item.kind === "wiki") return item.rank ? `#${item.rank.toLocaleString("en-GB")}` : "wikipedia";
  return "mediai";
}

export function cardBadge(item: MediaiArticle): string {
  if (item.book) return `${item.book.title} · Ch ${item.book.chapter}/${item.book.chapters}`;
  if (item.provider === "chatgpt") return "ChatGPT · Archive";
  if (item.kind === "wiki") {
    const rank = item.rank ? ` · #${item.rank.toLocaleString("en-GB")}` : "";
    return `${item.assetCount > 0 ? "Wikipedia · Mediai" : "Wikipedia"}${rank}`;
  }
  return "Wikipedia · Mediai";
}
