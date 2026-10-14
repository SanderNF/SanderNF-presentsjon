(() => {
  const C = window.SITE_CONFIG;
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- bind simple fields ----------
  document.querySelectorAll("[data-bind]").forEach((el) => (el.textContent = C[el.dataset.bind]));
  $(".glitch").dataset.text = C.name;
  document.title = `${C.name} — ${C.role}`;
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
    const line = C.taglines[li];
    typed.textContent = line.slice(0, ci);
    if (!deleting && ci < line.length) ci++;
    else if (!deleting) { deleting = true; return setTimeout(type, 1800); }
    else if (ci > 0) ci--;
    else { deleting = false; li = (li + 1) % C.taglines.length; }
    setTimeout(type, deleting ? 35 : 70);
  }
  if (reducedMotion) typed.textContent = C.taglines[0];
  else setTimeout(type, 1200);

  // ---------- about ----------
  const s = (v) => `<span class="tk-s">"${esc(v)}"</span>`;
  $("#about-code").innerHTML =
    `<span class="tk-c">// who am i?</span>\n` +
    `<span class="tk-k">const</span> <span class="tk-p">developer</span> = {\n` +
    `  name: ${s(C.name)},\n` +
    `  role: ${s(C.role)},\n` +
    `  location: ${s(C.location)},\n` +
    `  stack: [${C.skills.languages.slice(0, 3).map(s).join(", ")}],\n` +
    `  available: <span class="tk-k">true</span>,\n` +
    `};`;
  $("#about-text").innerHTML = C.about.map((p) => `<p>${esc(p)}</p>`).join("");
  $("#stats").innerHTML = C.stats.map((x) => `<div class="stat"><b>${esc(x.value)}</b><span>${esc(x.label)}</span></div>`).join("");

  // ---------- skills ----------
  $("#skills-grid").innerHTML = Object.entries(C.skills)
    .map(([group, items]) => `<div class="skill-group"><h3>// ${esc(group)}</h3><ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`)
    .join("");

  // ---------- projects ----------
  $("#projects-grid").innerHTML = C.projects
    .map((p) => `
      <article class="project">
        <div class="top"><span>&lt;/&gt;</span><a href="${esc(p.link)}" target="_blank" rel="noopener" aria-label="Open ${esc(p.name)}">↗</a></div>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.description)}</p>
        <div class="tags">${p.tech.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      </article>`)
    .join("");

  // ---------- experience ----------
  $("#timeline").innerHTML = C.experience
    .map((e) => `<li><div class="period">[${esc(e.period)}]</div><h3>${esc(e.title)}</h3><div class="place">@ ${esc(e.place)}</div><p>${esc(e.text)}</p></li>`)
    .join("");

  // ---------- contact ----------
  $("#email-btn").href = `mailto:${C.contact.email}`;
  $("#links").innerHTML = Object.entries(C.contact)
    .map(([k, v]) => `<a href="${esc(k === "email" ? "mailto:" + v : v)}" target="_blank" rel="noopener">${esc(k)}</a>`)
    .join("");

  // ---------- interactive terminal ----------
  const out = $("#term-out"), input = $("#term-input"), body = $("#term-body");
  const print = (html) => { out.insertAdjacentHTML("beforeend", `<div>${html}</div>`); body.scrollTop = body.scrollHeight; };
  const commands = {
    help: () => "available commands:\n" +
      ["about", "skills", "projects", "experience", "contact", "album", "whoami", "date", "clear", "sudo"]
        .map((c) => `  <span class="t-hl">${c}</span>`).join("\n"),
    about: () => C.about.map(esc).join("\n\n"),
    whoami: () => `${esc(C.name)} — ${esc(C.role)}`,
    skills: () => Object.entries(C.skills).map(([g, i]) => `<span class="t-hl">${esc(g)}</span>: ${i.map(esc).join(", ")}`).join("\n"),
    projects: () => C.projects.map((p) => `<span class="t-hl">${esc(p.name)}</span> — ${esc(p.description)}\n  <a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.link)}</a>`).join("\n"),
    experience: () => C.experience.map((e) => `[${esc(e.period)}] <span class="t-hl">${esc(e.title)}</span> @ ${esc(e.place)}`).join("\n"),
    contact: () => Object.entries(C.contact).map(([k, v]) => `${esc(k)}: <a href="${esc(k === "email" ? "mailto:" + v : v)}" target="_blank" rel="noopener">${esc(v)}</a>`).join("\n"),
    album: () => { setTimeout(() => (location.href = "album.html"), 600); return `opening <a href="album.html">album.html</a> ...`; },
    date: () => new Date().toString(),
    sudo: () => `<span class="t-err">permission denied: nice try 😉</span>`,
    clear: () => { out.innerHTML = ""; return null; },
  };
  const history = [];
  let hIdx = 0;
  print(`welcome to ${esc(C.handle)}.sh — type <span class="t-hl">help</span> to get started.`);
  $("#term-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const cmd = input.value.trim();
    input.value = "";
    if (!cmd) return;
    history.push(cmd); hIdx = history.length;
    print(`<span class="prompt">guest@${esc(C.handle)}:~$</span> <span class="t-cmd">${esc(cmd)}</span>`);
    const fn = commands[cmd.toLowerCase()];
    const res = fn ? fn() : `<span class="t-err">command not found: ${esc(cmd)}</span> — try <span class="t-hl">help</span>`;
    if (res !== null) print(res);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && hIdx > 0) { input.value = history[--hIdx]; e.preventDefault(); }
    if (e.key === "ArrowDown") { hIdx = Math.min(hIdx + 1, history.length); input.value = history[hIdx] || ""; }
  });
  body.addEventListener("click", () => input.focus({ preventScroll: true }));

  // ---------- scroll reveal ----------
  const io = new IntersectionObserver((entries) =>
    entries.forEach((en) => en.isIntersecting && en.target.classList.add("visible")), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

})();
