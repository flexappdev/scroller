/* vad-scroller ranking: the newest batch first, best-first, then everything else.
 * Used by index.html (window.VidaiRank) and by the Node tests (require).
 *
 * An item is one entry of feed.json:
 *   { id, made (ISO), duration (s), cuts (scene cuts), motion (mean scene score 0..1),
 *     engagement: {views, likes, comments, shares}, live (book on sale), pick (bool) }
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.VidaiRank = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DEFAULTS = {
    // A gap longer than this between two consecutive videos starts an older batch.
    batchGapHours: 6,
    // How "best" is blended. Scores are 0..1 per signal, multiplied by these.
    weights: { pick: 10, engagement: 3, pace: 2, fit: 1, live: 0.5 },
    // Ideal short length in seconds; outside it the fit signal decays.
    fit: { min: 15, max: 35 },
    // Order of everything after the fresh batch: "newest" or "best".
    rest: "newest",
    // Manual picks: ids or slugs, best first.
    picks: []
  };

  // Presets for the "Best by" switch in the app.
  var MODES = {
    blend: null,
    pace: { pick: 0, engagement: 0, pace: 1, fit: 0, live: 0 },
    engagement: { pick: 0, engagement: 1, pace: 0, fit: 0, live: 0 },
    picks: { pick: 1, engagement: 0, pace: 0, fit: 0, live: 0 }
  };

  function merge(cfg) {
    cfg = cfg || {};
    var out = {};
    for (var k in DEFAULTS) out[k] = DEFAULTS[k];
    for (k in cfg) if (cfg[k] !== undefined && k !== "weights" && k !== "fit") out[k] = cfg[k];
    out.weights = Object.assign({}, DEFAULTS.weights, cfg.weights || {});
    out.fit = Object.assign({}, DEFAULTS.fit, cfg.fit || {});
    if (cfg.mode && MODES[cfg.mode]) out.weights = Object.assign({}, MODES[cfg.mode]);
    return out;
  }

  function t(item) {
    var v = Date.parse(item.made);
    return isNaN(v) ? 0 : v;
  }

  /** Split items (any order) into batches, newest batch first; each batch newest-first. */
  function batches(items, gapHours) {
    var gap = (gapHours == null ? DEFAULTS.batchGapHours : gapHours) * 3600e3;
    var sorted = items.slice().sort(function (a, b) { return t(b) - t(a); });
    var out = [];
    var cur = null;
    var prev = null;
    sorted.forEach(function (it) {
      if (!cur || prev - t(it) > gap) { cur = []; out.push(cur); }
      cur.push(it);
      prev = t(it);
    });
    return out;
  }

  function engagementRaw(e) {
    if (!e) return 0;
    var v = (e.views || 0) + 5 * (e.likes || 0) + 10 * (e.comments || 0) + 20 * (e.shares || 0);
    return Math.log10(1 + v);
  }

  function fitScore(d, fit) {
    if (!d) return 0;
    if (d >= fit.min && d <= fit.max) return 1;
    var dist = d < fit.min ? fit.min - d : d - fit.max;
    return Math.max(0, 1 - dist / 30);
  }

  function norm(values) {
    var lo = Math.min.apply(null, values);
    var hi = Math.max.apply(null, values);
    return function (v) { return hi > lo ? (v - lo) / (hi - lo) : (hi > 0 ? 1 : 0); };
  }

  /** Per-signal scores (0..1) and the weighted total for every item. Normalised across the whole feed. */
  function score(items, cfg) {
    cfg = merge(cfg);
    if (!items.length) return [];
    var picks = (cfg.picks || []).map(String);
    var paceRaw = items.map(function (i) {
      var perSec = i.duration ? (i.cuts || 0) / i.duration : 0;
      return perSec + 2 * (i.motion || 0);
    });
    var engRaw = items.map(function (i) { return engagementRaw(i.engagement); });
    var nPace = norm(paceRaw);
    var nEng = norm(engRaw);
    var w = cfg.weights;
    var rows = items.map(function (i, k) {
      var pi = picks.indexOf(String(i.id));
      if (pi < 0 && i.slug) pi = picks.indexOf(String(i.slug));
      return { item: i, signals: {
        pick: i.pick ? 1 : pi >= 0 ? 1 - pi / (2 * picks.length) : 0,
        engagement: nEng(engRaw[k]),
        pace: nPace(paceRaw[k]),
        fit: fitScore(i.duration, cfg.fit),
        live: i.live ? 1 : 0
      } };
    });
    // A signal nobody has yet (no picks, no posts) is left out of the average, so it does not drag every score down.
    var active = Object.keys(rows[0].signals).filter(function (key) {
      return (w[key] || 0) > 0 && rows.some(function (r) { return r.signals[key] > 0; });
    });
    var wsum = active.reduce(function (a, key) { return a + w[key]; }, 0);
    rows.forEach(function (r) {
      var total = active.reduce(function (a, key) { return a + w[key] * r.signals[key]; }, 0);
      r.score = wsum ? total / wsum : 0;
      r.active = active;
    });
    return rows;
  }

  function byScore(a, b) { return b.score - a.score || t(b.item) - t(a.item) || String(a.item.id).localeCompare(String(b.item.id)); }
  function byNewest(a, b) { return t(b.item) - t(a.item) || b.score - a.score || String(a.item.id).localeCompare(String(b.item.id)); }

  /**
   * The feed order: fresh batch best-first, then the rest ("newest" or "best").
   * Returns { fresh, rest, ordered } of { item, signals, score, fresh, place }.
   */
  function rankFeed(items, cfg) {
    cfg = merge(cfg);
    var scored = score(items, cfg);
    var byId = new Map(scored.map(function (s) { return [s.item, s]; }));
    var groups = batches(items, cfg.batchGapHours);
    var fresh = (groups[0] || []).map(function (i) { return byId.get(i); }).sort(byScore);
    var restItems = [].concat.apply([], groups.slice(1)).map(function (i) { return byId.get(i); });
    var rest = restItems.sort(cfg.rest === "best" ? byScore : byNewest);
    fresh.forEach(function (s, k) { s.fresh = true; s.place = k + 1; });
    rest.forEach(function (s, k) { s.fresh = false; s.place = fresh.length + k + 1; });
    return { fresh: fresh, rest: rest, ordered: fresh.concat(rest), config: cfg };
  }

  // Seeded shuffle (mulberry32 + Fisher-Yates): same seed, same order, so a re-render keeps its place.
  function shuffle(list, seed) {
    var a = list.slice(), t = (seed >>> 0) || 1;
    function rnd() {
      t = (t + 0x6D2B79F5) >>> 0;
      var x = Math.imul(t ^ (t >>> 15), 1 | t);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    }
    for (var k = a.length - 1; k > 0; k--) {
      var j = Math.floor(rnd() * (k + 1)), tmp = a[k];
      a[k] = a[j]; a[j] = tmp;
    }
    return a;
  }

  return { DEFAULTS: DEFAULTS, MODES: MODES, merge: merge, batches: batches, score: score, rankFeed: rankFeed, fitScore: fitScore, shuffle: shuffle };
});
