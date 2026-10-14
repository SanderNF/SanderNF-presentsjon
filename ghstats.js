// GitHub stats from github-stats-extended (config.githubStats).
// display: "native" draws the numbers in the site's own style; "svg" inlines the original cards.
// Both read the SVGs with fetch(), which needs CORS on the endpoint. Without it, the cards fall back
// to plain <img> tags (not selectable), which hide themselves if they can't load either.
(() => {
  const C = window.SITE_CONFIG, gh = C.githubStats;
  const root = document.querySelector("#gh-stats");
  if (!gh?.endpoint || !root) return;
  const { t } = window.I18N;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const display = gh.display === "svg" ? "svg" : "native";
  const url = (path, opts, extra = {}) => `${gh.endpoint}${path}?${new URLSearchParams({ username: gh.username, ...opts, ...extra })}`;

  // card colours and language, used for the original-look cards (svg and img)
  const themed = (titleKey) => ({
    bg_color: "00000000", hide_border: "true", title_color: "00ffa3", text_color: "c9d6e8", icon_color: "00d4ff",
    custom_title: t(titleKey), locale: window.I18N.lang === "no" ? "no" : "en",
  });
  const CARDS = [
    { path: "", opts: () => gh.stats, title: "gh.stats", file: "stats.svg" },
    { path: "/top-langs/", opts: () => gh.topLangs, title: "gh.langs", file: "top-langs.svg" },
  ];

  // ---------- fetching ----------
  class CorsError extends Error { kind = "cors"; }
  class CardError extends Error { kind = "card"; }
  // the endpoint sometimes answers with a "Something went wrong" card, so retry a few times
  async function getSvg(u) {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await sleep(1500 * attempt);
      let text;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 12000);
        const r = await fetch(u, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
        if (!r.ok) continue;
        text = await r.text();
      } catch {
        throw new CorsError(); // blocked (no CORS header), offline, or timed out
      }
      const doc = new DOMParser().parseFromString(text, "image/svg+xml");
      if (!doc.querySelector("parsererror") && !doc.querySelector('[data-testid="message"]')) return { doc, text };
    }
    throw new CardError();
  }

  function parseStats(doc) {
    const stats = ["stars", "commits", "prs", "issues", "contribs"]
      .map((id) => [id, doc.querySelector(`[data-testid="${id}"]`)?.textContent.trim()])
      .filter(([, v]) => v);
    if (!stats.length) throw new CardError();
    return stats;
  }
  function parseLangs(doc) {
    const dotColors = [...doc.querySelectorAll("circle[fill]")].map((c) => c.getAttribute("fill"));
    const langs = [...doc.querySelectorAll('[data-testid="lang-name"]')]
      .map((el, i) => {
        const m = el.textContent.trim().match(/^(.*?)\s+([\d.]+)%$/);
        return m && { name: m[1], pct: +m[2], color: dotColors[i] || "#00ffa3" }; // one coloured dot per language, in order
      })
      .filter(Boolean);
    if (!langs.length) throw new CardError();
    return langs;
  }
  const parse = (statsDoc, langsDoc) => ({ stats: parseStats(statsDoc), langs: parseLangs(langsDoc) });

  // make a fetched card safe and self-contained before putting it in the page
  let svgCount = 0;
  function inlineSvg(text) {
    const prefix = `ghs${++svgCount}-`;
    const ids = [...text.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    for (const id of new Set(ids)) {
      const safe = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      text = text
        .replace(new RegExp(`\\bid="${safe}"`, "g"), `id="${prefix}${id}"`)
        .replace(new RegExp(`#${safe}(?![\\w-])`, "g"), `#${prefix}${id}`)
        .replace(new RegExp(`(aria-labelledby="[^"]*)\\b${safe}\\b`, "g"), `$1${prefix}${id}`);
    }
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    doc.querySelectorAll("script, foreignObject").forEach((el) => el.remove());
    doc.querySelectorAll("*").forEach((el) => [...el.attributes].forEach((a) => /^on/i.test(a.name) && el.removeAttribute(a.name)));
    const svg = doc.documentElement;
    svg.removeAttribute("width"); svg.removeAttribute("height"); // sized by CSS, keeps its viewBox
    return svg.outerHTML;
  }

  // very dark language colours (e.g. PowerShell) disappear on the dark background, so lift them
  function visible(hex) {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || "");
    if (!m) return hex;
    const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.25 ? `color-mix(in srgb, ${hex} 45%, #c9d6e8)` : hex;
  }

  // ---------- rendering ----------
  const ICONS = { stars: "★", commits: "⎇", prs: "⇄", issues: "◎", contribs: "⬡" };
  const bar = (file) => `<div class="win-bar"><i></i><i></i><i></i><span>${esc(file)}</span></div>`;
  const term = (body) => `<div class="code-card gh-term">${bar(`gh stats --user ${gh.username}`)}${body}</div>`;
  const cardBox = (c, inner) => `<figure class="code-card gh-card">${bar(c.file)}${inner}</figure>`;

  let state = "loading", data = null;

  function renderNative() {
    const commitsKey = gh.stats?.include_all_commits === "true" ? "gh.commits.all" : "gh.commits";
    const max = Math.max(...data.langs.map((l) => l.pct));
    root.innerHTML = term(`
      <div class="gh-body">
        <div class="gh-pane" role="group" aria-label="${esc(t("gh.stats"))}">
          <p class="gh-cmd"><span class="prompt">$</span> gh stats</p>
          <ul class="gh-list">
            ${data.stats.map(([id, v]) => `
              <li><span class="gh-ico" aria-hidden="true">${ICONS[id]}</span><span class="gh-label">${esc(t(id === "commits" ? commitsKey : "gh." + id))}</span><span class="gh-dots"></span><b>${esc(v)}</b></li>`).join("")}
          </ul>
        </div>
        <div class="gh-pane" role="group" aria-label="${esc(t("gh.langs"))}">
          <p class="gh-cmd"><span class="prompt">$</span> gh langs --top ${data.langs.length}</p>
          <ul class="gh-langs">
            ${data.langs.map((l, i) => `
              <li style="--c:${visible(l.color)};--w:${((l.pct / max) * 100).toFixed(1)}%;--i:${i}">
                <span class="gh-lang">${esc(l.name)}</span><span class="gh-bar"><i></i></span><span class="gh-pct">${l.pct.toFixed(1)}%</span>
              </li>`).join("")}
          </ul>
        </div>
      </div>
      <a class="gh-foot" href="https://github.com/${encodeURIComponent(gh.username)}" target="_blank" rel="noopener">${window.SNF_ICONS?.github || ""}<span>github.com/${esc(gh.username)}</span></a>`);
    // grow the bars when the panel scrolls into view
    const el = root.querySelector(".gh-term");
    new IntersectionObserver((entries, io) => {
      if (entries.some((e) => e.isIntersecting)) { el.classList.add("on"); io.disconnect(); }
    }, { threshold: 0.2 }).observe(el);
  }

  async function renderSvg() {
    const lang = window.I18N.lang;
    const results = await Promise.allSettled(CARDS.map((c) => getSvg(url(c.path, c.opts(), themed(c.title)))));
    if (window.I18N.lang !== lang) return; // language changed while loading; that render wins
    if (results.every((r) => r.status === "rejected")) {
      state = results.some((r) => r.reason instanceof CorsError) ? "images" : "error";
      return render();
    }
    root.innerHTML = CARDS.map((c, i) => results[i].status === "fulfilled" ? cardBox(c, `<div class="gh-svg">${inlineSvg(results[i].value.text)}</div>`) : "").join("");
  }

  function renderImages() {
    root.innerHTML = CARDS.map((c) => cardBox(c,
      `<img src="${esc(url(c.path, c.opts(), themed(c.title)))}" alt="${esc(t(c.title))}" loading="lazy" onerror="this.closest('.gh-card').remove()" />`)).join("");
  }

  function render() {
    if (state === "native") return renderNative();
    if (state === "svg") return renderSvg();
    if (state === "images") return renderImages();
    const line = state === "error"
      ? `<span class="t-err">${esc(t("gh.error"))}</span> <button type="button" class="gh-retry">${esc(t("gh.retry"))}</button>`
      : `<span class="t-dim">${esc(t("gh.loading"))}</span><span class="caret">█</span>`;
    root.innerHTML = term(`<p class="gh-loading"><span class="prompt">$</span> gh stats ${line}</p>`);
    root.querySelector(".gh-retry")?.addEventListener("click", load);
  }

  function load() {
    state = "loading";
    render();
    if (display === "svg") { state = "svg"; return render(); }
    Promise.all(CARDS.map((c) => getSvg(url(c.path, c.opts()))))
      .then(([s, l]) => { data = parse(s.doc, l.doc); state = "native"; })
      .catch((e) => { state = e instanceof CorsError ? "images" : "error"; })
      .finally(render);
  }

  window.I18N.onChange(render);
  load();

  // ---------- shared with the terminal: `gh stats`, `gh langs --top N` ----------
  const pending = {};
  const once = (key, fn) => (pending[key] ??= fn().catch((e) => { delete pending[key]; throw e; }));
  const defaultTop = +gh.topLangs?.langs_count || 5;
  window.SNF_GH = {
    username: gh.username,
    commitsAll: gh.stats?.include_all_commits === "true",
    visible,
    stats: () => (data ? Promise.resolve(data.stats) : once("stats", async () => parseStats((await getSvg(url("", gh.stats))).doc))),
    // percentages are worked out by the endpoint for the top N, so each N is its own request
    langs: (n = defaultTop) => (data && n === data.langs.length
      ? Promise.resolve(data.langs)
      : once(`langs${n}`, async () => parseLangs((await getSvg(url("/top-langs/", { ...gh.topLangs, langs_count: String(n) }))).doc))),
  };
})();
