// Hamburger menu — collapses the nav when its links no longer fit on one line
(() => {
  const header = document.querySelector("header.nav");
  const logo = header.querySelector(".logo");
  const nav = header.querySelector("nav");
  const toggle = header.querySelector(".nav-toggle");

  function setOpen(open) {
    header.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  // measure the full-width layout, then collapse if the links would collide with the logo
  function fit() {
    header.classList.remove("compact");
    const cs = getComputedStyle(header);
    const room = header.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const compact = logo.offsetWidth + 32 + nav.scrollWidth > room;
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
  document.fonts?.ready.then(fit);   // web font changes link widths once it loads
  fit();
})();
