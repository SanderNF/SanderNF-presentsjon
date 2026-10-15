// Project page — project.html?p=<name>, content from config.js
(() => {
  const C = window.SITE_CONFIG;
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const { L } = window.I18N, tr = window.I18N.t;
  document.querySelectorAll("[data-bind]").forEach((el) => (el.textContent = L(C[el.dataset.bind])));
  $("#year").textContent = new Date().getFullYear();

  const name = new URLSearchParams(location.search).get("p");
  const p = C.projects.find((x) => x.name === name);
  const root = $("#project-root");

  if (!p) {
    root.innerHTML = `<pre class="album-error">cat: projects/${esc(name || "")}.md: No such file or directory\n\navailable:\n${C.projects.map((x) => `  <a href="project.html?p=${encodeURIComponent(x.name)}">${esc(x.name)}</a>`).join("\n")}</pre>`;
    return;
  }
  // ---------- Markdown file tabs (project.files) ----------
  // marked renders the Markdown, mermaid draws ```mermaid diagrams; both load only when needed
  const loaded = {};
  const loadScript = (src) => (loaded[src] ??= new Promise((res, rej) => {
    const el = document.createElement("script");
    el.src = src; el.onload = res; el.onerror = () => rej(new Error(`couldn't load ${src}`));
    document.head.appendChild(el);
  }));
  // a file entry is a path, or { en, no } paths for per-language versions; 1337 uses English with leetified prose
  const filePath = (f) => (typeof f === "string" ? f : window.I18N.lang === "no" ? f.no ?? f.en : f.en ?? f.no);
  const fileName = (f) => (typeof f === "string" ? f : f.en ?? f.no).split("/").pop();
  const fileKey = (f) => filePath(f) + (window.I18N.lang === "leet" ? "#leet" : "");
  const fileCache = {}; // fileKey → rendered HTML
  const fileId = (f) => "file-" + fileName(f).replace(/\.\w+$/, "").replace(/[^\w-]/g, "-");
  let diagramCount = 0;
  async function renderFile(f) {
    const key = fileKey(f), path = filePath(f), leet = key.endsWith("#leet");
    if (fileCache[key]) return fileCache[key];
    const [md] = await Promise.all([
      fetch(path, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); }),
      loadScript("https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"),
    ]);
    const box = document.createElement("div");
    box.innerHTML = window.marked.parse(md);
    const diagrams = [...box.querySelectorAll("code.language-mermaid")];
    if (diagrams.length) {
      await loadScript("https://cdn.jsdelivr.net/npm/mermaid@11.9.0/dist/mermaid.min.js");
      // diagram colours follow the site's accents (flag preset)
      const cs = getComputedStyle(document.documentElement), css = (v) => cs.getPropertyValue(v).trim();
      window.mermaid.initialize({
        startOnLoad: false, theme: "base", fontFamily: "JetBrains Mono, monospace",
        themeVariables: {
          background: "#05070d", primaryColor: "#0a1424", primaryTextColor: "#c9d6e8", primaryBorderColor: css("--accent") || "#00ffa3",
          lineColor: css("--accent-2") || "#00d4ff", secondaryColor: "#0a0f1c", tertiaryColor: "#0a0f1c", clusterBkg: `rgba(${css("--accent-rgb") || "0, 255, 163"}, 0.04)`,
          clusterBorder: "#1f3a33", edgeLabelBackground: "#05070d", fontSize: "13px",
        },
      });
      for (const [i, code] of diagrams.entries()) {
        const { svg } = await window.mermaid.render(`${fileId(f)}-diagram-${++diagramCount}`, code.textContent);
        const fig = document.createElement("div");
        fig.className = "md-diagram";
        fig.innerHTML = svg;
        // mermaid centres subgraph titles, where lines often cross them; move each to the box's top-left
        for (const cluster of fig.querySelectorAll("g.cluster")) {
          const rect = cluster.querySelector(":scope > rect"), label = cluster.querySelector(":scope > .cluster-label");
          const m = label?.getAttribute("transform")?.match(/translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/);
          if (rect && m) label.setAttribute("transform", `translate(${+rect.getAttribute("x") + 12}, ${m[2]})`);
        }
        code.closest("pre").replaceWith(fig);
      }
    }
    if (leet) {
      // leetify the prose only — code blocks and diagrams stay readable
      const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.parentElement.closest("pre, code, svg, .md-diagram") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      for (let n; (n = walker.nextNode()); ) n.nodeValue = window.I18N.leet(n.nodeValue);
    }
    return (fileCache[key] = box.innerHTML);
  }

  function render(tab) {
    document.title = `${p.name} — ${C.name}`;

    const exp = p.report ? C.experience.find((e) => e.place === p.report) : null;
    const ref = exp?.reference;

    // tabs: README.md always, report.txt when the project links to a reference letter
    const tabs = [
      {
        id: "readme", label: "README.md",
        html: `
          <h3># ${esc(p.name)}</h3>
          <p class="pp-lead">${esc(L(p.description))}</p>
          ${L(p.details || []).map((d) => `<p>${esc(d)}</p>`).join("")}
          <h4>${esc(tr("pp.tech"))}</h4>
          <div class="tags">${p.tech.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
          ${p.link ? `<h4>${esc(tr("pp.source"))}</h4><p><a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.link)} ↗</a></p>` : ""}`,
      },
    ];
    for (const f of p.files || []) tabs.push({
      id: fileId(f), label: fileName(f), file: f,
      html: fileCache[fileKey(f)] ?? `<p class="pp-meta">loading ${esc(fileName(f))} …</p>`,
    });
    if (ref) tabs.push({
      id: "report", label: "Referanserapport.md",
      html: `
        <p class="pp-meta">${esc(tr("pp.from"))}: <b>${esc(ref.from)}</b>${ref.language ? ` · ${esc(tr("pp.language"))}: ${esc(ref.language)}` : ""}${exp ? ` · ${esc(L(exp.title))} @ ${esc(exp.place)} [${esc(L(exp.period))}]` : ""}</p>
        ${ref.sections.map((s) => `${s.heading ? `<h4>${esc(s.heading)}</h4>` : ""}${s.text.split("\n").map((t) => `<p>${esc(t)}</p>`).join("")}`).join("")}`,
    });

    root.innerHTML = `
      <h2><span class="num">&gt;</span> ${esc(p.name)}</h2>
      <div class="pp-info">
        ${p.period ? `<span>[${esc(L(p.period))}]</span>` : ""}
        ${exp ? `<span>@ ${esc(exp.place)}</span>` : ""}
        ${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">github ↗</a>` : ""}
      </div>
      <div class="code-card pp-window">
        <div class="win-bar pp-tabbar">
          <i></i><i></i><i></i>
          <div class="pp-tabs" role="tablist" aria-label="${esc(tr("pp.files"))}">
            ${tabs.map((t) => `<button role="tab" id="tab-${t.id}" aria-controls="panel-${t.id}" data-tab="${t.id}">${esc(t.label)}</button>`).join("")}
          </div>
        </div>
        ${tabs.map((t) => `<div class="pp-panel${t.file ? " md" : ""}" role="tabpanel" id="panel-${t.id}" aria-labelledby="tab-${t.id}" tabindex="0" hidden>${t.html}</div>`).join("")}
      </div>`;

    const buttons = [...root.querySelectorAll("[role=tab]")];
    function select(id, focus = false) {
      if (!tabs.some((t) => t.id === id)) id = tabs[0].id;
      for (const b of buttons) {
        const on = b.dataset.tab === id;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      }
      for (const t of tabs) $(`#panel-${t.id}`).hidden = t.id !== id;
      history.replaceState(null, "", id === tabs[0].id ? location.pathname + location.search : `#${id}`);
    }
    root.querySelector(".pp-tabs").addEventListener("click", (e) => {
      const b = e.target.closest("[role=tab]");
      if (b) select(b.dataset.tab);
    });
    root.querySelector(".pp-tabs").addEventListener("keydown", (e) => {
      const i = buttons.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === "ArrowRight") select(buttons[(i + 1) % buttons.length].dataset.tab, true);
      if (e.key === "ArrowLeft") select(buttons[(i - 1 + buttons.length) % buttons.length].dataset.tab, true);
    });
    select(tab);

    // fill in file tabs once they're loaded
    for (const t of tabs.filter((t) => t.file && !fileCache[fileKey(t.file)])) {
      const key = fileKey(t.file);
      renderFile(t.file)
        .then((html) => {
          if (fileKey(t.file) !== key) return; // language changed while loading
          const panel = $(`#panel-${t.id}`);
          if (panel) panel.innerHTML = html;
        })
        .catch((e) => {
          const panel = $(`#panel-${t.id}`);
          if (panel) panel.innerHTML = `<pre class="album-error">cat: ${esc(filePath(t.file))}: ${esc(e.message)}${location.protocol === "file:" ? "\n(serve the site over http to load files)" : ""}</pre>`;
        });
    }
  }
  render(location.hash.slice(1));
  window.I18N.onChange(() => {
    document.querySelectorAll("[data-bind]").forEach((el) => (el.textContent = L(C[el.dataset.bind])));
    render(root.querySelector("[role=tab][aria-selected=true]")?.dataset.tab);
  });
})();
