"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PRODUCT_MODELS, type Product3DModel } from "./models";

declare global {
  interface Window { THREE?: any; }
}

type Studio = "dark" | "light";
type Pose = { yaw: number; pitch: number; zoom: number };

const PRESETS: Array<{ label: string; pose: Pose }> = [
  { label: "Hero", pose: { yaw: 0.65, pitch: 0.28, zoom: 4.5 } },
  { label: "Front", pose: { yaw: 0, pitch: 0.08, zoom: 4.6 } },
  { label: "Top", pose: { yaw: 0.35, pitch: 1.0, zoom: 4.9 } },
  { label: "Macro", pose: { yaw: 0.86, pitch: 0.18, zoom: 3.4 } },
];

function makeProduct(THREE: any, model: Product3DModel) {
  const root = new THREE.Group();
  const mats = {
    dark: new THREE.MeshStandardMaterial({ color: 0x20242a, metalness: 0.35, roughness: 0.28 }),
    mid: new THREE.MeshStandardMaterial({ color: 0x555b66, metalness: 0.42, roughness: 0.3 }),
    black: new THREE.MeshStandardMaterial({ color: 0x07090c, metalness: 0.2, roughness: 0.2 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf2f3f5, metalness: 0.08, roughness: 0.3 }),
    light: new THREE.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 0.12, roughness: 0.33 }),
    cyan: new THREE.MeshStandardMaterial({ color: 0x35c8ec, emissive: 0x092a35, metalness: 0.12, roughness: 0.18 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x3478ef, emissive: 0x07142d, metalness: 0.12, roughness: 0.16 }),
    silver: new THREE.MeshStandardMaterial({ color: 0xaeb4bf, metalness: 0.72, roughness: 0.23 }),
    aqua: new THREE.MeshStandardMaterial({ color: 0xc7e5e7, metalness: 0.05, roughness: 0.4 }),
  };

  const add = (geometry: any, material: any, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };
  const box = (w: number, h: number, d: number, material: any, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0]) => add(new THREE.BoxGeometry(w, h, d, 4, 4, 4), material, pos, rot);
  const cyl = (r: number, h: number, material: any, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0], seg = 48) => add(new THREE.CylinderGeometry(r, r, h, seg, 1, false), material, pos, rot);
  const sph = (r: number, material: any, pos: [number, number, number]) => add(new THREE.SphereGeometry(r, 40, 24), material, pos);
  const torus = (R: number, r: number, material: any, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0]) => add(new THREE.TorusGeometry(R, r, 18, 64), material, pos, rot);
  const cable = (points: Array<[number, number, number]>, radius = 0.035) => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return add(new THREE.TubeGeometry(curve, 48, radius, 12, false), mats.dark, [0, 0, 0]);
  };

  if (model.builder === "charger") {
    box(1.05, 1.18, 0.82, mats.dark, [0, 0.05, 0]);
    box(0.90, 0.08, 0.62, mats.black, [0, 0.67, -0.03]);
    torus(0.22, 0.025, mats.cyan, [0, 0.715, -0.03], [Math.PI / 2, 0, 0]);
    [-0.22, 0, 0.22].forEach((x, i) => box(i < 2 ? 0.25 : 0.31, 0.13, 0.045, mats.black, [x, -0.57, -0.42]));
    [-0.25, 0.25].forEach((x) => box(0.12, 0.18, 0.42, mats.silver, [x, 0.02, 0.61]));
    box(0.12, 0.18, 0.42, mats.silver, [0, 0.30, 0.61]);
  }
  if (model.builder === "projector") {
    cyl(0.46, 1.05, mats.white, [0, 0.22, 0], [0, 0, Math.PI / 2], 64);
    cyl(0.39, 0.08, mats.dark, [-0.56, 0.22, 0], [0, 0, Math.PI / 2], 64);
    cyl(0.15, 0.10, mats.black, [-0.61, 0.24, 0], [0, 0, Math.PI / 2]);
    cyl(0.11, 0.11, mats.blue, [-0.67, 0.24, 0], [0, 0, Math.PI / 2]);
    cyl(0.045, 0.12, mats.cyan, [-0.71, 0.24, 0], [0, 0, Math.PI / 2]);
    box(0.10, 0.78, 0.12, mats.light, [-0.20, -0.52, 0]);
    box(0.10, 0.78, 0.12, mats.light, [0.20, -0.52, 0]);
    box(0.64, 0.10, 0.24, mats.light, [0, -0.92, 0]);
  }
  if (model.builder === "nano") {
    box(0.84, 1.42, 0.42, mats.dark, [0, 0, 0]);
    box(0.44, 0.26, 0.04, mats.black, [0, 0.40, -0.23]);
    box(0.25, 0.08, 0.05, mats.cyan, [0, 0.40, -0.25]);
    cyl(0.17, 0.05, mats.mid, [0.23, 0.52, 0.24], [Math.PI / 2, 0, 0]);
    cable([[0.38, 0.42, 0.08], [0.62, 0.66, 0.08], [0.90, 0.80, 0.08], [1.18, 0.90, 0.08]], 0.032);
    box(0.18, 0.28, 0.11, mats.dark, [1.26, 0.90, 0.08]);
    box(0.10, 0.10, 0.05, mats.silver, [1.26, 1.08, 0.08]);
  }
  if (model.builder === "cube") {
    box(1.12, 0.86, 1.12, mats.light, [0, -0.18, 0]);
    box(0.86, 0.92, 0.08, mats.dark, [0, 0.45, -0.34], [-0.35, 0, 0]);
    box(0.62, 1.02, 0.055, mats.black, [0, 0.57, -0.41], [-0.35, 0, 0]);
    torus(0.18, 0.025, mats.cyan, [0, 0.58, -0.445], [Math.PI / 2 - 0.35, 0, 0]);
    cyl(0.20, 0.07, mats.white, [0.34, -0.02, -0.18], [Math.PI / 2, 0, 0]);
    box(0.36, 0.08, 0.24, mats.white, [-0.30, -0.02, -0.30]);
  }
  if (model.builder === "monitor") {
    box(2.70, 1.62, 0.10, mats.dark, [0, 0.15, 0]);
    box(2.50, 1.40, 0.035, mats.black, [0, 0.18, -0.07]);
    box(1.00, 0.72, 0.012, mats.blue, [-0.55, 0.15, -0.09]);
    box(0.86, 0.58, 0.014, mats.cyan, [0.63, 0.28, -0.09]);
    box(0.82, 1.10, 0.08, mats.mid, [0.73, -0.56, 0.38], [0.32, 0, 0]);
  }
  if (model.builder === "buds") {
    box(1.30, 0.54, 0.82, mats.light, [0, -0.50, 0]);
    cyl(0.18, 0.06, mats.mid, [0.42, -0.46, -0.44], [Math.PI / 2, 0, 0]);
    [-0.34, 0.34].forEach((x) => {
      sph(0.24, mats.light, [x, 0.30, 0]);
      cyl(0.085, 0.48, mats.light, [x, -0.02, 0]);
      cyl(0.055, 0.03, mats.dark, [x, 0.35, -0.23], [Math.PI / 2, 0, 0]);
    });
  }
  if (model.builder === "tracker") {
    box(1.72, 1.08, 0.06, mats.dark, [0, 0, 0]);
    cyl(0.12, 0.07, mats.cyan, [0.53, 0.27, -0.015], [Math.PI / 2, 0, 0]);
    box(0.64, 0.08, 0.015, mats.light, [-0.33, 0.10, -0.038]);
  }
  if (model.builder === "printer") {
    box(1.30, 1.20, 0.96, mats.aqua, [0, 0, 0]);
    box(0.82, 0.32, 0.05, mats.mid, [0, 0.30, -0.505]);
    box(0.72, 0.10, 0.06, mats.black, [0, -0.08, -0.515]);
    box(0.72, 0.76, 0.015, mats.white, [0, -0.46, -0.60]);
    cyl(0.10, 0.04, mats.cyan, [0.38, -0.31, -0.505], [Math.PI / 2, 0, 0]);
  }
  if (model.builder === "translate") {
    [-0.34, 0.34].forEach((x) => {
      torus(0.24, 0.055, mats.light, [x, 0.22, 0], [Math.PI / 2, 0, 0]);
      box(0.18, 0.42, 0.13, mats.dark, [x + 0.16, -0.05, 0]);
      cyl(0.045, 0.14, mats.cyan, [x + 0.16, -0.18, -0.08], [Math.PI / 2, 0, 0]);
    });
    box(1.18, 0.42, 0.78, mats.white, [0, -0.72, 0]);
  }
  if (model.builder === "hub") {
    box(2.10, 0.28, 0.70, mats.mid, [0, 0, 0]);
    [-0.72, -0.38, 0, 0.38, 0.72].forEach((x, i) => box(i < 3 ? 0.27 : 0.32, 0.11, 0.04, mats.black, [x, 0, -0.37]));
    cable([[-1.05, 0, 0], [-1.30, 0.10, 0.05], [-1.55, 0.25, 0.18], [-1.78, 0.42, 0.30]], 0.04);
    box(0.26, 0.12, 0.16, mats.dark, [-1.92, 0.52, 0.38]);
    box(0.10, 0.08, 0.08, mats.silver, [-2.10, 0.56, 0.42]);
  }

  const bounds = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bounds.getSize(size);
  bounds.getCenter(center);
  root.position.sub(center);
  const max = Math.max(size.x, size.y, size.z) || 1;
  root.scale.setScalar(2.6 / max);
  return root;
}

