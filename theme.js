// Flag presets (hyfetch -c / -p in the terminal): colour the whole site, on every page.
// Loaded in <head> before the page draws, so there's no flash of the default colours.
// Classic is the default; a preset only shows up through the terminal (saved in this browser)
// or a link option (?flag=<preset> or ?nb, kept for the visit only).
(() => {
  // flag colours from hyfetch's presets (github.com/hykilpikonna/hyfetch). classic is the default.
  // `glitch` = the two colours that flash when the heading glitches (picked automatically if left out)
  const FLAGS = {
    classic: { label: "classic (pink · white · teal)", colors: ["#ff2bd6", "#ffffff", "#00d4ff"], glitch: ["#ff2bd6", "#00d4ff"], classic: true },
    // `accents` = hand-picked page colours, for flags whose own colours are too dark on the black page
    norway: { label: "Norway", colors: ["#ba0c2f", "#ffffff", "#00205b"], glitch: ["#ba0c2f", "#2f5fd0"], accents: ["#ef3b55", "#4a7dff", "#ff8fa3"] },
    rainbow: { label: "rainbow", colors: ["#E50000", "#FF8D00", "#FFEE00", "#028121", "#004CFF", "#770088"] },
    progress: { label: "progress pride", colors: ["#FFFFFF", "#FFAFC8", "#74D7EE", "#613915", "#000000", "#E50000", "#FF8D00", "#FFEE00", "#028121", "#004CFF", "#770088"] },
    transgender: { label: "trans", colors: ["#55CDFD", "#F6AAB7", "#FFFFFF", "#F6AAB7", "#55CDFD"] },
    // `bg` = tint the page background with this colour instead of a faint wash of the main accent
    nonbinary: { label: "non-binary", colors: ["#FCF431", "#FCFCFC", "#9D59D2", "#282828"], bg: "#9D59D2" },
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

  // ---------- page colours from a flag ----------
  // the most colourful flag colour becomes the main accent, the one most different from it the second,
  // then a third; colours too dark for the black page are lightened until they're readable
  const lum = (v) => (0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]) / 255;
  const sat = (v) => Math.max(...v) - Math.min(...v);
  const lift = (hex, min = 0.35) => {
    const base = rgb(hex);
    let v = base;
    for (let t = 0.05; lum(v) < min && t <= 1; t += 0.05) v = base.map((x) => Math.round(x + (255 - x) * t));
    return v;
  };
  const toHex = (v) => "#" + v.map((x) => x.toString(16).padStart(2, "0")).join("");
  function accents(flag) {
    if (flag.accents) return flag.accents.map((c) => rgb(c));
    const uniq = [...new Set(flag.colors.map((c) => c.toLowerCase()))];
    let pool = uniq.filter((c) => sat(rgb(c)) > 40);                        // the colourful ones
    if (!pool.length) pool = uniq.filter((c) => Math.min(...rgb(c)) < 235);  // greys, if that's all there is
    if (!pool.length) pool = uniq;
    pool.sort((a, b) => sat(rgb(b)) - sat(rgb(a)));
    const first = pool[0], fa = rgb(first);
    const dist = (c) => rgb(c).reduce((sum, v, i) => sum + (v - fa[i]) ** 2, 0);
    // only one colourful stripe (e.g. ace)? borrow a grey/white from the flag for the second accent
    const others = pool.length > 1 ? pool.slice(1) : uniq.filter((c) => c !== first && Math.max(...rgb(c)) > 80);
    const second = others.sort((x, y) => dist(y) - dist(x))[0] || first;
    const third = pool.find((c) => c !== first && c !== second) || second;
    return [first, second, third].map((c) => lift(c));
  }

  const VARS = ["--accent", "--accent-2", "--accent-3", "--accent-rgb", "--accent-2-rgb", "--accent-3-rgb", "--bg-glow", "--bg", "--panel", "--hex-rgb", "--hex-fill-rgb"];
  const listeners = [];
  function applyTheme(name) {
    const flag = FLAGS[name] || FLAGS.classic, root = document.documentElement.style;
    root.colorScheme = "dark";
    if (flag.classic) {
      VARS.forEach((v) => root.removeProperty(v)); // back to the stylesheet's own colours
    } else {
      const [a, b, c] = accents(flag);
      [["--accent", a], ["--accent-2", b], ["--accent-3", c]].forEach(([v, col]) => {
        root.setProperty(v, toHex(col));
        root.setProperty(v + "-rgb", col.join(", "));
      });
      const bg = [5, 7, 13], mix = (col, t) => toHex(bg.map((x, i) => Math.round(x + (col[i] - x) * t)));
      if (flag.bg) {
        // the whole page tinted with the flag's background colour, stronger at the top
        const tint = rgb(flag.bg);
        // kept close to black so text and panels stand out; the colour mostly lives in the hexagons
        root.setProperty("--bg", mix(tint, 0.025));
        root.setProperty("--bg-glow", mix(tint, 0.1));
        root.setProperty("--panel", `rgba(${rgb(mix(tint, 0.04)).join(", ")}, 0.82)`);
        // the hexagon background in the same colour
        root.setProperty("--hex-rgb", lift(flag.bg).join(", "));
        root.setProperty("--hex-fill-rgb", lift(flag.bg).join(", "));
      } else {
        // a faint wash of the main accent at the top of the page
        root.removeProperty("--bg");
        root.removeProperty("--panel");
        root.removeProperty("--hex-rgb");
        root.removeProperty("--hex-fill-rgb");
        root.setProperty("--bg-glow", mix(a, 0.14));
      }
    }
    document.documentElement.dataset.flag = name;
    listeners.forEach((fn) => fn(name));
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
      applyTheme(name);
      return true;
    },
    // forget the saved choice: back to the link's flag, or classic
    reset() {
      savedFlag = null;
      try { localStorage.removeItem("snf-flag"); } catch {}
      flagName = linkFlag || "classic";
      applyTheme(flagName);
      return flagName;
    },
    // run fn(name) whenever the preset changes (the name heading, the hex background, …)
    onChange(fn) { listeners.push(fn); },
  };
  applyTheme(flagName);
})();
