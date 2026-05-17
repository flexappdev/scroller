import {
  Download,
  FileJson,
  FileUp,
  Gauge,
  Info,
  RotateCcw,
  Search,
  Shuffle,
  Upload,
  X,
} from "lucide-react";
import { ChangeEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Metrics = {
  impact: number;
  speed: number;
  difficulty: number;
};

type ScrollerItem = {
  id: string;
  title: string;
  type: string;
  hook: string;
  description: string;
  tags: string[];
  metrics: Metrics;
  source?: string;
};

type NormalizedSpec = {
  name: string;
  sourceItems: ScrollerItem[];
};

const TRACKS = [
  "AI Workflow",
  "Career Tool",
  "Content System",
  "Research Kit",
  "Operations",
  "Learning Asset",
  "Sales Enablement",
  "Media Engine",
  "Data Product",
  "Automation",
];

const ACTIONS = [
  "Briefing Builder",
  "Signal Radar",
  "Script Studio",
  "Prompt Vault",
  "Insight Board",
  "Launch Checklist",
  "Persona Mapper",
  "Meeting Debrief",
  "Offer Generator",
  "Content Recycler",
];

const HOOKS = [
  "Turn scattered notes into a usable workstream.",
  "Find the useful signal before the day gets noisy.",
  "Create reusable assets from one strong source item.",
  "Standardise a messy manual process into a repeatable flow.",
  "Give each item enough structure to be ranked and shipped.",
  "Move from idea capture to a working spec without ceremony.",
  "Package knowledge so the next task starts faster.",
  "Keep the feed moving while preserving exportable JSON.",
  "Expose decisions, effort, and risk at a glance.",
  "Make the next useful action obvious.",
];

const TAG_POOL = [
  "AI",
  "Career",
  "Media",
  "Ops",
  "Sales",
  "Research",
  "Learning",
  "Automation",
  "FAD",
  "JSON",
  "Workflow",
  "Content",
];

const clampMetric = (value: unknown, fallback: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const scaled = n > 0 && n <= 10 ? n * 10 : n;
  return Math.max(0, Math.min(100, Math.round(scaled)));
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const makeDefaultSourceItems = (): ScrollerItem[] =>
  Array.from({ length: 100 }, (_, index) => {
    const track = TRACKS[index % TRACKS.length];
    const action = ACTIONS[Math.floor(index / TRACKS.length) % ACTIONS.length];
    const title = `${track} ${action}`;
    const type = track;
    const impact = 52 + ((index * 17) % 45);
    const speed = 48 + ((index * 23) % 49);
    const difficulty = 18 + ((index * 13) % 62);
    const tags = [
      TAG_POOL[index % TAG_POOL.length],
      TAG_POOL[(index + 3) % TAG_POOL.length],
      TAG_POOL[(index + 7) % TAG_POOL.length],
    ];

    return {
      id: `default-${String(index + 1).padStart(3, "0")}-${slugify(title)}`,
      title,
      type,
      hook: HOOKS[index % HOOKS.length],
      description:
        `Reusable scroller item ${index + 1}. It carries enough structure for card rendering, modal inspection, ` +
        "metric comparison, randomised feed placement, and standalone JSON export.",
      tags,
      metrics: { impact, speed, difficulty },
      source: "default",
    };
  });

const DEFAULT_SOURCE_ITEMS = makeDefaultSourceItems();

const getFirstString = (input: Record<string, unknown>, keys: string[], fallback: string) => {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
};

const normalizeTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n|]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  return [];
};

const getSourceArray = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];

  const obj = raw as Record<string, unknown>;
  for (const key of ["items", "sourceItems", "data"]) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }

  return [];
};

const normalizeItem = (raw: unknown, index: number): ScrollerItem => {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const title = getFirstString(obj, ["title", "name", "label", "tool", "app"], `Untitled Item ${index + 1}`);
  const type = getFirstString(obj, ["type", "category", "kind", "group"], "Custom Tool");
  const hook = getFirstString(obj, ["hook", "tagline", "summary", "pitch", "subtitle"], "Reusable imported feed item.");
  const description = getFirstString(
    obj,
    ["description", "details", "body", "content", "notes"],
    "No description was provided in the imported JSON."
  );
  const metrics = obj.metrics && typeof obj.metrics === "object" ? (obj.metrics as Record<string, unknown>) : {};
  const tags = normalizeTags(obj.tags ?? obj.keywords ?? obj.labels);
  const id = getFirstString(obj, ["id", "slug", "key"], `${slugify(title) || "item"}-${index + 1}`);

  return {
    id,
    title,
    type,
    hook,
    description,
    tags: tags.length ? tags : [type],
    metrics: {
      impact: clampMetric(metrics.impact ?? obj.impact ?? obj.value ?? obj.score, 70),
      speed: clampMetric(metrics.speed ?? obj.speed ?? obj.velocity ?? obj.ease, 65),
      difficulty: clampMetric(metrics.difficulty ?? obj.difficulty ?? obj.effort ?? obj.complexity, 35),
    },
    source: getFirstString(obj, ["source", "origin"], "imported"),
  };
};