export default function Product3DClient() {
  const [selectedId, setSelectedId] = useState(PRODUCT_MODELS[0].id);
  const [studio, setStudio] = useState<Studio>("dark");
  const [spin, setSpin] = useState(true);
  const [ready, setReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtime = useRef<any>(null);
  const pose = useRef<Pose>({ yaw: 0.65, pitch: 0.28, zoom: 4.5 });
  const model = useMemo(() => PRODUCT_MODELS.find((x) => x.id === selectedId) ?? PRODUCT_MODELS[0], [selectedId]);

  useEffect(() => {
    const ok = () => setReady(Boolean(window.THREE));
    ok();
    window.addEventListener("ttshop-three-ready", ok);
    return () => window.removeEventListener("ttshop-three-ready", ok);
  }, []);

  useEffect(() => {
    if (!ready || !canvasRef.current || !window.THREE) return;
    const THREE = window.THREE;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.ACESFilmicToneMapping) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, pose.current.zoom);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x1b2130, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 5.5);
    key.position.set(4, 5, 5);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6edbff, 3.0);
    rim.position.set(-5, 2, -4);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 1.5);
    fill.position.set(0, -3, 4);
    scene.add(fill);

    const floorMat = new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.25 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.55;
    floor.receiveShadow = true;
    scene.add(floor);

    const product = makeProduct(THREE, model);
    scene.add(product);
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(1, Math.floor(r.height));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      pose.current.yaw += (e.clientX - lastX) * 0.008;
      pose.current.pitch = Math.max(-1.1, Math.min(1.1, pose.current.pitch + (e.clientY - lastY) * 0.006));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      pose.current.zoom = Math.max(2.6, Math.min(7, pose.current.zoom + e.deltaY * 0.003));
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", wheel, { passive: false });

    const tick = () => {
      if (spin && !dragging) pose.current.yaw += 0.0035;
      product.rotation.y = pose.current.yaw;
      product.rotation.x = pose.current.pitch;
      camera.position.z += (pose.current.zoom - camera.position.z) * 0.08;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();
    runtime.current = { camera, product, renderer };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("wheel", wheel);
      scene.traverse((o: any) => {
        o.geometry?.dispose?.();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: any) => m.dispose?.());
      });
      renderer.dispose();
      runtime.current = null;
    };
  }, [ready, model, spin]);

  function applyPose(p: Pose) {
    pose.current = { ...p };
    const rt = runtime.current;
    if (rt?.product) {
      rt.product.rotation.y = p.yaw;
      rt.product.rotation.x = p.pitch;
    }
    if (rt?.camera) rt.camera.position.z = p.zoom;
  }

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
            <span className="rounded-full border px-3 py-1 text-xs font-bold" style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}>{model.category}</span>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border" style={{ borderColor: "var(--border)", background: studio === "dark" ? "radial-gradient(circle at 50% 35%,#252b35 0%,#0b0d12 58%,#050608 100%)" : "radial-gradient(circle at 50% 35%,#fff 0%,#edf1f5 68%,#e3e8ee 100%)" }}>
            <canvas ref={canvasRef} className="block h-[min(68vh,720px)] min-h-[440px] w-full touch-pan-y" aria-label={`Interactive 3D model of ${model.name}`} />
            {!ready && <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: "var(--foreground-muted)" }}>Loading 3D engine…</div>}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => <button key={p.label} type="button" onClick={() => applyPose(p.pose)} className="h-10 rounded-xl border px-3 text-xs font-bold hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border)" }}>{p.label}</button>)}
            <button type="button" onClick={() => setSpin((v) => !v)} className="h-10 rounded-xl border px-3 text-xs font-bold hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border)" }}>{spin ? "Pause rotation" : "Auto rotate"}</button>
            <button type="button" onClick={() => setStudio((v) => v === "dark" ? "light" : "dark")} className="h-10 rounded-xl border px-3 text-xs font-bold hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border)" }}>{studio === "dark" ? "White studio" : "Dark studio"}</button>
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
                  <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className="flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left" style={{ borderColor: active ? "var(--accent)" : "var(--border)", background: active ? "color-mix(in oklch,var(--accent) 10%,transparent)" : "transparent" }}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-black" style={{ background: "var(--surface-hover)" }}>{String(index + 1).padStart(2, "0")}</span>
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
            <p className="mt-1" style={{ color: "var(--foreground-muted)" }}>Hero or Macro, dark seamless studio, 8–12 second orbit, soft key, thin rim light, minimal copy and one feature per shot.</p>
            <p className="mt-3 text-xs" style={{ color: "var(--foreground-muted)" }}>These are lightweight procedural proxy assets for creative production, not manufacturer CAD geometry.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
