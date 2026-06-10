import type { ScrollSourceId } from "@/lib/scroll/sources";

const S3_BASE = "https://com27.s3.eu-west-2.amazonaws.com/scroller/video-loops";

// Sources for which a Seedance video loop has been generated and uploaded.
// Anything not in this set falls back to the static gradient header.
const SOURCES_WITH_VIDEO: Record<string, true> = {
  scroller: true, wiki: true, wikivoyage: true, amazon: true, videos: true,
  github: true, prompts: true, sites: true, apps: true, images: true,
};

type Props = {
  source: ScrollSourceId | "scroller";
  accent: string;
  label: string;
  title: string;
  subtitle?: string;
  /** items count etc, shown in the bottom-right */
  rightChip?: string;
};

/**
 * Hero banner with an autoplaying muted video loop background.
 * Looped Seedance MP4s live at s3://com27/scroller/video-loops/<source>.mp4.
 * Falls back to a flat dark panel when the source has no loop generated.
 */
export default function SourceHero({ source, accent, label, title, subtitle, rightChip }: Props) {
  const hasVideo = SOURCES_WITH_VIDEO[source] === true;
  const videoUrl = hasVideo ? `${S3_BASE}/${source}.mp4` : null;

  return (
    <header
      className="relative overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      {videoUrl && (
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />

      <div className="relative px-6 py-8 sm:py-10 space-y-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: accent }} />
          {label}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">{title}</h1>
        {subtitle && <p className="max-w-2xl text-sm text-zinc-400">{subtitle}</p>}
        {rightChip && (
          <span className="absolute bottom-4 right-4 rounded-md border border-zinc-800 bg-zinc-950/80 px-2 py-1 text-[10px] font-mono text-zinc-500 backdrop-blur">
            {rightChip}
          </span>
        )}
      </div>
    </header>
  );
}
