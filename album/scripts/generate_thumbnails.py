#!/usr/bin/env python3
"""
Generate compressed thumbnail previews for photo gallery images.

Usage:   python3 generate_thumbnails.py        # generates from all photos
         python3 generate_thumbnails.py --help  # show options

Output:  album/photos/thumbnails/IMG_6716-thumb.jpg
         (same aspect ratio, max 600px wide, JPEG quality=25)
"""

import argparse, json, os, sys
from PIL import Image


def make_thumbnail(src_path, thumb_dir):
    """Create a compressed thumbnail from src_path and save in thumb_dir."""
    basename = os.path.splitext(os.path.basename(src_path))[0]
    ext = os.path.splitext(src_path)[1].lower()

    # Output filename: keep original extension, add -thumb prefix
    if ext in ('.jpg', '.jpeg'):
        thumb_ext = '.jpg'
    else:
        thumb_ext = ext

    thumb_path = os.path.join(thumb_dir, f"{basename}-thumb{thumb_ext}")

    with Image.open(src_path) as img:
        # Convert to RGB if needed (e.g. RGBA -> JPEG, CMYK -> RGB)
        if img.mode in ('RGBA', 'P'):
            # Create a white background for transparency
            bg = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            bg.paste(img, mask=img.split()[-1]) if img.mode == "RGBA" else bg.paste(img)
            img = bg
        elif img.mode not in ('RGB', 'L'):
            img = img.convert("RGB")

        # Resize to max 600px wide, maintain aspect ratio
        if img.width > 600:
            ratio = 600 / img.width
            new_size = (int(img.width * ratio), int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        # Save as heavily compressed JPEG (~2-4 KB per image, ~10% of original)
        img.save(
            thumb_path,
            format="JPEG",
            quality=25,          # very low quality for preview only
            optimize=True,       # extra compression pass
        )

    return thumb_path


def main():
    parser = argparse.ArgumentParser(
        description="Generate compressed thumbnails for gallery photos."
    )
    parser.add_argument(
        "--photos-dir", default="./album/photos/",
        help="Directory containing source photos (default: ./album/photos/)"
    )
    parser.add_argument(
        "--output-dir", default="./album/photos/thumbnails/",
        help="Directory to save thumbnails (default: ./album/photos/thumbnails/)"
    )
    args = parser.parse_args()

    photos_dir = os.path.abspath(args.photos_dir)
    thumb_dir = os.path.abspath(args.output_dir)

    os.makedirs(thumb_dir, exist_ok=True)

    supported_ext = ('.jpg', '.jpeg', '.png', '.bmp', '.tiff')
    files = [f for f in os.listdir(photos_dir) if f.lower().endswith(supported_ext)]
    files.sort()

    print(f"Found {len(files)} images in {photos_dir}")
    print(f"Writing thumbnails to {thumb_dir}\n")

    for filename in files:
        src = os.path.join(photos_dir, filename)
        try:
            thumb_path = make_thumbnail(src, thumb_dir)
            orig_size = os.path.getsize(src) / 1024
            thumb_size = os.path.getsize(thumb_path) / 1024
            ratio = (orig_size - thumb_size) / orig_size * 100 if orig_size else 0
            print(f"  {filename:35s}  {orig_size:8.1f} KB → {thumb_size:6.1f} KB  ({ratio:.0f}% smaller)")
        except Exception as e:
            print(f"  {filename:35s}  ERROR: {e}")

    print(f"\nDone! {len(files)} thumbnails generated.")


if __name__ == "__main__":
    main()
