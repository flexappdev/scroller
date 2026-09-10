import SavedPageClient from "@/components/SavedPageClient";
import SavedClient from "./SavedClient";

export default function SavedPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 pb-28 sm:px-8">
      <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>Saved</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Your keep pile.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6" style={{ color: "var(--foreground-muted)" }}>
        Save cards from Home and return to them here. Saves stay on this device.
      </p>
      <SavedPageClient />
      <div className="mt-10 border-t pt-8" style={{ borderColor: "var(--border)" }}>
        <SavedClient />
      </div>
    </main>
  );
}
