(() => {
  const C = window.SITE_CONFIG;
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { t, L } = window.I18N;

  $(".glitch").dataset.text = C.name;
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
    const ICONS = {
      "github.com": ["GitHub", '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>'],
    };
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
