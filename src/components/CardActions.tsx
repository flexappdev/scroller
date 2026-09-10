"use client";

import { Heart, Bookmark } from "lucide-react";
import { useLikesSaves } from "@/lib/likes-saves";

export default function CardActions({
  id,
  className,
  size = 20,
  onOpenDetails,
  vertical = false,
}: {
  id: string;
  className?: string;
  size?: number;
  onOpenDetails?: () => void;
  vertical?: boolean;
}) {
  const { isLiked, isSaved, toggleLike, toggleSave, hydrated } = useLikesSaves();
  if (!hydrated) return null;

  const liked = isLiked(id);
  const saved = isSaved(id);

  const stop = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); };

  return (
    <div className={`flex ${vertical ? "flex-col" : "items-center"} gap-2 ${className ?? ""}`}>
      <button
        type="button"
        onClick={(e) => { stop(e); toggleLike(id); }}
        aria-label={liked ? "Unlike" : "Like"}
        title={liked ? "Unlike" : "Like"}
        className={`rounded-full p-2 border transition-colors backdrop-blur-md ${
          liked
            ? "bg-rose-600/90 border-rose-400 text-white"
            : "bg-black/50 border-white/20 text-white hover:bg-black/70"
        }`}
      >
        <Heart size={size} fill={liked ? "currentColor" : "none"} />
      </button>
      <button
        type="button"
        onClick={(e) => { stop(e); toggleSave(id); }}
        aria-label={saved ? "Unsave" : "Save (favorite)"}
        title={saved ? "Unsave" : "Save (favorite)"}
        className={`rounded-full p-2 border transition-colors backdrop-blur-md ${
          saved
            ? "bg-amber-500/90 border-amber-300 text-white"
            : "bg-black/50 border-white/20 text-white hover:bg-black/70"
        }`}
      >
        <Bookmark size={size} fill={saved ? "currentColor" : "none"} />
      </button>
      {onOpenDetails && (
        <button
          type="button"
          onClick={(e) => { stop(e); onOpenDetails(); }}
          className="rounded-full px-3 py-2 text-xs border border-white/20 bg-black/50 text-white hover:bg-black/70 backdrop-blur-md"
        >
          Details
        </button>
      )}
    </div>
  );
}
