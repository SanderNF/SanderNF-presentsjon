# LMCODE.MD — Project Context

## Working Directory
- Path: `/Users/sandernf/SNF-DEV/SanderNF-presentasjon/`

## Project Structure
This is a personal presentation/portfolio website with:
- `index.html`, `project.html`, `album.html` — HTML pages
- `main.js`, `nav.js`, `bootscreen.js`, `album.js`, `terminal.js` — JavaScript files
- `style.css` — Stylesheets
- `config.js`, `hex.js`, `i18n.js`, `icons.js`, `logo.js` — Configuration/data files
- `ghstats.js` — GitHub stats integration

## Recent Work: Album Photo Metadata Generator

**Script:** `album/scripts/build_album.py`
**Output:** `album/album.json`

### What the script does:
1. Reads all images in `./album/photos/` (both original and new `IMG_5xxx`)
2. Uses `exiftool` to extract EXIF metadata: ISO, shutter speed, aperture, focal length, date, camera, lens
3. Writes complete `./album/album.json` with all photos

### Current state (as of commit `face1dbd8`, 2026-10-16):
- **Total photos:** 27 (15 original + 12 new `IMG_5xxx`)
- **All photos have complete EXIF metadata** including:
  - ISO values (100–6400)
  - Shutter speeds (e.g., `1/1250 sec`)
  - Aperture values (e.g., `f / 6.3`)
  - Focal lengths in mm (e.g., `100 mm`, cleaned from exiftool output)
  - Dates in `YYYY-MM-DD` format

### Key fixes made to `build_album.py`:
1. **Fixed exiftool key name matching** — exiftool outputs keys with spaces (`F Number`, `Exposure Time`, `Focal Length`) but original script checked for camelCase (`FNumber`). Now checks `"F Number"`, `"Exposure Time"`, `"Focal Length"`, `"Date/Time Original"`.

2. **Lens manufacturer detection** — Exiftool's `Lens Model` field outputs just the lens name (e.g., `16-300mm F3.5-6.7 DC OS`). The script now falls back to `Lens ID` field which includes the manufacturer prefix (`Sigma 16-300mm F3.5-6.7 DC OS`).

3. **Focal length cleanup** — exiftool appends `(35 mm equivalent: XXX mm)` to focal length values. Script now strips this suffix.

4. **Lens model cleanup** — exiftool appends `| Contemporary 025` to lens models. Script now strips this suffix with `.split('|')[0].strip()`.

5. **UTF-8 preservation** — `json.dump()` defaults to ASCII escaping which converts "Rüppell's" → `"R\u00fcppell's"`. Added `ensure_ascii=False` to preserve UTF-8 characters.

### Current file locations:
```
/Users/sandernf/SNF-DEV/SanderNF-presentasjon/
├── album/
│   ├── album.json          # Generated output (27 photos)
│   ├── album.html
│   ├── album.js
│   └── scripts/
│       └── build_album.py  # The metadata generator script
├── album/photos/
│   ├── IMG_5540.jpeg     # New photos with full EXIF data
│   ├── IMG_5573.jpeg
│   ├── IMG_5689.jpeg
│   ├── IMG_5758.jpeg
│   ├── IMG_5852.jpeg
│   ├── IMG_5862.jpeg
│   ├── IMG_5863.jpeg
│   ├── IMG_5864.jpeg
│   ├── IMG_5866.jpeg
│   ├── IMG_5868.jpeg
│   ├── IMG_5874.jpeg
│   └── IMG_5877.jpeg
```

### Useful commands:
- Run the script: `python3 album/scripts/build_album.py`
- Verify output: `python3 -c "import json; a=json.load(open('album/album.json')); print(len(a['photos']))"`

### Dependencies:
- Python 3.12+ (currently 3.12.10)
- `exiftool` (available at `/opt/homebrew/bin/exiftool`)
