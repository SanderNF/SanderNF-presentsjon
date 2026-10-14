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
        ${tabs.map((t) => `<div class="pp-panel" role="tabpanel" id="panel-${t.id}" aria-labelledby="tab-${t.id}" tabindex="0" hidden>${t.html}</div>`).join("")}
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
  }
  render(location.hash.slice(1));
  window.I18N.onChange(() => {
    document.querySelectorAll("[data-bind]").forEach((el) => (el.textContent = L(C[el.dataset.bind])));
    render(root.querySelector("[role=tab][aria-selected=true]")?.dataset.tab);
  });
})();
