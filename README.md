# SanderNF presentsjon

Futuristic, terminal-styled personal portfolio. Plain HTML/CSS/JS — no build step.

## Customize
Edit **`config.js`** — name, taglines, about text, skills, projects, experience and contact links all live there.

Colors are CSS variables at the top of `style.css` (`--accent`, `--accent-2`, `--accent-3`).

## Languages
The site can be shown in English, Norwegian or 1337 (globe icon in the top bar, or the buttons in the hamburger menu). The choice is remembered in the browser, and Norwegian browsers get Norwegian by default.

- **Your content:** write translatable text in `config.js` as `{ en: "…", no: "…" }`. A plain string is the same in every language.
- **Interface text:** headings, buttons and labels live in `STRINGS` in `i18n.js`.
- **1337:** generated automatically from the English text.
- **Kept in their original language:** the terminal (commands and files), `album/album.json` and the reference letter. The terminal's `lang` command switches the page language.

## Projects
Each project in `config.js` gets its own page at `project.html?p=<name>`, with a `README.md` tab built from `description` + `details`. Set `report` to an experience `place` (e.g. `"Spenn"`) to add a `report.txt` tab showing that entry's reference letter.

## Terminal
The terminal on the home page (`terminal.js`) has a small fake filesystem built from `config.js` and `album/album.json`: `ls`, `cd`, `cat`, `grep`, `find`, `tree`, pipes, tab completion, and photo search (`grep -i sigma -r album`). There are a few easter eggs too — type `achievements` to see how many you've found.

The boot screen (`bootscreen.js`, logo in `logo.js`) plays once per browser session; `reboot` in the terminal replays it.

## Photo album
The album page (`album.html`) reads everything from the `album/` folder:

```
album/
├── album.json   ← title, description and metadata for every photo
└── photos/      ← put your image files here
```

To add a photo, drop it into `album/photos/` and add an entry to `album.json`:

```json
{
  "file": "my-photo.jpg",
  "title": "Fjord at dawn",
  "description": "Early morning light over the water.",
  "date": "2026-06-21",
  "location": "Geiranger, Norway",
  "camera": "Canon EOS R50 V",
  "focal-length": "16 mm",
  "apature": "f / 3.5",
  "ss": "1/100 sec",
  "iso": "100",
  "tags": ["nature", "travel"]
}
```

Only `file` is required — empty fields and `"unknown"` values are simply hidden. Photos are sorted newest first, and tags become filter buttons automatically.

> The album loads JSON, so it needs to be served over HTTP (see below) — opening `album.html` directly from disk won't work.

## Run locally
Open `index.html` in a browser, or serve it:

```sh
python3 -m http.server 8000
```

## Deploy
Works as-is on GitHub Pages, Netlify or Vercel (static site, root folder).
