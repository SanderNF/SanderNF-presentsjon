#!/usr/bin/env python3
"""
Build small self-hosted WOFF2 fonts from the Nerd Font sources in assets/fonts/src/.

The source TTFs are ~2.5 MB each because they carry thousands of Nerd Font
icons. The text fonts keep only Latin text plus every non-ASCII character the
site uses; the icons go in their own font (snf-icons.woff2) holding just the
icons the site uses, so each file ends up a few tens of KB.

Icons are picked up automatically: write one anywhere in the site as a JS
escape ("\\ue826" or "\\udb81\\udfd3"), an HTML entity (&#xe826;) or the
glyph itself, then re-run this script.
Look them up at https://www.nerdfonts.com/cheat-sheet

Usage:   pip install fonttools brotli
         python3 assets/fonts/build_fonts.py
"""

import os, re
from fontTools import subset
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(HERE, "src")

# source file -> output file. Every font here gets an @font-face in style.css; browsers only download the ones in use.
TEXT_FONTS = {
    "UbuntuNerdFont-Regular.ttf":        "ubuntu-regular.woff2",
    "UbuntuNerdFont-Bold.ttf":           "ubuntu-bold.woff2",
    "TerminessNerdFontMono-Regular.ttf": "terminess-regular.woff2",
    "TerminessNerdFontMono-Bold.ttf":    "terminess-bold.woff2",
    "ProFontIIxNerdFont-Regular.ttf":    "profont-regular.woff2",
    "JetBrainsMonoNerdFont-Regular.ttf": "jetbrainsmono-regular.woff2",
    "JetBrainsMonoNerdFont-Bold.ttf":    "jetbrainsmono-bold.woff2",
    "MartianMonoNerdFont-Regular.ttf":   "martianmono-regular.woff2",
    "MartianMonoNerdFont-Bold.ttf":      "martianmono-bold.woff2",
    "MononokiNerdFont-Regular.ttf":      "mononoki-regular.woff2",
    "MononokiNerdFont-Bold.ttf":         "mononoki-bold.woff2",
    "RobotoMonoNerdFont-Regular.ttf":    "robotomono-regular.woff2",
    "RobotoMonoNerdFont-Bold.ttf":       "robotomono-bold.woff2",
    "ShureTechMonoNerdFont-Regular.ttf": "sharetechmono-regular.woff2",
}
# "Propo" = icons at their natural width instead of squeezed into one cell
ICON_FONT = ("UbuntuNerdFontPropo-Regular.ttf", "snf-icons.woff2")

BASE_RANGES = [
    (0x0020, 0x007E),  # Basic Latin
    (0x00A0, 0x00FF),  # Latin-1 (æ ø å é …)
    (0x2010, 0x2027),  # dashes, quotes, bullet, ellipsis
    (0x2190, 0x21FF),  # arrows
    (0x2500, 0x259F),  # box drawing + block elements (ASCII art, caret)
]

SITE_FILES = re.compile(r"\.(html|js|css|md|json)$")
JS_ESCAPES = re.compile(r"(?:\\u[0-9a-fA-F]{4})+")
HTML_ENTITY = re.compile(r"&#x([0-9a-fA-F]+);")


def is_icon(cp):
    """Nerd Font icons live in the Private Use Areas."""
    return 0xE000 <= cp <= 0xF8FF or 0xF0000 <= cp <= 0xFFFFD


def site_chars():
    """Every non-ASCII character used in the site's own files, including escaped ones."""
    chars = set()
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if not d.startswith(".") and d not in ("server", "photos", "src")]
        for name in filenames:
            if not SITE_FILES.search(name):
                continue
            with open(os.path.join(dirpath, name), encoding="utf-8", errors="ignore") as f:
                text = f.read()
            for m in JS_ESCAPES.findall(text):
                # "󰟓" is a surrogate pair: decode it to the one codepoint it stands for
                decoded = m.encode().decode("unicode_escape").encode("utf-16", "surrogatepass").decode("utf-16", "ignore")
                text += decoded
            text += "".join(chr(int(h, 16)) for h in HTML_ENTITY.findall(text))
            chars.update(ord(c) for c in text if ord(c) > 0x7E)
    return chars


def build(src, out, unicodes):
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True

    font = TTFont(os.path.join(SRC, src))
    available = set(font.getBestCmap())
    sub = subset.Subsetter(options)
    sub.populate(unicodes=unicodes & available)
    sub.subset(font)
    path = os.path.join(HERE, out)
    font.flavor = "woff2"
    font.save(path)
    print(f"{out:26} {os.path.getsize(path) / 1024:6.1f} KB")
    return unicodes - available


def main():
    used = site_chars()
    icons = {c for c in used if is_icon(c)}
    text = used - icons
    for lo, hi in BASE_RANGES:
        text.update(range(lo, hi + 1))

    for src, out in TEXT_FONTS.items():
        build(src, out, text)
    missing = build(*ICON_FONT, icons)
    if missing:
        print("icons not in the font:", " ".join(f"U+{c:X}" for c in sorted(missing)))


if __name__ == "__main__":
    main()
