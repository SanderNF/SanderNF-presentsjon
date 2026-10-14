(() => {
  const C = window.SITE_CONFIG;
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { t, L } = window.I18N;

  // ---------- name heading in flag colours (switch with `hyfetch -c` in the terminal) ----------
  // one span per letter, so each letter gets the flag stripes spread over its own height
  const glyphType = (ch) => (/[gjpqy]/.test(ch) ? "desc" : /[bdfhklt]/.test(ch) ? "tall" : /[a-z]/.test(ch) ? "x" : "cap");
  const heading = $(".glitch");
  heading.innerHTML = [...C.name].map((ch) => `<span data-g="${glyphType(ch)}">${esc(ch)}</span>`).join("");
  heading.setAttribute("aria-label", C.name);
  heading.dataset.text = C.name;

  // flag colours from hyfetch's presets (github.com/hykilpikonna/hyfetch). classic is the default.
  // `glitch` = the two colours that flash when the heading glitches (picked automatically if left out)
  const FLAGS = {
    classic: { label: "classic (pink · white · teal)", colors: ["#ff2bd6", "#ffffff", "#00d4ff"], glitch: ["#ff2bd6", "#00d4ff"], classic: true },
    norway: { label: "Norway", colors: ["#ba0c2f", "#ffffff", "#00205b"], glitch: ["#ba0c2f", "#2f5fd0"] },
    rainbow: { label: "rainbow", colors: ["#E50000", "#FF8D00", "#FFEE00", "#028121", "#004CFF", "#770088"] },
    progress: { label: "progress pride", colors: ["#FFFFFF", "#FFAFC8", "#74D7EE", "#613915", "#000000", "#E50000", "#FF8D00", "#FFEE00", "#028121", "#004CFF", "#770088"] },
    transgender: { label: "trans", colors: ["#55CDFD", "#F6AAB7", "#FFFFFF", "#F6AAB7", "#55CDFD"] },
    nonbinary: { label: "non-binary", colors: ["#FCF431", "#FCFCFC", "#9D59D2", "#282828"] },
    lesbian: { label: "lesbian", colors: ["#D62800", "#FF9B56", "#FFFFFF", "#D462A6", "#A40062"] },
    transbian: { label: "transbian", colors: ["#03A3E6", "#F8B4CD", "#FAFBF9", "#FA9C57", "#A80864"] },
    "gay-men": { label: "gay men / mlm", colors: ["#078D70", "#98E8C1", "#FFFFFF", "#7BADE2", "#3D1A78"] },
    bisexual: { label: "bi", colors: ["#D60270", "#9B4F96", "#0038A8"] },
    pansexual: { label: "pan", colors: ["#FF1C8D", "#FFD700", "#1AB3FF"] },
    polysexual: { label: "poly", colors: ["#F714BA", "#01D66A", "#1594F6"] },
    omnisexual: { label: "omni", colors: ["#FE9ACE", "#FF53BF", "#200044", "#6760FE", "#8EA6FF"] },
    asexual: { label: "ace", colors: ["#000000", "#A4A4A4", "#FFFFFF", "#810081"] },
    demisexual: { label: "demi", colors: ["#000000", "#000000", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#6F0071", "#D3D3D3", "#D3D3D3", "#D3D3D3"] },
    aromantic: { label: "aro", colors: ["#3BA740", "#A8D47A", "#FFFFFF", "#ABABAB", "#000000"] },
    aroace: { label: "aroace", colors: ["#E28C00", "#ECCD00", "#FFFFFF", "#62AEDC", "#203856"] },
    genderqueer: { label: "genderqueer", colors: ["#B57EDC", "#B57EDC", "#FFFFFF", "#FFFFFF", "#4A8123", "#4A8123"] },
    genderfluid: { label: "genderfluid", colors: ["#FE76A2", "#FFFFFF", "#BF12D7", "#000000", "#303CBE"] },
    agender: { label: "agender", colors: ["#000000", "#BABABA", "#FFFFFF", "#BAF484", "#FFFFFF", "#BABABA", "#000000"] },
    bigender: { label: "bigender", colors: ["#C479A2", "#EDA5CD", "#D6C7E8", "#FFFFFF", "#D6C7E8", "#9AC7E8", "#6D82D1"] },
    transfeminine: { label: "transfeminine", colors: ["#73DEFF", "#FFE2EE", "#FFB5D6", "#FF8DC0", "#FFB5D6", "#FFE2EE", "#73DEFF"] },
    transmasculine: { label: "transmasculine", colors: ["#FF8ABD", "#CDF5FE", "#9AEBFF", "#74DFFF", "#9AEBFF", "#CDF5FE", "#FF8ABD"] },
    demigirl: { label: "demigirl", colors: ["#7F7F7F", "#C4C4C4", "#FDADC8", "#FFFFFF", "#FDADC8", "#C4C4C4", "#7F7F7F"] },
    demiboy: { label: "demiboy", colors: ["#7F7F7F", "#C4C4C4", "#9DD7EA", "#FFFFFF", "#9DD7EA", "#C4C4C4", "#7F7F7F"] },
    intersex: { label: "intersex", colors: ["#FFD800", "#FFD800", "#7902AA", "#FFD800", "#FFD800"] },
    queer: { label: "queer", colors: ["#B57FDD", "#FFFFFF", "#49821E"] },
    sapphic: { label: "sapphic", colors: ["#FD8BA8", "#FBF2FF", "#C76BC5", "#FDD768", "#C76BC5", "#FBF2FF", "#FD8BA8"] },
  };
  // glitch flash colours when a flag doesn't set them: its first colour that isn't near-black or
  // near-white, plus whichever of the others is most different from it
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  for (const f of Object.values(FLAGS)) {
    if (f.glitch) continue;
    const usable = f.colors.filter((c) => { const v = rgb(c); return Math.max(...v) > 80 && Math.min(...v) < 235; });
    const pool = usable.length ? usable : f.colors;
    const first = pool[0], a = rgb(first);
    const dist = (c) => rgb(c).reduce((sum, v, i) => sum + (v - a[i]) ** 2, 0);
    f.glitch = [first, pool.reduce((best, c) => (dist(c) > dist(best) ? c : best), first)];
  }
  // where each kind of letter sits in the line box (measured for Orbitron, % of line height)
  const GLYPH_RANGE = { cap: [16.9, 86.8], tall: [12.7, 86.8], x: [30.7, 86.8], desc: [30.7, 100.5] };
  function stripes(colors, [top, bottom]) {
    const step = (bottom - top) / colors.length;
    const at = (i) => `${(top + step * i).toFixed(1)}%`;
    return `linear-gradient(to bottom, ${colors.map((c, i) => `${c} ${i ? at(i) : "0"} ${i === colors.length - 1 ? "100%" : at(i + 1)}`).join(", ")})`;
  }
  function applyFlag(name) {
    const flag = FLAGS[name] || FLAGS.nonbinary;
    heading.classList.toggle("classic", !!flag.classic);
    heading.style.setProperty("--glitch-a", flag.glitch[0]);
    heading.style.setProperty("--glitch-b", flag.glitch[1]);
    for (const span of heading.children) span.style.backgroundImage = flag.classic ? "" : stripes(flag.colors, GLYPH_RANGE[span.dataset.g]);
  }
  const FLAG_ALIASES = {
    nb: "nonbinary", enby: "nonbinary", "non-binary": "nonbinary", no: "norway", norge: "norway",
    pride: "rainbow", lgbt: "rainbow", trans: "transgender", gay: "gay-men", mlm: "gay-men", "gay-male": "gay-men",
    wlw: "lesbian", bi: "bisexual", pan: "pansexual", poly: "polysexual", omni: "omnisexual", ace: "asexual",
    demi: "demisexual", aro: "aromantic", transfem: "transfeminine", transmasc: "transmasculine",
    original: "classic", default: "classic",
  };
  // a preset name, a shortcut, or its number in the `hyfetch -c` list (1 = classic, 2 = norway, …)
  const resolveFlag = (v) => {
    const k = String(v ?? "").trim().toLowerCase();
    if (/^\d+$/.test(k)) return Object.keys(FLAGS)[+k - 1] || null;
    const name = FLAG_ALIASES[k] || k;
    return FLAGS[name] ? name : null;
  };
  // Which flag to show, in order:
  //   1. a choice made with `hyfetch -c` / `-p`: saved in localStorage, only in that browser
  //   2. a link option, ?flag=<preset> or just ?nb: kept for this visit (sessionStorage) so moving
  //      between pages keeps it, but never saved, so a plain link always looks classic
  //   3. classic
  const params = new URLSearchParams(location.search);
  let linkFlag = resolveFlag(params.get("flag")) || (params.has("nb") ? "nonbinary" : null);
  try {
    if (linkFlag) sessionStorage.setItem("snf-flag-link", linkFlag);
    else linkFlag = resolveFlag(sessionStorage.getItem("snf-flag-link"));
  } catch {}
  let savedFlag = null;
  try { savedFlag = resolveFlag(localStorage.getItem("snf-flag")); } catch {}
  let flagName = savedFlag || linkFlag || "classic";
  applyFlag(flagName);
  window.SNF_FLAG = {
    presets: FLAGS,
    aliases: FLAG_ALIASES,
    resolve: resolveFlag,
    get current() { return flagName; },
    get source() { return savedFlag ? "saved" : linkFlag ? "link" : "default"; },
    set(name) {
      name = resolveFlag(name);
      if (!name) return false;
      flagName = savedFlag = name;
      try { localStorage.setItem("snf-flag", name); } catch {}
      applyFlag(name);
      return true;
    },
    // forget the saved choice: back to the link's flag, or classic
    reset() {
      savedFlag = null;
      try { localStorage.removeItem("snf-flag"); } catch {}
      flagName = linkFlag || "classic";
      applyFlag(flagName);
      return flagName;
    },
  };
  $("#year").textContent = new Date().getFullYear();

  // ---------- boot sequence ----------
  const bootLines = ["initializing portfolio.sys ...", "loading modules ......... [OK]", "establishing uplink ..... [OK]"];
  const boot = $("#boot");
  bootLines.forEach((line, i) =>
    setTimeout(() => {
      boot.innerHTML += esc(line).replace("[OK]", '<span class="ok">[OK]</span>') + "\n";
    }, reducedMotion ? 0 : i * 350)
  );

  // ---------- typing effect ----------
  const typed = $("#typed");
  let li = 0, ci = 0, deleting = false;
  function type() {
    const taglines = L(C.taglines);
    li %= taglines.length;
    const line = taglines[li];
    ci = Math.min(ci, line.length);
    typed.textContent = line.slice(0, ci);
    if (!deleting && ci < line.length) ci++;
    else if (!deleting) { deleting = true; return setTimeout(type, 1800); }
    else if (ci > 0) ci--;
    else { deleting = false; li = (li + 1) % taglines.length; }
    setTimeout(type, deleting ? 35 : 70);
  }
  if (reducedMotion) typed.textContent = L(C.taglines)[0];
  else setTimeout(type, 1200);
  // show the new language's tagline right away instead of after the current one finishes
  window.I18N.onChange(() => {
    const taglines = L(C.taglines);
    li %= taglines.length;
    typed.textContent = reducedMotion ? taglines[0] : taglines[li].slice(0, Math.min(ci, taglines[li].length));
  });

  // ---------- content (re-rendered when the language changes) ----------
  function render() {
    document.querySelectorAll("[data-bind]").forEach((el) => (el.textContent = L(C[el.dataset.bind])));
    document.title = `${C.name} — ${L(C.role)}`;

    // ---------- about ----------
    const s = (v) => `<span class="tk-s">"${esc(v)}"</span>`;
    $("#about-code").innerHTML =
      `<span class="tk-c">${esc(t("about.comment"))}</span>\n` +
      `<span class="tk-k">const</span> <span class="tk-p">developer</span> = {\n` +
      `  name: ${s(C.name)},\n` +
      `  role: ${s(L(C.role))},\n` +
      `  location: ${s(L(C.location))},\n` +
      `  stack: [${C.skills.languages.slice(0, 3).map(s).join(", ")}],\n` +
      `  available: <span class="tk-k">true</span>,\n` +
      `};`;
    $("#about-text").innerHTML = L(C.about).map((p) => `<p>${esc(p)}</p>`).join("");
    $("#stats").innerHTML = C.stats.map((x) => `<div class="stat"><b>${esc(L(x.value))}</b><span>${esc(L(x.label))}</span></div>`).join("");

    // ---------- skills ----------
    $("#skills-grid").innerHTML = Object.entries(C.skills)
      .map(([group, items]) => `<div class="skill-group"><h3>// ${esc(t("skill." + group, {}, L(group)))}</h3><ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`)
      .join("");

    // ---------- projects ----------
    // the card's link button shows the icon of the site it points to
    const ICONS = { "github.com": ["GitHub", window.SNF_ICONS.github] };
    function linkButton(p) {
      let host = "";
      try { host = new URL(p.link).hostname.replace(/^www\./, ""); } catch {}
      const [site, svg] = ICONS[host] || [host || "link", null];
      // unknown sites: use their own favicon, falling back to ↗ if it can't load
      const icon = svg || `<img src="https://${esc(host)}/favicon.ico" alt="" width="20" height="20" loading="lazy" onerror="this.replaceWith('↗')" />`;
      return `<a class="ext" href="${esc(p.link)}" target="_blank" rel="noopener" aria-label="${esc(t("link.view", { name: p.name, site }))}" title="${esc(site)}">${icon}</a>`;
    }
    $("#projects-grid").innerHTML = C.projects
      .map((p) => `
        <article class="project">
          <div class="top"><span>&lt;/&gt;</span>${p.link ? linkButton(p) : ""}</div>
          <h3><a class="open" href="project.html?p=${encodeURIComponent(p.name)}">${esc(p.name)}</a></h3>
          <p>${esc(L(p.description))}</p>
          <div class="tags">${p.tech.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
          <span class="more">./open --details${p.report ? " --report" : ""} →</span>
        </article>`)
      .join("");

    // ---------- experience ----------
    // optional reference letter, shown as an expandable box
    const reference = (r) => !r ? "" : `
      <details class="reference">
        <summary>./reference --from "${esc(r.from)}"${r.language ? ` <span class="ref-lang">[${esc(r.language)}]</span>` : ""}</summary>
        <div class="ref-body">${r.sections.map((s) => `${s.heading ? `<h4>${esc(s.heading)}</h4>` : ""}${s.text.split("\n").map((t) => `<p>${esc(t)}</p>`).join("")}`).join("")}</div>
      </details>`;
    $("#timeline").innerHTML = C.experience
      .map((e) => `<li><div class="period">[${esc(L(e.period))}]</div><h3>${esc(L(e.title))}</h3><div class="place">@ ${esc(e.place)}</div><p>${esc(L(e.text))}</p>${reference(e.reference)}</li>`)
      .join("");

    // ---------- contact ----------
    $("#email-btn").href = `mailto:${C.contact.email}`;
    $("#links").innerHTML = Object.entries(C.contact)
      .map(([k, v]) => `<a href="${esc(k === "email" ? "mailto:" + v : v)}" target="_blank" rel="noopener">${esc(k)}</a>`)
      .join("");
  }
  render();
  window.I18N.onChange(render);

  // ---------- scroll reveal ----------
  const io = new IntersectionObserver((entries) =>
    entries.forEach((en) => en.isIntersecting && en.target.classList.add("visible")), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

})();
