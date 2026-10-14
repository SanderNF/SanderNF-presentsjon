// Hamburger menu — collapses the nav when its links no longer fit on one line
(() => {
  const header = document.querySelector("header.nav");
  const logo = header.querySelector(".logo");
  const nav = header.querySelector("nav");
  const toggle = header.querySelector(".nav-toggle");

  function setOpen(open) {
    header.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    const label = open ? "nav.close" : "nav.open";
    toggle.dataset.i18nAria = label;
    toggle.setAttribute("aria-label", window.I18N ? window.I18N.t(label) : open ? "Close menu" : "Open menu");
  }

  // measure the full-width layout, then collapse if the links would collide with the logo
  function fit() {
    header.classList.remove("compact");
    const cs = getComputedStyle(header);
    const room = header.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const langMenu = header.querySelector(".lang-menu");
    const compact = logo.offsetWidth + 32 + nav.scrollWidth + (langMenu ? langMenu.offsetWidth + 16 : 0) > room;
    header.classList.toggle("compact", compact);
    if (!compact) setOpen(false);
  }

  toggle.addEventListener("click", () => setOpen(!header.classList.contains("open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("click", (e) => { if (!header.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("open")) { setOpen(false); toggle.focus(); }
  });

  new ResizeObserver(fit).observe(header);
  window.I18N?.onChange(fit);   // translated labels change the menu's width
  document.fonts?.ready.then(fit);   // web font changes link widths once it loads
  fit();
})();
