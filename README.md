# SanderNF presentsjon

Futuristic, terminal-styled personal portfolio. Plain HTML/CSS/JS — no build step.

## Customize
Edit **`config.js`** — name, taglines, about text, skills, projects, experience and contact links all live there.

Colors are CSS variables at the top of `style.css` (`--accent`, `--accent-2`, `--accent-3`).

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
