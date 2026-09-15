"use client";

import { createElement, useMemo, useRef, useState } from "react";
import { PRODUCT_MODELS } from "./models";

type Studio = "dark" | "light";
type ViewerElement = HTMLElement & {
  cameraOrbit?: string;
  fieldOfView?: string;
  jumpCameraToGoal?: () => void;
};

const PRESETS = [
  { label: "Hero", orbit: "35deg 72deg 105%", fov: "28deg" },
  { label: "Front", orbit: "0deg 78deg 110%", fov: "30deg" },
  { label: "Top", orbit: "25deg 38deg 118%", fov: "32deg" },
  { label: "Macro", orbit: "48deg 76deg 78%", fov: "24deg" },
] as const;

export default function Product3DClient() {
  const [selectedId, setSelectedId] = useState(PRODUCT_MODELS[0].id);
  const [studio, setStudio] = useState<Studio>("dark");
  const [spin, setSpin] = useState(true);
  const viewerRef = useRef<ViewerElement | null>(null);

  const model = useMemo(
    () => PRODUCT_MODELS.find((item) => item.id === selectedId) ?? PRODUCT_MODELS[0],
    [selectedId],
  );

  function camera(orbit: string, fov: string) {
    const el = viewerRef.current;
    if (!el) return;
    el.setAttribute("camera-orbit", orbit);
    el.setAttribute("field-of-view", fov);
    el.jumpCameraToGoal?.();
  }

  const viewer = createElement("model-viewer", {
    key: model.id,
    ref: (node: ViewerElement | null) => { viewerRef.current = node; },
    src: model.src,
    alt: `Interactive 3D proxy model of ${model.name}`,
    "camera-controls": true,
    "touch-action": "pan-y",
    "auto-rotate": spin ? true : undefined,
    "rotation-per-second": "10deg",
    "interaction-prompt": "auto",
    "environment-image": "neutral",
    exposure: studio === "dark" ? "1.15" : "0.95",
    "shadow-intensity": studio === "dark" ? "1.4" : "0.9",
    "shadow-softness": "0.75",
    "camera-orbit": "35deg 72deg 105%",
    "field-of-view": "28deg",
    style: {
      width: "100%",
      height: "min(68vh, 720px)",
      minHeight: "440px",
      display: "block",
      background: studio === "dark"
        ? "radial-gradient(circle at 50% 40%, #252a33 0%, #0b0d12 58%, #050608 100%)"
        : "radial-gradient(circle at 50% 38%, #ffffff 0%, #eef1f5 68%, #e4e8ee 100%)",
      borderRadius: "28px",
    },
  });

  return (
    <main className="mx-auto w-full max-w-[1500px] px-3 pb-24 pt-5 sm:px-6 lg:px-8">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">TTShop 3D Lab</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-4xl">{model.name}</h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--foreground-muted)" }}>{model.hook}</p>
            </div>
            <span className="rounded-full border px-3 py-1 text-xs font-bold" style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}>
              {model.category}
            </span>
          </div>

          <div className="overflow-hidden rounded-[28px] border" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
            {viewer}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {PRESETS.map((preset) => (
              <button key={preset.label} type="button" onClick={() => camera(preset.orbit, preset.fov)} className="h-10 rounded-xl border px-3 text-xs font-bold transition-colors hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border)" }}>
                {preset.label}
              </button>
            ))}
            <button type="button" onClick={() => setSpin((v) => !v)} className="h-10 rounded-xl border px-3 text-xs font-bold transition-colors hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border)" }}>
              {spin ? "Pause rotation" : "Auto rotate"}
            </button>
            <button type="button" onClick={() => setStudio((v) => (v === "dark" ? "light" : "dark"))} className="h-10 rounded-xl border px-3 text-xs font-bold transition-colors hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border)" }}>
              {studio === "dark" ? "White studio" : "Dark studio"}
            </button>
            <a href={model.src} download={model.fileName} className="ml-auto inline-flex h-10 items-center rounded-xl bg-[var(--accent)] px-4 text-xs font-black text-white">
              Download GLB
            </a>
          </div>
        </div>

        <aside className="min-w-0">
          <div className="rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-black uppercase tracking-[0.12em]">Top 10 objects</h2>
              <span className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>{PRODUCT_MODELS.length} models</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {PRODUCT_MODELS.map((item, index) => {
                const active = item.id === model.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className="flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition-colors"
                    style={{
                      borderColor: active ? "var(--accent)" : "var(--border)",
                      background: active ? "color-mix(in oklch, var(--accent) 10%, transparent)" : "transparent",
                    }}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-black" style={{ background: "var(--surface-hover)" }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{item.name}</span>
                      <span className="mt-0.5 block truncate text-[11px]" style={{ color: "var(--foreground-muted)" }}>{item.hook}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border p-4 text-sm leading-6" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
            <p className="font-bold">Apple-style shot recipe</p>
            <p className="mt-1" style={{ color: "var(--foreground-muted)" }}>
              Use Hero or Macro, dark seamless studio, slow 8–12 second orbit, large soft key light, thin rim light, minimal copy and one feature per shot.
            </p>
            <p className="mt-3 text-xs" style={{ color: "var(--foreground-muted)" }}>
              These are lightweight procedural proxy assets for creative production, not manufacturer CAD geometry.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
