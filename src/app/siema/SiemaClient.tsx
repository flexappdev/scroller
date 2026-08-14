"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

type StoredSiemaImage = {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  blob: Blob;
};

type ViewSiemaImage = StoredSiemaImage & {
  url: string;
};

type SortMode = "newest" | "oldest";

const DB_NAME = "siema-scroller-v1";
const STORE_NAME = "images";
const DB_VERSION = 1;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open Siema storage."));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Siema storage transaction failed."));
    tx.onabort = () => reject(tx.error ?? new Error("Siema storage transaction was aborted."));
  });
}

async function getAllImages(): Promise<StoredSiemaImage[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    const result = await new Promise<StoredSiemaImage[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as StoredSiemaImage[]);
      request.onerror = () => reject(request.error ?? new Error("Could not read Siema images."));
    });
    await transactionDone(tx);
    return result;
  } finally {
    db.close();
  }
}

async function saveFiles(files: File[]): Promise<number> {
  const accepted = files.filter((file) => file.type.startsWith("image/") || IMAGE_EXT.test(file.name));
  if (!accepted.length) return 0;

  const records: StoredSiemaImage[] = accepted.map((file) => ({
    id: `${file.lastModified}:${file.size}:${file.name}`,
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    lastModified: file.lastModified || Date.now(),
    blob: file,
  }));

  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const record of records) store.put(record);
    await transactionDone(tx);
    return records.length;
  } finally {
    db.close();
  }
}

async function clearStoredImages(): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

function formatDate(timestamp: number): string {
  if (!timestamp) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function SiemaClient() {
  const [images, setImages] = useState<ViewSiemaImage[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Loading your Siema collection…");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const urlsRef = useRef<string[]>([]);

  const refresh = useCallback(async (mode: SortMode = sortMode) => {
    try {
      const records = await getAllImages();
      records.sort((a, b) =>
        mode === "newest" ? b.lastModified - a.lastModified : a.lastModified - b.lastModified,
      );

      for (const url of urlsRef.current) URL.revokeObjectURL(url);
      const next = records.map((record) => ({ ...record, url: URL.createObjectURL(record.blob) }));
      urlsRef.current = next.map((item) => item.url);
      setImages(next);
      setActiveIndex(0);
      requestAnimationFrame(() => containerRef.current?.scrollTo({ top: 0 }));
      setMessage(next.length ? `${next.length} Siema image${next.length === 1 ? "" : "s"} ready.` : "Choose your downloaded Siema images to start.");
    } catch (error) {
      console.error(error);
      setMessage("Local image storage is unavailable in this browser.");
    } finally {
      setLoading(false);
    }
  }, [sortMode]);

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "");
      folderInputRef.current.setAttribute("directory", "");
    }
    void refresh(sortMode);
    return () => {
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
    };
    // Initial load only. Sort changes are handled explicitly below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const importFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setMessage("Importing images…");
      try {
        const count = await saveFiles(files);
        setMessage(count ? `Imported ${count} image${count === 1 ? "" : "s"}.` : "No image files found.");
        await refresh(sortMode);
      } catch (error) {
        console.error(error);
        setMessage("Could not import those images.");
      }
    },
    [refresh, sortMode],
  );

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void importFiles(files);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files ?? []);
    void importFiles(files);
  }

  async function handleClear() {
    if (!images.length) return;
    if (!window.confirm(`Remove all ${images.length} Siema images from this browser? Your downloaded originals will not be deleted.`)) return;
    await clearStoredImages();
    await refresh(sortMode);
  }

  async function toggleSort() {
    const next: SortMode = sortMode === "newest" ? "oldest" : "newest";
    setSortMode(next);
    await refresh(next);
  }

  function scrollToIndex(index: number) {
    const container = containerRef.current;
    if (!container || !images.length) return;
    const clamped = Math.max(0, Math.min(images.length - 1, index));
    container.scrollTo({ top: clamped * container.clientHeight, behavior: "smooth" });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        scrollToIndex(activeIndex + 1);
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
      if (event.key === "Home") scrollToIndex(0);
      if (event.key === "End") scrollToIndex(images.length - 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, images.length]);

  function handleScroll() {
    const container = containerRef.current;
    if (!container || !container.clientHeight) return;
    const index = Math.round(container.scrollTop / container.clientHeight);
    setActiveIndex(Math.max(0, Math.min(images.length - 1, index)));
  }

  return (
    <div
      className="fixed bottom-12 right-0 top-12 overflow-hidden bg-black text-white"
      style={{ left: "var(--sidebar-w, 180px)" }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 bg-gradient-to-b from-black/75 to-transparent p-3 sm:p-4">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-white/65">Siema Scroller</div>
          <div className="mt-1 text-sm text-white/90" aria-live="polite">
            {loading ? "Loading…" : images.length ? `${activeIndex + 1} / ${images.length}` : message}
          </div>
        </div>

        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-white/20 bg-black/45 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-black/70"
          >
            Add images
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="hidden rounded-full border border-white/20 bg-black/45 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-black/70 sm:block"
          >
            Add folder
          </button>
          {images.length > 1 && (
            <button
              type="button"
              onClick={() => void toggleSort()}
              className="rounded-full border border-white/20 bg-black/45 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-black/70"
            >
              {sortMode === "newest" ? "Newest first" : "Oldest first"}
            </button>
          )}
          {images.length > 0 && (
            <button
              type="button"
              onClick={() => void handleClear()}
              className="rounded-full border border-white/20 bg-black/45 px-3 py-2 text-xs font-medium text-white/80 backdrop-blur hover:bg-black/70"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {images.length === 0 ? (
        <div className="flex h-full items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/5 text-2xl">S</div>
            <h1 className="text-2xl font-semibold">Your Siema feed</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Select the Siema images you downloaded from ChatGPT. They stay stored locally in this browser and are shown one scene per screen, newest first.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black hover:bg-white/90"
              >
                Choose images
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="hidden rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/10 sm:block"
              >
                Choose folder
              </button>
            </div>
            <p className="mt-5 text-xs text-white/35">Desktop: drag image files onto this page. Keyboard: ↑ ↓ Page Up Page Down.</p>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth"
        >
          {images.map((image, index) => (
            <section
              key={image.id}
              data-siema-slide
              className="relative h-full w-full snap-start snap-always overflow-hidden bg-black"
              aria-label={`Siema image ${index + 1} of ${images.length}: ${image.name}`}
            >
              {/* Background treatment only; the canonical image below is always fully visible. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl"
              />
              <div className="absolute inset-0 bg-black/20" />

              <div className="relative flex h-full w-full items-center justify-center p-2 sm:p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.name}
                  className="max-h-full max-w-full object-contain shadow-2xl"
                  loading={index < 2 ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-4 pt-16 sm:px-6 sm:pb-6">
                <div className="max-w-[75%] truncate text-sm font-medium text-white/90">{image.name}</div>
                <div className="mt-1 text-xs text-white/50">
                  {formatDate(image.lastModified)} · {formatBytes(image.size)}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
