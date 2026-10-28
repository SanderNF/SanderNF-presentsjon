// Nerd Font icons, served from assets/fonts/snf-icons.woff2 ("SNF Icons" in style.css).
// That font only holds the icons the site uses: after adding one here, re-run assets/fonts/build_fonts.py.
// Look up codepoints at https://www.nerdfonts.com/cheat-sheet
window.SNF_ICONS = {
  lua: "", javascript: "", node: "", python: "", sql: "",
  go: "󰟓", rust: "", cpp: "", html: "", css: "",
  docker: "", k8s: "", proxmox: "", api: "󱂛",
  github: "", githubActions: "", git: "󰊢",
  commit: "", pr: "", star: "", issue: "", contrib: "󱇯", warning: "", nuke: "",
  jira: "", figma: "", confluence: "",
  snowflake: "", streamlit: "", jupyter: "󱓧",
  code: "", markdown: "", translate: "󰗊",
  email: "󱡯", discord: "", arch: "󰣇", linux: "", apple: "󰀶",
  terminal: "",
  photos: "󰣌", camera: "", cameraLocation: "󱦨", aperture: "󰄄", shutter: "󰭪", iso: "󱝊", focal: "󰄄",
  pdf: "", mapMarker: "󰟙", link: "", web: "󰖟", wifi: "󱛆",
  ethernet: "󰈀", networkSwitch: "", remoteDesktop: "󰢹",
  briefcase: "󱒕", graduation: "", robot: "󱚣", record: "󰑋",
  pihole: "󰷱", minecraft: "󰍳",
  date: "󱛡",
};

// <i class="ico">…</i> for an icon by name; empty for an unknown name
window.SNF_ICON = (name) => (window.SNF_ICONS[name] ? `<i class="ico" aria-hidden="true">${window.SNF_ICONS[name]}</i>` : "");

// icons for a skill or tech tag from config.js, matched on its name
const SKILL_ICONS = [
  [/^lua\b/i, "lua"], [/^javascript/i, "javascript"], [/^node/i, "node"], [/^python/i, "python"], [/^sql\b/i, "sql"],
  [/^go\b/i, "go"], [/^rust\b/i, "rust"], [/^c\+\+/i, "cpp"], [/^html/i, "html"], [/css\b/i, "css"], [/^rest\b/i, "api"],
  [/^docker/i, "docker"], [/^kubernetes|^k8s/i, "k8s"], [/^github actions/i, "githubActions"], [/^proxmox/i, "proxmox"],
  [/^snowflake/i, "snowflake"], [/^streamlit/i, "streamlit"], [/^jupyter/i, "jupyter"],
  [/^git$/i, "git"], [/^linux/i, "arch"], [/^jira/i, "jira"], [/^confluence/i, "confluence"], [/^figma/i, "figma"],
  [/^ai$/i, "robot"], [/^http/i, "web"], [/^obs\b/i, "record"], [/^networking/i, "ethernet"], [/^pikvm/i, "remoteDesktop"],
  [/^unifi|^cisco/i, "networkSwitch"],
];
window.SNF_SKILL_ICONS = (skill) => SKILL_ICONS.filter(([re]) => re.test(skill)).map(([, name]) => window.SNF_ICON(name)).join("");