const normalizeSpec = (raw: unknown): NormalizedSpec => {
  const source = getSourceArray(raw);
  const sourceItems = source.map(normalizeItem);
  const name =
    raw && typeof raw === "object"
      ? getFirstString(raw as Record<string, unknown>, ["name", "title", "id"], "Custom JSON Spec")
      : "Custom JSON Spec";

  return { name, sourceItems };
};

const shuffleItems = <T,>(items: T[]) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const pickRandomItems = (items: ScrollerItem[], count: number) => {
  if (!items.length) return [];
  return Array.from({ length: count }, () => items[Math.floor(Math.random() * items.length)]);
};

const downloadJson = (filename: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button className="icon-button" type="button" onClick={onClick} title={label} aria-label={label}>
      {children}
    </button>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <div className="metric-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="metric-track">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ItemCard({
  item,
  index,
  onOpen,
  onExport,
}: {
  item: ScrollerItem;
  index: number;
  onOpen: (item: ScrollerItem) => void;
  onExport: (item: ScrollerItem) => void;
}) {
  return (
    <article className="feed-card" onClick={() => onOpen(item)} tabIndex={0}>
      <div className="card-index">{String(index + 1).padStart(3, "0")}</div>
      <div className="card-main">
        <div className="card-heading">
          <div>
            <p className="item-type">{item.type}</p>
            <h2>{item.title}</h2>
          </div>
          <IconButton
            label={`Export ${item.title} JSON`}
            onClick={(event) => {
              event.stopPropagation();
              onExport(item);
            }}
          >
            <Download size={17} />
          </IconButton>
        </div>
        <p className="hook">{item.hook}</p>
        <p className="description">{item.description}</p>
        <div className="tag-row">
          {item.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="metrics-grid">
          <MetricBar label="Impact" value={item.metrics.impact} />
          <MetricBar label="Speed" value={item.metrics.speed} />
          <MetricBar label="Difficulty" value={item.metrics.difficulty} />
        </div>
      </div>
    </article>
  );
}

function DetailModal({
  item,
  onClose,
  onExport,
}: {
  item: ScrollerItem | null;
  onClose: () => void;
  onExport: (item: ScrollerItem) => void;
}) {
  if (!item) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="item-type">{item.type}</p>
            <h2 id="detail-title">{item.title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close modal" title="Close">
            <X size={18} />
          </button>
        </div>
        <p className="modal-hook">{item.hook}</p>
        <p className="modal-copy">{item.description}</p>
        <div className="modal-metrics">
          <MetricBar label="Impact" value={item.metrics.impact} />
          <MetricBar label="Speed" value={item.metrics.speed} />
          <MetricBar label="Difficulty" value={item.metrics.difficulty} />
        </div>
        <pre className="json-preview">{JSON.stringify(item, null, 2)}</pre>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Close
          </button>
          <button className="primary-button" type="button" onClick={() => onExport(item)}>
            <Download size={16} />
            Export item JSON
          </button>
        </div>
      </section>
    </div>
  );
}

function PasteModal({
  open,
  value,
  error,
  onChange,
  onClose,
  onImport,
}: {
  open: boolean;
  value: string;
  error: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onImport: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal-panel paste-panel" role="dialog" aria-modal="true" aria-labelledby="paste-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="item-type">Import</p>
            <h2 id="paste-title">Paste JSON spec</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close modal" title="Close">
            <X size={18} />
          </button>
        </div>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder='[{"title":"My Tool","type":"Custom Tool","hook":"Useful hook","description":"Details","tags":["AI"],"metrics":{"impact":80,"speed":70,"difficulty":30}}]'
        />
        {error ? <p className="error-text">{error}</p> : null}
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="button" onClick={onImport}>
            <Upload size={16} />
            Import pasted JSON
          </button>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [sourceItems, setSourceItems] = useState<ScrollerItem[]>(DEFAULT_SOURCE_ITEMS);
  const [feedItems, setFeedItems] = useState<ScrollerItem[]>(() => shuffleItems(DEFAULT_SOURCE_ITEMS));
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ScrollerItem | null>(null);
  const [specName, setSpecName] = useState("Default FAD Scroller Spec");
  const [message, setMessage] = useState("Default 100-item spec loaded.");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filteredSourceItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sourceItems;
    return sourceItems.filter((item) => {
      const text = [item.title, item.type, item.hook, item.description, ...item.tags].join(" ").toLowerCase();
      return text.includes(needle);
    });
  }, [query, sourceItems]);

  useEffect(() => {
    setFeedItems(shuffleItems(filteredSourceItems));
  }, [filteredSourceItems]);

  const appendRandomCards = useCallback(() => {
    setFeedItems((current) => [...current, ...pickRandomItems(filteredSourceItems, 24)]);
  }, [filteredSourceItems]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) appendRandomCards();
      },
      { rootMargin: "700px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [appendRandomCards]);

  const applySpec = (raw: unknown) => {
    const spec = normalizeSpec(raw);
    if (!spec.sourceItems.length) {
      throw new Error("No items found. Use a raw array, items, sourceItems, or data.");
    }

    setSourceItems(spec.sourceItems);
    setSpecName(spec.name);
    setMessage(`${spec.sourceItems.length} imported source items loaded and randomized.`);
    setImportError("");
    setQuery("");
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      applySpec(JSON.parse(text));
      setMessage(`Imported ${file.name}.`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed.");
      setMessage("Import failed.");
    } finally {
      event.target.value = "";
    }
  };

  const importPastedJson = () => {
    try {
      applySpec(JSON.parse(pasteValue));
      setPasteOpen(false);
      setPasteValue("");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed.");
    }
  };

  const resetSpec = () => {
    setSourceItems(DEFAULT_SOURCE_ITEMS);
    setSpecName("Default FAD Scroller Spec");
    setQuery("");
    setMessage("Default 100-item spec loaded.");
    setImportError("");
  };

  const randomizeFeed = () => {
    setFeedItems(shuffleItems(filteredSourceItems));
    setMessage(`${filteredSourceItems.length} visible source items randomized.`);
  };

  const exportFullSpec = () => {
    downloadJson("fad-scroller-spec.json", {
      name: specName,
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      sourceItems,
    });
  };

  const exportItem = (item: ScrollerItem) => {
    downloadJson(`${slugify(item.title) || "scroller-item"}.json`, item);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup" aria-label="Scroller">
          <div className="brand-mark">
            <FileJson size={20} />
          </div>
          <div>
            <h1>Scroller</h1>
            <p>Reusable FAD feed engine</p>
          </div>
        </div>

        <div className="toolbar">
          <div className="search-wrap">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search source items" />
          </div>
          <button className="tool-button" type="button" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={16} />
            Import file
          </button>
          <button className="tool-button" type="button" onClick={() => setPasteOpen(true)}>
            <Upload size={16} />
            Paste JSON
          </button>
          <button className="tool-button" type="button" onClick={randomizeFeed}>
            <Shuffle size={16} />
            Randomize
          </button>
          <button className="tool-button" type="button" onClick={exportFullSpec}>
            <Download size={16} />
            Export spec
          </button>
          <button className="tool-button" type="button" onClick={resetSpec}>
            <RotateCcw size={16} />
            Reset
          </button>
          <input ref={fileInputRef} className="hidden-input" type="file" accept="application/json,.json" onChange={importFile} />
        </div>
      </header>

      <section className="status-strip" aria-label="Scroller status">
        <div>
          <strong>{sourceItems.length}</strong>
          <span>source items</span>
        </div>
        <div>
          <strong>{feedItems.length}</strong>
          <span>rendered cards</span>
        </div>
        <div>
          <strong>{filteredSourceItems.length}</strong>
          <span>visible after filter</span>
        </div>
        <p>{message}</p>
      </section>

      <section className="workspace">
        <aside className="side-panel" aria-label="Spec details">
          <div className="panel-section">
            <div className="panel-title">
              <Info size={16} />
              <span>Active spec</span>
            </div>
            <h2>{specName}</h2>
            <p>
              Cards open into modals, the whole source set is available immediately, and infinite scroll appends more
              randomized cards from the same normalized item pool.
            </p>
          </div>
          <div className="panel-section">
            <div className="panel-title">
              <Gauge size={16} />
              <span>Import shape</span>
            </div>
            <ul>
              <li>Raw array</li>
              <li>{'{ "items": [...] }'}</li>
              <li>{'{ "sourceItems": [...] }'}</li>
              <li>{'{ "data": [...] }'}</li>
            </ul>
          </div>
          {importError ? <p className="error-box">{importError}</p> : null}
        </aside>

        <section className="feed-column" aria-label="Randomized feed">
          {feedItems.length ? (
            feedItems.map((item, index) => (
              <ItemCard key={`${item.id}-${index}`} item={item} index={index} onOpen={setSelectedItem} onExport={exportItem} />
            ))
          ) : (
            <div className="empty-state">
              <h2>No matching items</h2>
              <p>Clear the search field or import a different JSON spec.</p>
            </div>
          )}
          <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />
        </section>
      </section>

      <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onExport={exportItem} />
      <PasteModal
        open={pasteOpen}
        value={pasteValue}
        error={importError}
        onChange={setPasteValue}
        onClose={() => setPasteOpen(false)}
        onImport={importPastedJson}
      />
    </main>
  );
}
