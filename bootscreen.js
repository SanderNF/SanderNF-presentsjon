// Full-screen boot sequence shown on first visit per session (and on `reboot` in the terminal)
(() => {
  const C = window.SITE_CONFIG;
  const LOGO = window.SNF_LOGO;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const LOG = [
    [":: running early hook [udev]", ""],
    ["detecting hardware", "ok"],
    ["mounting /home/guest", "ok"],
    ["loading hexgrid.ko", "ok"],
    ["loading config: " + C.handle, "ok"],
    ["starting snf.sh", "ok"],
    ["pacman: 847 packages out of date", "warn"],
    ["reached target: I use Arch, btw", "ok"],
    ["establishing uplink", "ok"],
  ];

  function boot(force = false) {
    let seen = false;
    try { seen = sessionStorage.getItem("snf-booted") === "1"; } catch {}
    if ((seen || reducedMotion) && !force) { document.documentElement.classList.remove("booting"); return Promise.resolve(); }
    try { sessionStorage.setItem("snf-booted", "1"); } catch {}

    const lines = LOGO.split("\n");
    const cols = Math.max(...lines.map((l) => l.length));
    const el = document.createElement("div");
    el.className = "bootscreen";
    el.setAttribute("role", "presentation");
    el.innerHTML = `
      <div class="bs-inner">
        <pre class="bs-logo" style="--cols:${cols}">${lines.map((l) => `<span>${esc(l) || " "}</span>`).join("\n")}</pre>
        <div class="bs-sub">${esc(C.name)} // ${esc(window.I18N ? window.I18N.L(C.role) : C.role)}</div>
        <pre class="bs-log"></pre>
        <div class="bs-hint">press any key to skip</div>
      </div>`;
    document.body.appendChild(el);
    document.documentElement.classList.remove("booting");
    document.documentElement.style.overflow = "hidden";

    let skipped = false, finished = false, resolveDone;
    const done = new Promise((r) => (resolveDone = r));
    const finish = () => {
      if (finished) return;
      finished = true;
      removeEventListener("keydown", skip, true);
      el.classList.add("bs-out");
      setTimeout(() => { el.remove(); document.documentElement.style.overflow = ""; resolveDone(); }, 600);
    };
    const skip = (e) => { if (e?.type === "keydown") e.preventDefault(); skipped = true; finish(); };
    addEventListener("keydown", skip, true);
    el.addEventListener("pointerdown", skip);

    (async () => {
      const spans = el.querySelectorAll(".bs-logo span");
      for (const s of spans) { if (skipped) return; s.classList.add("on"); await sleep(55); }
      el.querySelector(".bs-sub").classList.add("on");
      await sleep(250);
      const log = el.querySelector(".bs-log");
      for (const [text, status] of LOG) {
        if (skipped) return;
        const tag = status === "ok" ? `<span class="bs-ok">[  OK  ]</span>` : status === "warn" ? `<span class="bs-warn">[ WARN ]</span>` : `<span class="bs-dim">[ INFO ]</span>`;
        log.insertAdjacentHTML("beforeend", `${tag} ${esc(text)}\n`);
        await sleep(110 + Math.random() * 120);
      }
      log.insertAdjacentHTML("beforeend", `\n<span class="bs-ok">welcome, guest.</span><span class="bs-caret">█</span>`);
      await sleep(900);
      finish();
    })();
    return done;
  }

  window.SNF_BOOT = boot;
  boot();
})();
