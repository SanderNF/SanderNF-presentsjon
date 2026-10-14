// Languages: English, Norwegian, and 1337 (generated from English).
// UI text lives in STRINGS below; personal content uses { en, no } values in config.js.
// Terminal commands and embedded files (album.json, the reference letter, …) stay in their source language.
window.I18N = (() => {
  // [code, short label, name shown in the dropdown]
  const LANGS = [["en", "EN", "English"], ["no", "NO", "Norsk"], ["leet", "1337", "1337 (h4x0r)"]];
  const KEY = "snf-lang";

  const STRINGS = {
    en: {
      "nav.about": "about", "nav.skills": "skills", "nav.projects": "projects", "nav.experience": "experience",
      "nav.terminal": "terminal", "nav.contact": "contact", "nav.album": "album",
      "nav.open": "Open menu", "nav.close": "Close menu", "lang.label": "Language",
      "h.about": "about_me", "h.skills": "tech_stack", "h.projects": "projects", "h.experience": "experience.log",
      "h.terminal": "interactive_shell", "h.contact": "establish_connection",
      "hero.projects": "./view_projects", "hero.contact": "./contact_me", "hero.status": "system online — available for work",
      "about.comment": "// who am i?",
      "contact.text": "My inbox is always open. Whether you have a question, a project or just want to say hi — ping me.",
      "contact.btn": "> send_message()",
      "footer": "built with <3 on Arch Linux (btw)",
      "link.view": "View {name} on {site}",
      "skill.languages": "languages", "skill.tools": "tools", "skill.data & ai": "data & ai",
      // album
      "album.all": "all", "album.count.one": "{n} item", "album.count": "{n} items", "album.untitled": "Photo album",
      "meta.date": "date", "meta.location": "location", "meta.camera": "camera", "meta.lens": "lens", "meta.focal": "focal",
      "meta.aperture": "aperture", "meta.shutter": "shutter", "meta.iso": "iso",
      "lb.close": "Close", "lb.prev": "Previous photo", "lb.next": "Next photo", "lb.viewer": "Photo viewer",
      "zoom.in": "Zoom in", "zoom.out": "Zoom out", "zoom.reset": "Reset zoom", "album.filter": "Filter by tag",
      // project page
      "pp.tech": "## tech", "pp.source": "## source", "pp.from": "from", "pp.language": "language", "pp.files": "Project files",
    },
    no: {
      "nav.about": "om meg", "nav.skills": "ferdigheter", "nav.projects": "prosjekter", "nav.experience": "erfaring",
      "nav.terminal": "terminal", "nav.contact": "kontakt", "nav.album": "album",
      "nav.open": "Åpne meny", "nav.close": "Lukk meny", "lang.label": "Språk",
      "h.about": "om_meg", "h.skills": "teknologi", "h.projects": "prosjekter", "h.experience": "erfaring.log",
      "h.terminal": "interaktivt_skall", "h.contact": "opprett_forbindelse",
      "hero.projects": "./se_prosjekter", "hero.contact": "./kontakt_meg", "hero.status": "system online — tilgjengelig for jobb",
      "about.comment": "// hvem er jeg?",
      "contact.text": "Innboksen min er alltid åpen. Enten du har et spørsmål, et prosjekt eller bare vil si hei — send meg en melding.",
      "contact.btn": "> send_melding()",
      "footer": "laget med <3 på Arch Linux (btw)",
      "link.view": "Se {name} på {site}",
      "skill.languages": "språk", "skill.tools": "verktøy", "skill.data & ai": "data & KI",
      "album.all": "alle", "album.count.one": "{n} bilde", "album.count": "{n} bilder", "album.untitled": "Fotoalbum",
      "meta.date": "dato", "meta.location": "sted", "meta.camera": "kamera", "meta.lens": "objektiv", "meta.focal": "brennvidde",
      "meta.aperture": "blender", "meta.shutter": "lukker", "meta.iso": "iso",
      "lb.close": "Lukk", "lb.prev": "Forrige bilde", "lb.next": "Neste bilde", "lb.viewer": "Bildevisning",
      "zoom.in": "Zoom inn", "zoom.out": "Zoom ut", "zoom.reset": "Tilbakestill zoom", "album.filter": "Filtrer etter tagg",
      "pp.tech": "## teknologi", "pp.source": "## kildekode", "pp.from": "fra", "pp.language": "språk", "pp.files": "Prosjektfiler",
    },
  };

  const LEET = { a: "4", e: "3", i: "1", o: "0", s: "5", t: "7", g: "9", b: "8" };
  const leet = (s) => String(s).replace(/[aeiostgb]/gi, (c) => LEET[c.toLowerCase()]);

  let lang;
  try { lang = localStorage.getItem(KEY); } catch {}
  if (!LANGS.some(([k]) => k === lang)) lang = /^(nb|nn|no)\b/i.test(navigator.language || "") ? "no" : "en";
  const base = () => (lang === "no" ? "no" : "en");

  // UI string by key, with {var} substitution; falls back to English, then to `fallback`/the key
  function t(key, vars = {}, fallback) {
    let s = STRINGS[base()][key] ?? STRINGS.en[key] ?? fallback ?? key;
    if (lang === "leet") s = s.split(/(\{\w+\})/).map((part, i) => (i % 2 ? part : leet(part))).join(""); // keep {placeholders}
    return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  }
  const isPair = (v) => v && typeof v === "object" && !Array.isArray(v) && ("en" in v || "no" in v);
  // a config value in the current language (strings, { en, no } pairs and arrays of either).
  // Plain strings (names, numbers, …) are the same in every language, 1337 included.
  function L(v) {
    if (Array.isArray(v)) return v.map(L);
    if (!isPair(v)) return v;
    v = v[base()] ?? v.en;
    return lang === "leet" && typeof v === "string" ? leet(v) : v;
  }
  // a config value in English, for places that always stay English (the terminal)
  const en = (v) => (Array.isArray(v) ? v.map(en) : isPair(v) ? v.en ?? v.no : v);

  const listeners = [];
  function apply() {
    document.documentElement.lang = lang === "no" ? "nb" : "en";
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    document.querySelectorAll(".lang-row button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    document.querySelectorAll(".lang-menu [role=menuitemradio]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.lang === lang)));
    document.querySelectorAll(".lang-current").forEach((el) => (el.textContent = LANGS.find(([k]) => k === lang)[1]));
  }
  function set(next) {
    if (!LANGS.some(([k]) => k === next) || next === lang) return false;
    lang = next;
    try { localStorage.setItem(KEY, lang); } catch {}
    apply();
    listeners.forEach((fn) => fn(lang));
    return true;
  }

  // language picker: a globe dropdown in the top bar, and a row of buttons inside the hamburger menu
  const GLOBE = '<svg viewBox="0 -960 960 960" aria-hidden="true"><path fill="currentColor" d="M325-111.5q-73-31.5-127.5-86t-86-127.5Q80-398 80-480.5t31.5-155q31.5-72.5 86-127t127.5-86Q398-880 480.5-880t155 31.5q72.5 31.5 127 86t86 127Q880-563 880-480.5T848.5-325q-31.5 73-86 127.5t-127 86Q563-80 480.5-80T325-111.5ZM480-162q26-36 45-75t31-83H404q12 44 31 83t45 75Zm-104-16q-18-33-31.5-68.5T322-320H204q29 50 72.5 87t99.5 55Zm208 0q56-18 99.5-55t72.5-87H638q-9 38-22.5 73.5T584-178ZM170-400h136q-3-20-4.5-39.5T300-480q0-21 1.5-40.5T306-560H170q-5 20-7.5 39.5T160-480q0 21 2.5 40.5T170-400Zm216 0h188q3-20 4.5-39.5T580-480q0-21-1.5-40.5T574-560H386q-3 20-4.5 39.5T380-480q0 21 1.5 40.5T386-400Zm268 0h136q5-20 7.5-39.5T800-480q0-21-2.5-40.5T790-560H654q3 20 4.5 39.5T660-480q0 21-1.5 40.5T654-400Zm-16-240h118q-29-50-72.5-87T584-782q18 33 31.5 68.5T638-640Zm-234 0h152q-12-44-31-83t-45-75q-26 36-45 75t-31 83Zm-200 0h118q9-38 22.5-73.5T376-782q-56 18-99.5 55T204-640Z"/></svg>';
  const header = document.querySelector("header.nav");
  if (header && !header.querySelector(".lang-menu")) {
    const menu = document.createElement("div");
    menu.className = "lang-menu";
    menu.innerHTML = `
      <button type="button" class="lang-btn" aria-haspopup="menu" aria-expanded="false" data-i18n-aria="lang.label">${GLOBE}<span class="lang-current"></span></button>
      <div class="lang-list" role="menu" hidden>
        ${LANGS.map(([k, short, name]) => `<button type="button" role="menuitemradio" data-lang="${k}" aria-checked="false"><span class="lang-code">${short}</span>${name}</button>`).join("")}
      </div>`;
    const btn = menu.querySelector(".lang-btn"), list = menu.querySelector(".lang-list");
    const items = () => [...list.querySelectorAll("[role=menuitemradio]")];
    const toggle = (open, focus) => {
      list.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (open && focus) (items().find((b) => b.dataset.lang === lang) || items()[0]).focus();
    };
    btn.addEventListener("click", () => toggle(list.hidden, true));
    list.addEventListener("click", (e) => {
      const b = e.target.closest("[data-lang]");
      if (!b) return;
      set(b.dataset.lang);
      toggle(false); btn.focus();
    });
    menu.addEventListener("keydown", (e) => {
      if (list.hidden) return;
      const all = items(), i = all.indexOf(document.activeElement);
      if (e.key === "Escape") { toggle(false); btn.focus(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); all[(i + 1) % all.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); all[(i - 1 + all.length) % all.length].focus(); }
    });
    document.addEventListener("click", (e) => { if (!menu.contains(e.target)) toggle(false); });
    header.insertBefore(menu, header.querySelector(".nav-toggle"));

    // inside the hamburger menu: plain buttons
    const nav = header.querySelector("nav");
    if (nav) {
      const row = document.createElement("div");
      row.className = "lang-row";
      row.setAttribute("role", "group");
      row.dataset.i18nAria = "lang.label";
      row.innerHTML = GLOBE + LANGS.map(([k, short]) => `<button type="button" data-lang="${k}" aria-pressed="false">${short}</button>`).join("");
      row.addEventListener("click", (e) => { const b = e.target.closest("button[data-lang]"); if (b) set(b.dataset.lang); });
      nav.appendChild(row);
    }
  }
  apply();

  return {
    t, L, en, set, leet,
    get lang() { return lang; },
    langs: LANGS.map(([k]) => k),
    locale: () => (base() === "no" ? "nb-NO" : "en-GB"),
    onChange: (fn) => listeners.push(fn),
  };
})();
