"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Home,
  Radio,
  Rows3,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  BROADCAST_RESET_HOUR,
  POM_MINUTES,
  POMS_PER_DAY,
  SCENE_SECONDS,
  SCENES_PER_POM,
  buildPomSchedule,
  currentBroadcastStart,
  formatBroadcastDate,
  formatClock,
  getLivePosition,
  itemForSlot,
  localDateKey,
  type ChannelProfile,
  type PomScheduleEntry,
  type RuntimeItem,
} from "@/lib/ms-scroll-runtime";

const FALLBACKS = [
  "from-fuchsia-500 via-pink-700 to-zinc-950",
  "from-cyan-500 via-blue-800 to-zinc-950",
  "from-amber-400 via-orange-700 to-zinc-950",
  "from-violet-500 via-indigo-800 to-zinc-950",
  "from-emerald-400 via-teal-800 to-zinc-950",
];

function dateAtNoon(date: Date) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  return copy;
}

function shiftDate(date: Date, days: number) {
  const copy = dateAtNoon(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function TVMedia({ item, index, muted }: { item: RuntimeItem; index: number; muted: boolean }) {
  if (item.video) {
    return (
      <video
        key={item.video}
        src={item.video}
        poster={item.image}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="auto"
      />
    );
  }

  if (item.image) {
    const safe = item.image.replaceAll('"', "%22");
    return <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${safe}")` }} />;
  }

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${FALLBACKS[index % FALLBACKS.length]}`}>
      <div
        className="absolute inset-0 opacity-[0.11]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[18vw] font-black tracking-[-0.08em] text-white/[0.055]">TV</span>
      </div>
    </div>
  );
}

function GuideRows({
  schedule,
  now,
  isLiveDay,
  accent,
}: {
  schedule: PomScheduleEntry[];
  now: Date;
  isLiveDay: boolean;
  accent: string;
}) {
  const live = getLivePosition(now);

  return (
    <div className="divide-y divide-white/[0.07]">
      {schedule.map((entry, index) => {
        const current = isLiveDay && index === live.pomIndex;
        return (
          <div
            key={`${entry.pom}-${entry.start.toISOString()}`}
            className={`grid grid-cols-[58px_1fr_42px] gap-3 px-4 py-3 ${current ? "bg-white/[0.07]" : "hover:bg-white/[0.035]"}`}
          >
            <div>
              <p className="text-xs font-semibold" style={{ color: current ? accent : "rgba(255,255,255,.75)" }}>
                {formatClock(entry.start)}
              </p>
              <p className="mt-1 text-[9px] text-white/30">24 min</p>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {current ? <Radio className="h-3 w-3 shrink-0" style={{ color: accent }} /> : null}
                <p className="truncate text-[9px] uppercase tracking-[0.14em] text-white/35">{entry.anchor.packName}</p>
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-medium leading-tight text-white/85">{entry.anchor.title}</p>
            </div>
            <div className="text-right text-[10px] text-white/25">P{String(entry.pom).padStart(2, "0")}</div>
          </div>
        );
      })}
    </div>
  );
}

function Guide({
  items,
  channel,
  now,
  date,
  setDate,
  mobile = false,
  onClose,
}: {
  items: RuntimeItem[];
  channel: ChannelProfile;
  now: Date;
  date: Date;
  setDate: (date: Date) => void;
  mobile?: boolean;
  onClose?: () => void;
}) {
  const schedule = useMemo(() => buildPomSchedule(items, channel, date), [items, channel, date]);
  const liveBroadcast = currentBroadcastStart(now);
  const isLiveDay = localDateKey(liveBroadcast) === localDateKey(date);

  return (
    <aside className={`${mobile ? "fixed inset-0 z-[130]" : "relative h-[100dvh] w-[380px] shrink-0"} flex flex-col border-l border-white/10 bg-zinc-950 text-white`}>
      <div className="border-b border-white/10 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">{channel.name} TV Guide</p>
            <p className="mt-1 text-sm font-semibold">{formatBroadcastDate(date)}</p>
          </div>
          {mobile && onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close guide"
              className="rounded-full border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDate(shiftDate(date, -1))}
            aria-label="Previous day"
            className="rounded-full border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDate(dateAtNoon(liveBroadcast))}
            className="flex-1 rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              borderColor: isLiveDay ? channel.accent : "rgba(255,255,255,.12)",
              backgroundColor: isLiveDay ? channel.accent : "transparent",
              color: isLiveDay ? "#000" : "rgba(255,255,255,.65)",
            }}
          >
            {isLiveDay ? "Live day" : "Jump to live"}
          </button>
          <button
            type="button"
            onClick={() => setDate(shiftDate(date, 1))}
            aria-label="Next day"
            className="rounded-full border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <GuideRows schedule={schedule} now={now} isLiveDay={isLiveDay} accent={channel.accent} />
      </div>

      <div className="border-t border-white/10 px-4 py-3 text-[9px] leading-4 text-white/30">
        {POMS_PER_DAY} × {POM_MINUTES}-minute POMs · {SCENES_PER_POM} × {SCENE_SECONDS}s scenes/POM · reset {String(BROADCAST_RESET_HOUR).padStart(2, "0")}:00 local
      </div>
    </aside>
  );
}

export default function ChannelTV({ items, channel }: { items: RuntimeItem[]; channel: ChannelProfile }) {
  const [now, setNow] = useState<Date | null>(null);
  const [guideDate, setGuideDate] = useState<Date | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const first = new Date();
    setNow(first);
    setGuideDate(dateAtNoon(currentBroadcastStart(first)));
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!items.length) {
    return (
      <main className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 p-6 text-center text-white">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">{channel.name} TV</p>
          <h1 className="mt-3 text-4xl font-semibold">No broadcast items yet.</h1>
          <Link href="/scroller" className="mt-6 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm text-white/70">Open Scroller</Link>
        </div>
      </main>
    );
  }

  if (!now || !guideDate) {
    return (
      <main className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">{channel.name} TV</p>
          <p className="mt-2 text-3xl font-semibold">Tuning live channel…</p>
        </div>
      </main>
    );
  }

  const live = getLivePosition(now);
  const current = itemForSlot(items, channel, live.broadcastStart, live.pomIndex, live.sceneIndex);
  const nextBoundary = new Date(now.getTime() + (SCENE_SECONDS - live.secondsIntoScene) * 1000);
  const nextPosition = getLivePosition(nextBoundary);
  const next = itemForSlot(items, channel, nextPosition.broadcastStart, nextPosition.pomIndex, nextPosition.sceneIndex);

  if (!current) return null;

  const linearIndex = live.pomIndex * SCENES_PER_POM + live.sceneIndex;

  return (
    <div className="fixed inset-0 z-[100] flex overflow-hidden bg-black text-white">
      <main className="relative min-w-0 flex-1 overflow-hidden">
        <TVMedia item={current} index={linearIndex} muted={muted} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-black/45" />

        <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-3 md:p-5">
          <div className="flex gap-2">
            <Link href="/" className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-xs font-medium backdrop-blur-xl">
              <Home className="h-3.5 w-3.5" /> {channel.name}
            </Link>
            <Link href="/scroller" className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-xs font-medium backdrop-blur-xl">
              <Rows3 className="h-3.5 w-3.5" /> Scroller
            </Link>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMuted((value) => !value)}
              aria-label={muted ? "Unmute" : "Mute"}
              className="rounded-full border border-white/15 bg-black/40 p-2.5 text-white/70 backdrop-blur-xl hover:text-white"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-xs font-medium backdrop-blur-xl lg:hidden"
            >
              <CalendarDays className="h-3.5 w-3.5" /> Guide
            </button>
          </div>
        </header>

        <div className="absolute left-4 top-20 z-10 flex items-center gap-2 md:left-6 md:top-24">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-black shadow-lg" style={{ backgroundColor: channel.accent }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" /> Live
          </span>
          <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/65 backdrop-blur">
            POM {String(live.pomIndex + 1).padStart(2, "0")} / {POMS_PER_DAY}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 p-5 pb-8 md:p-9 md:pb-10">
          <div className="max-w-4xl">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
              {current.packName} · scene {String(live.sceneIndex + 1).padStart(2, "0")}/{SCENES_PER_POM}
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-[0.94] tracking-[-0.04em] md:text-7xl">{current.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 md:text-lg">{current.hook || current.content}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] text-white/45">
              <Link href={current.href} className="rounded-full border border-white/20 bg-white/10 px-3 py-2 font-semibold text-white/80 backdrop-blur hover:bg-white hover:text-black">
                Open story
              </Link>
              {next ? <span>Next in {SCENE_SECONDS - live.secondsIntoScene}s · {next.title}</span> : null}
            </div>
          </div>

          <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full transition-[width] duration-700 ease-linear" style={{ width: `${live.pomProgress * 100}%`, backgroundColor: channel.accent }} />
          </div>
          <div className="mt-2 flex justify-between text-[9px] uppercase tracking-[0.12em] text-white/30">
            <span>{formatClock(new Date(live.broadcastStart.getTime() + live.pomIndex * POM_MINUTES * 60_000))}</span>
            <span>{Math.floor(live.secondsIntoPom / 60)}:{String(live.secondsIntoPom % 60).padStart(2, "0")} / {POM_MINUTES}:00</span>
          </div>
        </div>
      </main>

      <div className="hidden lg:block">
        <Guide items={items} channel={channel} now={now} date={guideDate} setDate={setGuideDate} />
      </div>

      {guideOpen ? (
        <Guide items={items} channel={channel} now={now} date={guideDate} setDate={setGuideDate} mobile onClose={() => setGuideOpen(false)} />
      ) : null}
    </div>
  );
}
