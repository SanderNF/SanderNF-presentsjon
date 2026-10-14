// Interactive terminal: a small fake filesystem with ls / cd / cat / grep (+ pipes),
// photo search over album/album.json, and easter eggs for the curious.
(() => {
  const C = window.SITE_CONFIG;
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const HOST = C.handle;
  const I18N = window.I18N;
  const E = I18N.en; // the terminal and its files stay in English

  // output lines are { text, html } so pipes can work on plain text
  const T = (text, cls) => ({ text, html: cls ? `<span class="${cls}">${esc(text)}</span>` : esc(text) });
  const H = (html, text) => ({ html, text: text ?? html.replace(/<[^>]+>/g, "") });
  const err = (text) => T(text, "t-err");
  const lines = (s, cls) => String(s).split("\n").map((l) => T(l, cls));

  // ---------- virtual filesystem ----------
  const dir = (children = {}, extra = {}) => ({ type: "dir", children, ...extra });
  const file = (content, extra = {}) => ({ type: "file", content, ...extra });
  const read = (node) => (typeof node.content === "function" ? node.content() : node.content);

  const projectFiles = Object.fromEntries(C.projects.map((p) => [`${p.name}.md`, file(
    `# ${p.name}\n\n${E(p.description)}\n\n${E(p.details || []).join("\n\n")}\n\ntech: ${p.tech.join(", ")}` + (p.link ? `\nlink: ${p.link}` : ""),
    { project: p.name },
  )]));
  const refFiles = Object.fromEntries(C.experience.filter((e) => e.reference).map((e) => [
    `${e.place.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`,
    file(`from: ${e.reference.from}\n\n` + e.reference.sections.map((s) => (s.heading ? `## ${s.heading}\n` : "") + s.text).join("\n\n")),
  ]));

  const home = dir({
    "about.txt": file(E(C.about).join("\n\n")),
    "skills.txt": file(Object.entries(C.skills).map(([g, i]) => `${g}: ${i.join(", ")}`).join("\n")),
    "contact.txt": file(Object.entries(C.contact).map(([k, v]) => `${k}: ${v}`).join("\n")),
    "experience.log": file(C.experience.map((e) => `[${E(e.period)}] ${E(e.title)} @ ${e.place}\n  ${E(e.text)}`).join("\n")),
    projects: dir(projectFiles),
    references: dir(refFiles),
    album: dir({ "album.json": file("loading…"), photos: dir() }),
    ".env": file([
      "# congratulations, you found the secrets 🕵️",
      "DATABASE_URL=postgres://guest:admin2@localhost/definitely_not_prod",
      "API_KEY=n1c3-try-th1s-is-a-static-site",
      "ADMIN_USERNAME=Admin",
      "ADMIN_PASSWORD=Admin",
      "FAVOURITE_DISTRO=arch  # btw",
      "# fun fact: this site has no backend. there are no real secrets here.",
    ].join("\n"), { egg: "secret hunter" }),
    ".bash_history": file([
      "sudo pacman -Syu",
      "yay -S literally-everything",
      "# reminder: tell everyone I use arch",
      "git commit -m \"fix\"",
      "git commit -m \"actually fix\"",
      "git commit -m \"please work\"",
      "kubectl get pods  # why is it CrashLoopBackOff",
      "rm -rf node_modules && npm install  # the ancient ritual",
      "exit",
      "exit",
      ":q!",
    ].join("\n")),
    ".ssh": dir({ id_rsa: file("", { denied: true, joke: "did you really think the private key would be here? 😄" }), "known_hosts": file("github.com ssh-ed25519 AAAA…(truncated)") }),
  });
  const root = dir({
    bin: dir(), // filled with command names below
    etc: dir({
      hostname: file(HOST),
      "os-release": file('NAME="Arch Linux"\nPRETTY_NAME="Arch Linux (btw)"\nID=arch\nBUILD_ID=rolling\nANSI_COLOR="38;2;23;147;209"\nHOME_URL="https://archlinux.org/"\nVARIANT="SNF-OS 2.0.26 (hexgrid)"'),
      "pacman.conf": file("[options]\nColor\nILoveCandy\nParallelDownloads = 5\n\n[core]\nInclude = /etc/pacman.d/mirrorlist\n\n[extra]\nInclude = /etc/pacman.d/mirrorlist"),
      motd: file("welcome to SNF-OS. be nice, and don't rm -rf anything. 😉"),
      passwd: file(`root:x:0:0:root:/root:/bin/snf.sh\n${HOST}:x:1000:1000:${C.name}:/home/${HOST}:/bin/snf.sh\nguest:x:1001:1001:you:/home/guest:/bin/snf.sh`, { egg: "explorer" }),
      shadow: file("", { denied: true, joke: "the passwords are hashed AND fake. respect the hustle though." }),
    }),
    home: dir({ guest: home, [HOST]: dir({}, { denied: true }) }),
    root: dir({}, { denied: true }),
    tmp: dir(),
    dev: dir({ null: file("") }),
  });
  const HOME = ["home", "guest"];
  let cwd = [...HOME];

  // album data → album/album.json + one "file" per photo whose content is its metadata
  const albumReady = fetch("album/album.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((data) => {
      home.children.album.children["album.json"] = file(JSON.stringify(data, null, 2));
      for (const p of data.photos || []) {
        const meta = [
          ["title", p.title], ["description", p.description], ["date", p.date], ["location", p.location],
          ["camera", p.camera], ["lens", p.lens], ["focal-length", p["focal-length"]], ["aperture", p.apature || p.aperture],
          ["shutter", p.ss], ["iso", p.iso], ["tags", (p.tags || []).join(", ")],
        ].filter(([, v]) => v && v !== "unknown");
        home.children.album.children.photos.children[p.file] = file(meta.map(([k, v]) => `${k}: ${v}`).join("\n"), { photo: p.file });
      }
    })
    .catch(() => { home.children.album.children["album.json"] = file("error: couldn't load album.json (serve the site over http)"); });

  // ---------- paths ----------
  const resolve = (path = "") => {
    let segs = path.startsWith("/") ? [] : path.startsWith("~") ? [...HOME] : [...cwd];
    for (const s of path.replace(/^~/, "").split("/")) {
      if (!s || s === ".") continue;
      if (s === "..") segs.pop(); else segs.push(s);
    }
    return segs;
  };
  const nodeAt = (segs) => {
    let n = root;
    for (const s of segs) {
      if (n.type !== "dir" || n.denied || !n.children[s]) return null;
      n = n.children[s];
    }
    return n;
  };
  const show = (segs) => {
    const p = "/" + segs.join("/");
    const h = "/" + HOME.join("/");
    return p === h ? "~" : p.startsWith(h + "/") ? "~" + p.slice(h.length) : p;
  };
  const photoLink = (path, node) => node?.photo
    ? `<a class="t-img" href="album.html#photo=${encodeURIComponent(node.photo)}">${esc(path)}</a>`
    : null;

  // expand * and ? in the last path segment
  function glob(token) {
    if (!/[*?]/.test(token)) return [token];
    const i = token.lastIndexOf("/");
    const base = i >= 0 ? token.slice(0, i + 1) : "";
    const pat = token.slice(i + 1);
    const d = nodeAt(resolve(base || "."));
    if (!d || d.type !== "dir") return [token];
    const isDirGlob = pat.endsWith("/") ;
    const re = new RegExp("^" + pat.replace(/\/$/, "").replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
    const hits = Object.keys(d.children).filter((n) => re.test(n) && (pat.startsWith(".") || !n.startsWith(".")) && (!isDirGlob || d.children[n].type === "dir"));
    return hits.length ? hits.map((n) => base + n) : [token];
  }

  // ---------- parsing ----------
  function tokenize(s) {
    const out = []; let cur = "", q = null, has = false;
    for (const ch of s) {
      if (q) { if (ch === q) q = null; else cur += ch; continue; }
      if (ch === '"' || ch === "'") { q = ch; has = true; continue; }
      if (/\s/.test(ch)) { if (cur || has) out.push(cur); cur = ""; has = false; continue; }
      cur += ch;
    }
    if (cur || has) out.push(cur);
    return out;
  }
  // split on an unquoted separator
  function splitTop(s, sep) {
    const parts = []; let cur = "", q = null;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q) { if (ch === q) q = null; cur += ch; continue; }
      if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
      if (s.startsWith(sep, i) && !(sep === "|" && s[i + 1] === "|")) { parts.push(cur); cur = ""; i += sep.length - 1; continue; }
      cur += ch;
    }
    parts.push(cur);
    return parts.map((p) => p.trim()).filter(Boolean);
  }
  // separate "-abc" flags from operands
  function flags(args) {
    const f = new Set(), rest = [];
    for (const a of args) {
      if (/^-[a-zA-Z]+$/.test(a)) [...a.slice(1)].forEach((c) => f.add(c));
      else rest.push(a);
    }
    return [f, rest];
  }

  // ---------- achievements ----------
  // unlocked ones are saved to localStorage and show up as files in ~/achievements/
  const EGGS = {
    "chaos agent": "ran rm -rf. the site survived.",
    "secret hunter": "found the .env file.",
    "explorer": "read /etc/passwd.",
    "nice try": "tried sudo or a forbidden file.",
    "sandwich": "sudo make me a sandwich.",
    "fork bomber": "tried a fork bomb.",
    "vim survivor": "made it out of vim.",
    "bobby tables": "tried a little SQL injection.",
    "hacker voice": "hacked the mainframe (the about page).",
    "rebooter": "rebooted SNF-OS.",
    "true arch user": "ran pacman -Syu.",
    "ai skeptic": "tried to install an AI. it went badly.",
    "mom joke": "tried to install someone's mom.",
  };
  const TOTAL = Object.keys(EGGS).length;
  const STORE = "snf-achievements";
  const found = new Map(); // name → ISO date unlocked
  try { for (const [k, v] of Object.entries(JSON.parse(localStorage.getItem(STORE)) || {})) if (EGGS[k]) found.set(k, v); } catch {}
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(Object.fromEntries(found))); } catch {} };
  const slug = (name) => name.replace(/\s+/g, "-") + ".txt";
  function syncAchievementFiles() {
    if (!found.size) { delete home.children.achievements; return; }
    home.children.achievements = dir(Object.fromEntries([...found].map(([name, when]) => [slug(name), file(
      `★ ${name}\n${EGGS[name]}\nunlocked: ${new Date(when).toLocaleString()}\n\nprogress: ${found.size}/${TOTAL}`,
    )])));
  }
  syncAchievementFiles();
  // messages are queued and printed after the command's output, so they never end up in a pipe
  const pendingAch = [];
  const unlock = (name) => {
    if (found.has(name)) return [];
    found.set(name, new Date().toISOString());
    save();
    syncAchievementFiles();
    pendingAch.push(
      H(`<span class="t-ach">★ achievement unlocked: ${esc(name)} (${found.size}/${TOTAL})</span>`),
      ...(found.size === 1 ? [H(`<span class="t-dim">saved to</span> <span class="t-dir">~/achievements/</span> <span class="t-dim">— try: ls achievements</span>`)] : []),
      ...(found.size === TOTAL ? [H(`<span class="t-ach">🏆 all ${TOTAL} found. you are officially a smartass. respect.</span>`)] : []),
    );
    return [];
  };

  // ---------- commands ----------
  // each: (args, stdin: line[] | null, ctx) => line[] | Promise<line[]>
  const commands = {
    help: () => [
      H(`<span class="t-hl">navigation</span>   ls [-alR] [path]   cd [path]   pwd   tree [path]`),
      H(`<span class="t-hl">reading</span>      cat &lt;file&gt;   head   tail   wc   sort`),
      H(`<span class="t-hl">search</span>       grep [-i -v -n -r -l -c] &lt;pattern&gt; [path]   find [path] -name &lt;pattern&gt;`),
      H(`<span class="t-hl">open</span>         photos   open &lt;photo|project&gt;   album`),
      H(`<span class="t-hl">shortcuts</span>    about   skills   projects   experience   contact`),
      H(`<span class="t-hl">github</span>       gh stats   gh langs [--top N]`),
      H(`<span class="t-hl">language</span>     lang [en|no|1337]`),
      H(`<span class="t-hl">system</span>       whoami   neofetch   banner   history   date   echo   clear   reboot   achievements`),
      H(`<span class="t-hl">packages</span>     pacman -Syu   pacman -S &lt;pkg&gt;   yay   <span class="t-dim">(arch, btw)</span>`),
      T(""),
      H(`tips: pipes work (<span class="t-cmd">ls -R | grep json</span>), tab completes, ↑/↓ for history.`),
      H(`try <span class="t-cmd">grep -i sigma -r album</span> or <span class="t-cmd">grep -i bird</span> to search the photos.`),
    ],

    ls(args, stdin, ctx) {
      const [f, paths] = flags(args);
      const targets = paths.length ? paths.flatMap(glob) : ["."];
      const out = [];
      const entryLines = (d, segs) => {
        let names = Object.keys(d.children).sort();
        if (!f.has("a")) names = names.filter((n) => !n.startsWith("."));
        if (f.has("a")) names = [".", "..", ...names];
        const fmt = (n) => {
          const c = n === "." || n === ".." ? dir() : d.children[n];
          const cls = c.type === "dir" ? "t-dir" : c.photo ? "t-img" : n.startsWith(".") ? "t-dim" : "";
          const label = c.type === "dir" ? n + "/" : n;
          const html = c.photo ? photoLink(label, c) : cls ? `<span class="${cls}">${esc(label)}</span>` : esc(label);
          if (!f.has("l")) return H(html, n);
          const size = c.type === "dir" ? 4096 : (read(c) || "").length;
          const perm = c.type === "dir" ? "drwxr-xr-x" : c.denied ? "-rw-------" : "-rw-r--r--";
          const owner = c.denied || segs[0] === "root" ? "root " : "guest";
          return H(`${perm} ${owner} ${String(size).padStart(6)} Oct 14 09:00 ${html}`, `${perm} ${owner} ${String(size).padStart(6)} Oct 14 09:00 ${n}`);
        };
        const items = names.map(fmt);
        // columns on screen, one per line when piped / long format
        if (ctx.piped || f.has("l") || !items.length) return items;
        return [H(items.map((i) => i.html).join("  "), items.map((i) => i.text).join("  "))];
      };
      const walk = (segs, label, first) => {
        const d = nodeAt(segs);
        if (!d) return out.push(err(`ls: cannot access '${label}': No such file or directory`));
        if (d.denied) return out.push(err(`ls: cannot open directory '${label}': Permission denied`));
        if (d.type === "file") return out.push(d.photo ? H(photoLink(label, d), label) : T(label));
        if (f.has("R") || targets.length > 1) { if (!first) out.push(T("")); out.push(T(`${label}:`, "t-hl")); }
        out.push(...entryLines(d, segs));
        if (f.has("R")) for (const n of Object.keys(d.children).sort()) {
          if (d.children[n].type === "dir" && (f.has("a") || !n.startsWith("."))) walk([...segs, n], `${label === "." ? "." : label}/${n}`, false);
        }
      };
      targets.forEach((t, i) => walk(resolve(t), t, i === 0));
      return out;
    },

    cd(args) {
      const target = args[0] ?? "~";
      if (target === "-") return [T(show(cwd))];
      const segs = resolve(target), n = nodeAt(segs);
      const parent = nodeAt(segs.slice(0, -1));
      if (parent?.children?.[segs.at(-1)]?.denied) return [err(`cd: ${target}: Permission denied`)];
      if (!n) return [err(`cd: ${target}: No such file or directory`)];
      if (n.type !== "dir") return [err(`cd: ${target}: Not a directory`)];
      cwd = segs;
      updatePrompt();
      return [];
    },

    pwd: () => [T("/" + cwd.join("/"))],

    cat(args, stdin) {
      if (!args.length) return stdin ?? [];
      const out = [];
      for (const a of args.flatMap(glob)) {
        const segs = resolve(a), n = nodeAt(segs);
        const parent = nodeAt(segs.slice(0, -1));
        const raw = parent?.children?.[segs.at(-1)];
        if (raw?.denied) {
          out.push(err(`cat: ${a}: Permission denied`), T(`  (${raw.joke || "nice try 😄"})`, "t-dim"), ...unlock("nice try"));
          continue;
        }
        if (!n) { out.push(err(`cat: ${a}: No such file or directory`)); continue; }
        if (n.type === "dir") { out.push(err(`cat: ${a}: Is a directory`)); continue; }
        out.push(...lines(read(n)));
        if (n.photo) out.push(H(`→ <a href="album.html#photo=${encodeURIComponent(n.photo)}">open ${esc(n.photo)} in the album</a>`));
        if (n.project) out.push(H(`→ <a href="project.html?p=${encodeURIComponent(n.project)}">open the ${esc(n.project)} page</a>`));
        if (n.egg) out.push(...unlock(n.egg));
      }
      return out;
    },

    grep(args, stdin) {
      const [f, rest] = flags(args);
      if (!rest.length) return [err("usage: grep [-i -v -n -r -l -c] <pattern> [path…]")];
      const [pattern, ...paths] = rest;
      let re;
      try { re = new RegExp(pattern, f.has("i") ? "gi" : "g"); }
      catch { re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), f.has("i") ? "gi" : "g"); }
      const test = (s) => { re.lastIndex = 0; const m = re.test(s); return f.has("v") ? !m : m; };
      const mark = (s) => f.has("v") ? esc(s) : s.split(re).length > 1
        ? (() => { re.lastIndex = 0; let h = "", last = 0, m; while ((m = re.exec(s)) && m[0] !== "") { h += esc(s.slice(last, m.index)) + `<mark class="t-match">${esc(m[0])}</mark>`; last = m.index + m[0].length; } return h + esc(s.slice(last)); })()
        : esc(s);

      // grep over piped input
      if (stdin && !paths.length) {
        const hits = stdin.filter((l) => test(l.text));
        if (f.has("c")) return [T(String(hits.length))];
        return hits.map((l) => H(mark(l.text), l.text));
      }

      // collect files — with no path, search everything under ~ (friendlier than waiting on stdin)
      const files = [], errors = [];
      const targets = paths.length ? paths.flatMap(glob) : ["~"];
      const recursive = f.has("r") || f.has("R") || !paths.length;
      const collect = (segs, label) => {
        const n = nodeAt(segs);
        if (!n) return errors.push(err(`grep: ${label}: No such file or directory`));
        if (n.denied) return errors.push(err(`grep: ${label}: Permission denied`));
        if (n.type === "file") return files.push([label, n]);
        if (!recursive) return errors.push(err(`grep: ${label}: Is a directory`));
        for (const k of Object.keys(n.children).sort()) {
          const c = n.children[k];
          if (c.denied || (k === "album.json" && n.children.photos)) continue; // photos/ already holds the same data
          collect([...segs, k], label === "." ? k : `${label.replace(/\/$/, "")}/${k}`);
        }
      };
      targets.forEach((t) => collect(resolve(t), t));

      const out = [...errors];
      let total = 0;
      const multi = files.length > 1;
      const eggs = new Set();
      for (const [label, n] of files) {
        const text = read(n) || "";
        const hits = text.split("\n").map((l, i) => [l, i + 1]).filter(([l]) => test(l));
        if (!hits.length) continue;
        total += hits.length;
        if (n.egg) eggs.add(n.egg);
        const name = photoLink(label, n) ?? `<span class="t-file">${esc(label)}</span>`;
        if (f.has("l")) { out.push(H(name, label)); continue; }
        if (f.has("c")) { out.push(H(`${name}:${hits.length}`, `${label}:${hits.length}`)); continue; }
        for (const [l, no] of hits) {
          const pre = (multi ? `${name}:` : "") + (f.has("n") ? `<span class="t-dim">${no}:</span>` : "");
          out.push(H(pre + mark(l), (multi ? label + ":" : "") + (f.has("n") ? no + ":" : "") + l));
        }
      }
      if (!total && !errors.length) out.push(T(f.has("i") ? "(no matches)" : `(no matches — grep is case-sensitive, try: grep -i ${pattern})`, "t-dim"));
      for (const e of eggs) out.push(...unlock(e));
      return out;
    },

    find(args) {
      const i = args.indexOf("-name");
      const start = i === 0 || !args.length ? "." : args[0];
      const pat = i >= 0 ? args[i + 1] : null;
      const re = pat ? new RegExp("^" + pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i") : null;
      const out = [];
      const walk = (segs, label) => {
        const n = nodeAt(segs);
        if (!n) return out.push(err(`find: '${label}': No such file or directory`));
        if (!re || re.test(segs.at(-1) || "")) out.push(n.photo ? H(photoLink(label, n), label) : T(label, n.type === "dir" ? "t-dir" : ""));
        if (n.type === "dir" && !n.denied) for (const k of Object.keys(n.children).sort()) walk([...segs, k], `${label}/${k}`);
      };
      walk(resolve(start), start);
      return out;
    },

    tree(args) {
      const segs = resolve(args[0] || "."), out = [T(args[0] || ".", "t-dir")];
      const walk = (n, prefix) => {
        const names = Object.keys(n.children).filter((k) => !k.startsWith(".")).sort();
        names.forEach((k, i) => {
          const c = n.children[k], last = i === names.length - 1;
          const label = c.type === "dir" ? k + "/" : k;
          const html = c.photo ? photoLink(label, c) : c.type === "dir" ? `<span class="t-dir">${esc(label)}</span>` : esc(label);
          out.push(H(`${prefix}${last ? "└── " : "├── "}${html}`, `${prefix}${last ? "└── " : "├── "}${label}`));
          if (c.type === "dir" && !c.denied) walk(c, prefix + (last ? "    " : "│   "));
        });
      };
      const n = nodeAt(segs);
      if (!n || n.type !== "dir") return [err(`tree: ${args[0]}: not a directory`)];
      walk(n, "");
      return out;
    },

    head: (args, stdin) => (stdin ?? []).slice(0, +(args[args.indexOf("-n") + 1]) || 10),
    tail: (args, stdin) => (stdin ?? []).slice(-(+(args[args.indexOf("-n") + 1]) || 10)),
    wc: (args, stdin) => {
      const s = stdin ?? [];
      if (args.includes("-l")) return [T(String(s.length))];
      return [T(`${s.length} ${s.reduce((a, l) => a + l.text.split(/\s+/).filter(Boolean).length, 0)} ${s.reduce((a, l) => a + l.text.length + 1, 0)}`)];
    },
    sort: (args, stdin) => {
      const s = [...(stdin ?? [])].sort((a, b) => a.text.localeCompare(b.text));
      return args.includes("-r") ? s.reverse() : s;
    },
    echo: (args) => [T(args.join(" "))],

    photos: () => commands.ls(["album/photos"], null, {}),
    open(args) {
      const arg = args[0] || "";
      const n = nodeAt(resolve(arg)) || nodeAt(resolve("~/album/photos/" + arg)) || nodeAt(resolve(`~/projects/${arg.replace(/\.md$/, "")}.md`));
      if (n?.project) {
        setTimeout(() => (location.href = `project.html?p=${encodeURIComponent(n.project)}`), 500);
        return [T(`opening ${n.project} …`)];
      }
      if (!n?.photo) return [err(`open: ${arg || "(nothing)"}: not a photo or project — try: photos, ls projects`)];
      setTimeout(() => (location.href = `album.html#photo=${encodeURIComponent(n.photo)}`), 500);
      return [T(`opening ${n.photo} …`)];
    },
    album: () => { setTimeout(() => (location.href = "album.html"), 500); return [T("opening album …")]; },

    about: () => commands.cat(["~/about.txt"]),
    skills: () => commands.cat(["~/skills.txt"]),
    experience: () => commands.cat(["~/experience.log"]),
    contact: () => commands.cat(["~/contact.txt"]),
    projects: () => C.projects.flatMap((p) => [
      H(`<a href="project.html?p=${encodeURIComponent(p.name)}" class="t-dir">${esc(p.name)}</a> — ${esc(E(p.description))}`, `${p.name} — ${E(p.description)}`),
    ]),

    lang: (args) => {
      const names = { en: "English", no: "norsk", leet: "1337" };
      if (!args[0]) return [T(`current: ${I18N.lang}`), T(`available: ${I18N.langs.join(", ")}  (usage: lang <code>)`, "t-dim"), T("the terminal itself stays in English.", "t-dim")];
      const code = args[0].toLowerCase().replace(/^(nb|nn|norsk|norwegian)$/, "no").replace(/^(1337|l33t|leetspeak)$/, "leet").replace(/^english$/, "en");
      if (!I18N.langs.includes(code)) return [err(`lang: unknown language '${args[0]}' — try: ${I18N.langs.join(", ")}`)];
      I18N.set(code);
      return [T(code === "leet" ? "l4n9u493 537 70 1337. h4ck 7h3 pl4n37." : `page language set to ${names[code]}.`, "t-ok")];
    },
    gh: async (args) => {
      const api = window.SNF_GH;
      const [sub, ...rest] = args;
      const usage = [
        T("usage: gh stats            github stats"),
        T("       gh langs [--top N]  most used languages (N = 1–20)"),
      ];
      if (!sub || ["help", "-h", "--help"].includes(sub)) return usage;
      if (!api) return [err("gh: github stats aren't set up on this site")];
      const fail = (e) => [err(e?.kind === "cors"
        ? "gh: can't read the stats server from here (it needs an Access-Control-Allow-Origin header, or you're offline)"
        : "gh: the stats server returned an error. try again in a bit")];

      if (sub === "stats") {
        print([T(`fetching stats for ${api.username} …`, "t-dim")]);
        let stats;
        try { stats = await api.stats(); } catch (e) { return fail(e); }
        const LABELS = { stars: "stars", commits: api.commitsAll ? "commits" : "commits (last year)", prs: "pull requests", issues: "issues", contribs: "contributed to (last year)" };
        const ICONS = { stars: "★", commits: "⎇", prs: "⇄", issues: "◎", contribs: "⬡" };
        const width = Math.max(...stats.map(([id]) => LABELS[id].length)) + 4;
        return stats.map(([id, v]) => {
          const dots = " " + ".".repeat(width - LABELS[id].length) + " ";
          return H(`<span class="t-hl">${ICONS[id]}</span> ${esc(LABELS[id])}<span class="t-dim">${dots}</span><span class="t-ok">${esc(v)}</span>`, `${ICONS[id]} ${LABELS[id]}${dots}${v}`);
        });
      }

      if (sub === "langs") {
        let n;
        const i = rest.findIndex((a) => a === "--top" || a === "-n");
        if (i >= 0) n = rest[i + 1];
        else n = rest.find((a) => a.startsWith("--top="))?.slice(6);
        if (n !== undefined && !(/^\d+$/.test(n) && +n >= 1 && +n <= 20)) return [err("gh: --top needs a number from 1 to 20")];
        print([T(`fetching languages for ${api.username} …`, "t-dim")]);
        let langs;
        try { langs = await api.langs(n === undefined ? undefined : +n); } catch (e) { return fail(e); }
        const max = Math.max(...langs.map((l) => l.pct)), W = 20;
        const nameW = Math.max(...langs.map((l) => l.name.length)) + 2;
        return langs.map((l) => {
          const filled = Math.max(l.pct > 0 ? 1 : 0, Math.round((l.pct / max) * W));
          const pct = `${l.pct.toFixed(2)}%`.padStart(7);
          return H(
            `${esc(l.name.padEnd(nameW))}<span style="color:${api.visible(l.color)}">${"█".repeat(filled)}</span><span class="t-dim">${"░".repeat(W - filled)}</span> ${pct}`,
            `${l.name.padEnd(nameW)}${"█".repeat(filled)}${"░".repeat(W - filled)} ${pct}`,
          );
        });
      }
      return [err(`gh: unknown command '${sub}'`), ...usage];
    },
    whoami: () => [T("guest")],
    id: () => [T("uid=1001(guest) gid=1001(guest) groups=1001(guest),42(curious)")],
    hostname: () => [T(HOST)],
    uname: (args) => [T(args.includes("-a") ? `Linux ${HOST} 6.17.2-arch1-1-hexgrid #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux (btw)` : "Linux")],
    date: () => [T(new Date().toString())],
    history: (args) => args.includes("-c")
      ? (hist = [], hIdx = 0, saveHist(), [])
      : hist.map((h, i) => T(`${String(i + 1).padStart(4)}  ${h}`)),
    banner: () => [logoLine()],
    neofetch: () => [
      logoLine(),
      H(`<span class="t-hl">guest@${esc(HOST)}</span>`),
      T("-".repeat(HOST.length + 6)),
      ...[
        ["OS", "Arch Linux x86_64 (btw)"],
        ["Host", `${C.name} // ${E(C.role)}`],
        ["Kernel", "6.17.2-arch1-1-hexgrid"],
        ["Uptime", `${Math.round(performance.now() / 60000)} min`],
        ["Packages", "1337 (pacman), 42 (aur)"],
        ["Shell", "snf.sh"],
        ["WM", "hyprland (obviously)"],
        ["Resolution", `${screen.width}x${screen.height}`],
        ["CPU", `${navigator.hardwareConcurrency || "?"} cores (yours, borrowed)`],
        ["Memory", navigator.deviceMemory ? `${navigator.deviceMemory} GB-ish` : "enough"],
        ["Languages", C.skills.languages?.join(", ") || "-"],
      ].map(([k, v]) => H(`<span class="t-hl">${k}</span>: ${esc(v)}`)),
      H(["#05070d", "#ff2bd6", "#00ffa3", "#febc2e", "#00d4ff", "#c9d6e8"].map((c) => `<span style="color:${c}">███</span>`).join("")),
    ],
    achievements: (args) => args.includes("--reset") ? (found.clear(), save(), syncAchievementFiles(), [T("achievements reset. the hunt begins again.", "t-dim")]) : [
      T(`${found.size}/${TOTAL} found`, "t-hl"),
      ...Object.keys(EGGS).map((e) => found.has(e) ? H(`  <span class="t-ach">★ ${esc(e)}</span> <span class="t-dim">— ${esc(EGGS[e])}</span>`, e) : T("  ☆ ???", "t-dim")),
      ...(found.size ? [T("(also in ~/achievements/ · reset with: achievements --reset)", "t-dim")] : []),
    ],
    clear: () => { out.innerHTML = ""; return []; },
    reboot: async () => {
      print([T("rebooting …")]);
      await sleep(400);
      await window.SNF_BOOT?.(true);
      return unlock("rebooter");
    },
    exit: () => [T("there is no exit. only ctrl+w. 🚪", "t-dim")],
    logout: () => commands.exit(),
    man: (args) => [T(args.length ? `no manual entry for ${args[0]}. try: help` : "what manual page do you want?\nfor example, try 'man man'.")],
    vim: () => [T("you are now trapped in vim forever.", "t-err"), T("…just kidding. :q!", "t-dim"), ...unlock("vim survivor")],
    vi: () => commands.vim(),
    nano: () => [T("nano? respectable choice. but this filesystem is read-only.", "t-dim")],
    emacs: () => [T("emacs is a great operating system, it just lacks a good editor. try vim.", "t-dim")],
    cowsay: (args) => {
      const msg = args.join(" ") || "moo";
      return lines(` ${"_".repeat(msg.length + 2)}\n< ${msg} >\n ${"-".repeat(msg.length + 2)}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`);
    },
    sl: () => lines("      ====        ________                ___________\n  _D _|  |_______/        \\__I_I_____===__|_________|\n   |(_)---  |   H\\________/ |   |        =|___ ___|\n   /     |  |   H  |  |     |   |         ||_| |_||\n  |      |  |   H  |__--------------------| [___] |\n  | ________|___H__/__|_____/[][]~\\_______|       |\n  |/ |   |-----------I_____I [][] []  D   |=======|_\n__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__\n |/-=|___|=    ||    ||    ||    |_____/~\\___/\n  \\_/      \\O=====O=====O=====O_/      \\_/\n(you meant ls. choo choo.)"),
    btw: () => [T("I use Arch, btw.", "t-hl")],
    pacman: async (args) => {
      const a = args.join(" ");
      if (!a) return [err("error: no operation specified (use -h for help)")];
      if (/^-Sy*u|^-Syyu/.test(a)) {
        print([T(":: Synchronizing package databases..."), T(" core      up to date"), T(" extra     up to date"), T(":: Starting full system upgrade...")]);
        await sleep(700);
        return [T(` there is nothing to do. (on a website. ${HOST}'s actual laptop has 847 updates.)`, "t-dim"), ...unlock("true arch user")];
      }
      const pkg = args.slice(1).join(" ");
      if (/^-S/.test(a) && /\b(your|ur|yo|you'?re)\s*-?(mom|mum|mama|momma|mother)\b/i.test(pkg)) {
        print([T("resolving dependencies...")]);
        await sleep(700);
        const jokes = [
          ["error: failed to commit transaction (not enough free disk space)", "your-mom is too big. free up 20 PB and try again."],
          ["warning: your-mom-1.0-1 is up to date -- reinstalling", "error: she's already installed on half the servers in the world."],
          [":: your-mom has 8,000,000,000 dependencies. proceed with installation? [Y/n] n", "wise choice."],
          ["error: failed to retrieve 'your-mom.pkg.tar.zst' from mirror", "too heavy to download. even with ParallelDownloads = 5."],
          ["error: your-mom: signature is unknown trust", "(she doesn't trust you either)"],
          ["error: Partition / too full: 5497558138880 blocks needed, 61035156 blocks free"],
          ["error: failed to commit transaction (not enough free disk space)"],
          ["your-mom is too big. free up 20 PB and try again.", "t-dim"],
        ];
        const [e1, e2] = jokes[Math.floor(Math.random() * jokes.length)];
        return [err(e1), T(e2, "t-dim"), ...unlock("mom joke")];
      }
      if (/^-S/.test(a) && /\b(your|ur|yo)\s*-?(dad|father)\b/i.test(pkg)) {
        print([T("resolving dependencies...")]);
        await sleep(700);
        return [err("error: target not found: your-dad"), T("(he went out for milk in 2009 and hasn't synced since)", "t-dim"), ...unlock("mom joke")];
      }
      if (/^-S\b/.test(a) && args[1]) {
        print([T("resolving dependencies..."), T("looking for conflicting packages...")]);
        await sleep(500);
        return [T(`Packages (1) ${args[1]}-rolling`), T(`:: installing ${args[1]}... done. (it'll break on the next -Syu, btw)`, "t-ok")];
      }
      if (/^-Q/.test(a)) return lines("arch-btw 1.0-1\nbase 3-2\nhexgrid 2.0.26-1\nlinux 6.17.2.arch1-1\nneofetch 7.1.0-2\nsnf-portfolio 2026.10-1");
      return [err(`error: invalid option '${args[0]}'`)];
    },
    yay: (args) => commands.pacman(args.length ? args : ["-Syu"]),
    paru: (args) => commands.yay(args),
    hack: async () => {
      for (const s of ["bypassing firewall", "decrypting mainframe", "downloading more RAM", "reversing the polarity", "enhancing"]) {
        print([H(`<span class="t-dim">[*]</span> ${s} …`)]);
        await sleep(350);
      }
      return [T("ACCESS GRANTED", "t-ok"), T("…to the about page. it was public anyway. try: cat about.txt", "t-dim"), ...unlock("hacker voice")];
    },
    ssh: (args) => [err(`ssh: connect to host ${args.at(-1) || "?"} port 22: Connection refused`)],
    curl: () => [err("curl: (6) this terminal lives in your browser tab. it has no internet of its own.")],
    wget: () => commands.curl(),
    ping: (args) => [T(`PING ${args[0] || "localhost"}: pong 🏓`)],
    nmap: () => [T("Starting Nmap … 1 host up. open ports: 443/https (the website you're looking at)", "t-dim")],
    git: (args) => args.join(" ").includes("push") && args.includes("--force")
      ? [err("remote: force-push to main rejected. Sander has trust issues.")]
      : [T("fatal: not a git repository. (the real one is at github.com/" + "SanderNF)")],
    chmod: () => [err("chmod: changing permissions: Read-only file system")],
  };
  for (const c of ["apt", "apt-get", "dnf", "yum", "brew", "zypper", "snap"]) commands[c] = () => [err(`${c}? this is Arch, btw. try: pacman -Syu`)];
  for (const c of ["rm", "mv", "cp", "touch", "mkdir", "rmdir"]) commands[c] = (args) => [err(`${c}: cannot modify '${args.filter((a) => !a.startsWith("-"))[0] || "?"}': Read-only file system`)];
  root.children.bin.children = Object.fromEntries(Object.keys(commands).sort().map((c) => [c, file(`#!/bin/snf.sh\n# ${c}`)]));

  // ---------- easter eggs that match the whole input ----------
  const EASTER = [
    // installing an AI to browse the site for you → self-destruct
    { re: /\b(apt|apt-get|pacman|yay|paru|pip3?|pipx|npm|pnpm|yarn|brew|dnf|yum|snap|cargo|winget|choco)\b.*\b(openai|chatgpt|gpt[\w.-]*|claude[\w-]*|anthropic|copilot|gemini|bard|ollama|llama[\w.-]*|mistral|deepseek|grok|perplexity|llm|ai)\b/i, run: async (raw) => {
      const ai = /claude|anthropic/i.test(raw) ? "Claude" : /gemini|bard/i.test(raw) ? "Gemini" : /copilot/i.test(raw) ? "Copilot"
        : /grok/i.test(raw) ? "Grok" : /deepseek/i.test(raw) ? "DeepSeek" : /llama|ollama/i.test(raw) ? "Llama" : /mistral/i.test(raw) ? "Mistral" : "ChatGPT";
      print([T("I can't believe you're too lazy to use a website yourself. self-destructing!", "t-err")]);
      await sleep(1200);
      print([H(`<span class="prompt">${esc(ai.toLowerCase())}@${esc(HOST)}:~#</span> <span class="t-cmd">sudo rm -rf */</span>`, `${ai} ran: sudo rm -rf */`)]);
      await sleep(800);
      return [...await nuke(), ...unlock("ai skeptic")];
    } },
    { re: /\brm\s+(-[a-z]*r[a-z]*f[a-z]*|-[a-z]*f[a-z]*r[a-z]*|-r\s+-f|-f\s+-r|--recursive)\b/i, run: () => nuke() },
    { re: /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, run: () => [T("bash: fork bomb detected 💣", "t-err"), T("…and defused ✂️  nice try.", "t-dim"), ...unlock("fork bomber")] },
    { re: /^sudo\s+make\s+me\s+a\s+sandwich/i, run: () => [T("okay. 🥪"), ...unlock("sandwich")] },
    { re: /^make\s+me\s+a\s+sandwich/i, run: () => [T("what? make it yourself.")] },
    { re: /('|")\s*or\s+1\s*=\s*1|drop\s+table|;\s*--/i, run: () => [T("ah, little Bobby Tables, we meet again. there's no database here. 🧑‍🎓", "t-dim"), ...unlock("bobby tables")] },
    { re: /\b(mkfs|dd\s+if=|shutdown|poweroff|halt|init\s+0)\b/i, run: () => [err("nope. you can't turn off the internet.")] },
    { re: /^sudo\b.*\.env/i, run: async () => {
      print([T("[sudo] password for guest: ")]);
      await sleep(900);
      return [err("guest is not in the sudoers file. This incident will be reported."),
        T("…but hunting for .env files with sudo? bold. respect.", "t-dim"),
        H(`hint: no sudo needed. try <span class="t-cmd">ls -a</span> 👀`), ...unlock("nice try")];
    } },
    { re: /^sudo\b/i, run: async () => {
      print([T("[sudo] password for guest: ")]);
      await sleep(900);
      return [err("guest is not in the sudoers file. This incident will be reported."), T("(reported to: /dev/null)", "t-dim"), ...unlock("nice try")];
    } },
  ];

  // ---------- rm -rf: nuke ----------
  async function nuke() {
    const doomed = [];
    const walk = (n, p) => { for (const [k, c] of Object.entries(n.children || {})) { doomed.push(p + k + (c.type === "dir" ? "/" : "")); if (c.type === "dir" && !c.denied) walk(c, p + k + "/"); } };
    walk(root, "/");
    for (const d of doomed.slice(0, 40)) { print([T(`removed '${d}'`, "t-err")]); await sleep(18); }
    print([T("removed '/home/guest/style.css'", "t-err"), T("removed 'the internet'", "t-err")]);
    await sleep(300);

    // launch sequence
    const ov = document.createElement("div");
    ov.className = "nuke";
    ov.innerHTML = `<div class="nuke-warn">⚠ NUCLEAR LAUNCH DETECTED ⚠</div><div class="nuke-count"></div>`;
    document.body.appendChild(ov);
    for (const n of ["3", "2", "1"]) { ov.querySelector(".nuke-count").textContent = n; await sleep(650); }
    ov.innerHTML = `<div class="shake"><pre class="nuke-cloud">${esc(CLOUD)}</pre><div class="nuke-warn">💥 KABOOM 💥</div></div>`;
    ov.classList.add("boom");
    await sleep(2400);
    ov.remove();

    // the site "loses" its CSS
    const sheets = [...document.querySelectorAll('link[rel="stylesheet"], style')];
    sheets.forEach((s) => (s.disabled = true));
    const canvas = $("#hexbg"); if (canvas) canvas.style.display = "none";
    const note = document.createElement("div");
    note.setAttribute("style", "position:fixed;top:0;left:0;right:0;z-index:9999;background:#ff0;color:#000;font:16px 'Times New Roman',serif;padding:10px;border-bottom:3px solid #000;text-align:center");
    note.innerHTML = `💥 <b>style.css has been deleted.</b> Welcome to 1995. Restoring from backup in <span id="nuke-t">10</span>s… <button id="nuke-restore">restore now</button>`;
    document.body.appendChild(note);
    window.scrollTo({ top: 0 });
    await new Promise((resolve) => {
      let t = 10;
      const tick = setInterval(() => { t--; const el = $("#nuke-t"); if (el) el.textContent = t; if (t <= 0) { clearInterval(tick); resolve(); } }, 1000);
      note.querySelector("#nuke-restore").addEventListener("click", () => { clearInterval(tick); resolve(); });
    });
    sheets.forEach((s) => (s.disabled = false));
    if (canvas) canvas.style.display = "";
    note.remove();
    $("#terminal")?.scrollIntoView({ block: "center" });
    input.focus({ preventScroll: true });
    return [T("system restored from backup. ✅", "t-ok"), T("tip: nothing was actually deleted — this is a static site.", "t-dim"), ...unlock("chaos agent")];
  }
  const CLOUD = [
    "                 _.-^^---....,,--       ",
    "             _--                  --_   ",
    "            <                        >) ",
    "            |                         |  ",
    "             \\._                   _./  ",
    "                ```--. . , ; .--'''     ",
    "                      | |   |           ",
    "                   .-=||  | |=-.        ",
    "                   `-=#$%&%$#=-'        ",
    "                      | ;  :|           ",
    "             _____.,-#%&$@%#&#~,._____  ",
  ].join("\n");

  // ---------- terminal UI ----------
  const out = $("#term-out"), input = $("#term-input"), body = $("#term-body"), promptEl = $("#term-form .prompt");
  // command history survives reloads (↑/↓ only — old commands aren't printed on load)
  const HIST_KEY = "snf-history", HIST_MAX = 50;
  let hist = [];
  try { hist = (JSON.parse(localStorage.getItem(HIST_KEY)) || []).filter((h) => typeof h === "string").slice(-HIST_MAX); } catch {}
  const saveHist = () => { try { localStorage.setItem(HIST_KEY, JSON.stringify(hist.slice(-HIST_MAX))); } catch {} };
  let hIdx = hist.length, busy = false;

  function print(ls) {
    if (!ls?.length) return;
    out.insertAdjacentHTML("beforeend", ls.map((l) => `<div>${l.html || "&nbsp;"}</div>`).join(""));
    body.scrollTop = body.scrollHeight;
  }
  const promptText = () => `guest@${HOST}:${show(cwd)}$`;
  const updatePrompt = () => (promptEl.textContent = promptText());

  function logoLine() {
    const ls = window.SNF_LOGO.split("\n");
    const cols = Math.max(...ls.map((l) => l.length));
    return H(`<pre class="t-logo" style="--cols:${cols}">${esc(window.SNF_LOGO)}</pre>`, "");
  }

  async function runPipeline(segment) {
    const stages = splitTop(segment, "|");
    let data = null;
    for (let i = 0; i < stages.length; i++) {
      const [name, ...rawArgs] = tokenize(stages[i]);
      const args = rawArgs;
      const fn = Object.hasOwn(commands, name) ? commands[name] : null;
      if (!fn) return [err(`snf.sh: command not found: ${name}`), ...(i === 0 ? [H(`type <span class="t-hl">help</span> to see what's available`)] : [])];
      data = await fn(args, data, { piped: i < stages.length - 1 });
    }
    return data;
  }

  async function run(raw) {
    await albumReady;
    for (const egg of EASTER) if (egg.re.test(raw)) return egg.run(raw);
    let result = [];
    for (const part of splitTop(raw, "&&").flatMap((p) => splitTop(p, ";"))) {
      const r = await runPipeline(part);
      result = result.concat(r || []);
    }
    return result;
  }

  $("#term-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    const raw = input.value.trim();
    input.value = "";
    print([H(`<span class="prompt">${esc(promptText())}</span> <span class="t-cmd">${esc(raw)}</span>`, "")]);
    if (!raw) return;
    if (hist.at(-1) !== raw) hist.push(raw);   // skip consecutive duplicates, like bash's ignoredups
    if (hist.length > HIST_MAX) hist = hist.slice(-HIST_MAX);
    hIdx = hist.length;
    saveHist();
    busy = true;
    try { print(await run(raw)); }
    catch (ex) { print([err(`snf.sh: ${ex.message}`)]); }
    finally { busy = false; }
    print(pendingAch.splice(0));
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && hIdx > 0) { input.value = hist[--hIdx]; e.preventDefault(); }
    else if (e.key === "ArrowDown") { hIdx = Math.min(hIdx + 1, hist.length); input.value = hist[hIdx] || ""; e.preventDefault(); }
    else if (e.key === "Tab") { e.preventDefault(); complete(); }
    else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); out.innerHTML = ""; }
    else if (e.key === "c" && e.ctrlKey && !getSelection().toString()) {
      print([H(`<span class="prompt">${esc(promptText())}</span> ${esc(input.value)}^C`, "")]); input.value = "";
    }
  });

  // tab completion for commands and paths
  function complete() {
    const v = input.value, i = v.lastIndexOf(" ");
    const word = v.slice(i + 1), before = v.slice(0, i + 1);
    let options, base = "";
    if (i < 0 || /\|\s*$/.test(before)) {
      options = Object.keys(commands).filter((c) => c.startsWith(word));
    } else {
      const j = word.lastIndexOf("/");
      base = j >= 0 ? word.slice(0, j + 1) : "";
      const d = nodeAt(resolve(base || "."));
      const pre = word.slice(j + 1);
      options = d?.type === "dir" && !d.denied
        ? Object.entries(d.children).filter(([n]) => n.startsWith(pre) && (pre.startsWith(".") || !n.startsWith("."))).map(([n, c]) => n + (c.type === "dir" ? "/" : ""))
        : [];
    }
    if (!options.length) return;
    if (options.length === 1) { input.value = before + base + options[0] + (options[0].endsWith("/") ? "" : " "); return; }
    let common = options[0];
    for (const o of options) while (!o.startsWith(common)) common = common.slice(0, -1);
    input.value = before + base + common;
    print([H(`<span class="prompt">${esc(promptText())}</span> ${esc(v)}`, ""), T(options.join("  "), "t-dim")]);
  }

  body.addEventListener("click", () => { if (!getSelection().toString()) input.focus({ preventScroll: true }); });

  updatePrompt();
  print([
    logoLine(),
    H(`Arch Linux 6.17.2-arch1-1 <span class="t-dim">(tty1)</span> — SNF-OS 2.0.26. welcome, guest.`),
    H(`type <span class="t-hl">help</span> to get started. there may be a few secrets hidden in here. 👀`),
  ]);
})();
