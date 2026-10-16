#!/usr/bin/env python3
"""
Build album.json from photos in ./album/photos/
Reads ISO, shutter speed, aperture, focal length, date, camera and lens from EXIF.
For missing values uses "unknown" or "" as appropriate.

Usage: python3 build_album.py
"""
import json, os, subprocess

photos_dir = "./album/photos"
output_file = "./album/album.json"

original = [
    {"file": "File_SNF.JPG", "title": "Sunset", "description": "Blue hour over the city, with the last orange light fading behind the hills and the fjord.", "iso": "unknown", "ss": "unknown", "apature": "unknown", "focal-length": "unknown", "date": "2025-11-19", "location": "Oslo / Norway", "camera": "Canon EOS 30D", "lens": "Canon EF-S 17-85mm f/4-5.6 IS USM", "tags": ["sunset", "city", "landscape"]},
    {"file": "IMG_6716.jpg", "title": "The old tree", "description": "A giant shade tree standing over the greens in late afternoon light.", "iso": "100", "ss": "1/100 sec", "apature": "f / 3.5", "focal-length": "16 mm", "date": "2026-07-29", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["landscape", "nature", "travel"]},
    {"file": "IMG_6721.jpg", "title": "Kite on watch", "description": "A black kite perched at the very tip of a bare branch, keeping an eye on the photographer.", "iso": "400", "ss": "1/2000 sec", "apature": "f / 7.1", "focal-length": "296 mm", "date": "2026-07-30", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["wildlife", "birds"]},
    {"file": "IMG_6994.JPG", "title": "Wings out", "description": "A cormorant spreading its wings to dry in the middle of the lake.", "iso": "250", "ss": "1/1250 sec", "apature": "f / 7.1", "focal-length": "262 mm", "date": "2026-07-30", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["wildlife", "birds", "water"]},
    {"file": "IMG_7244.jpg", "title": "Dust trail", "description": "A safari truck kicking up dust as it crosses the plains.", "iso": "200", "ss": "1/1000 sec", "apature": "f / 7.1", "focal-length": "149 mm", "date": "2026-07-31", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["safari", "landscape", "travel"]},
    {"file": "IMG_7260.jpg", "title": "Sunbird", "description": "A scarlet-chested sunbird feeding upside down on aloe flowers.", "iso": "1000", "ss": "1/20 sec", "apature": "f / 7.1", "focal-length": "300 mm", "date": "2026-08-01", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["wildlife", "birds"]},
    {"file": "IMG_7819.jpg", "title": "Little bee-eater", "description": "A little bee-eater resting on a thin branch against a soft, warm background.", "iso": "160", "ss": "1/640 sec", "apature": "f / 7.1", "focal-length": "300 mm", "date": "2026-08-02", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["wildlife", "birds"]},
    {"file": "IMG_7923.JPG", "title": "Lookout", "description": "A cheetah scanning the savanna from the top of a termite mound.", "iso": "unknown", "ss": "unknown", "apature": "unknown", "focal-length": "unknown", "date": "2026-08-02", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["wildlife", "safari", "big cats"]},
    {"file": "IMG_7924.JPG", "title": "Eye contact", "description": "The same cheetah turning to look straight into the lens.", "iso": "unknown", "ss": "unknown", "apature": "unknown", "focal-length": "unknown", "date": "2026-08-02", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["wildlife", "safari", "big cats"]},
    {"file": "IMG_7986.jpg", "title": "Burning sky", "description": "The sun sinking through smoke and haze, broken up by thin clouds.", "iso": "400", "ss": "1/1250 sec", "apature": "f / 7.1", "focal-length": "300 mm", "date": "2026-08-02", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["sunset", "sky"]},
    {"file": "IMG_8285.JPG", "title": "Purple sheen", "description": "A Rüppell's starling showing off its iridescent violet feathers in the dry grass.", "iso": "unknown", "ss": "unknown", "apature": "unknown", "focal-length": "unknown", "date": "2026-08-03", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["wildlife", "birds"]},
    {"file": "IMG_8293.JPG", "title": "Starling pair", "description": "Two Rüppell's starlings foraging together on the grassland.", "iso": "unknown", "ss": "unknown", "apature": "unknown", "focal-length": "unknown", "date": "2026-08-03", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["wildlife", "birds"]},
    {"file": "IMG_8297.jpg", "title": "Water lilies", "description": "Blue water lilies opening above a pond full of lily pads.", "iso": "100", "ss": "1/400 sec", "apature": "f / 7.1", "focal-length": "248 mm", "date": "2026-08-03", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["nature", "flowers", "water"]},
    {"file": "IMG_8557.jpg", "title": "Low tide", "description": "A small boat resting on the sand flats as the evening light turns everything gold.", "iso": "160", "ss": "1/1250 sec", "apature": "f / 5.6", "focal-length": "63 mm", "date": "2026-08-06", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["sunset", "water", "travel"]},
    {"file": "IMG_8658.jpg", "title": "Tractor taxi", "description": "A tractor pulling passengers across the shallows at sunset.", "iso": "200", "ss": "1/3200 sec", "apature": "f / 3.5", "focal-length": "16 mm", "date": "2026-08-07", "location": "Kenya", "camera": "Canon EOS R50 V", "lens": "Sigma 16-300mm F3.5-6.7 DC OS", "tags": ["sunset", "water", "travel"]},
]

new_images = [
    "IMG_5540.jpeg", "IMG_5573.jpeg", "IMG_5689.jpeg", "IMG_5758.jpeg",
    "IMG_5852.jpeg", "IMG_5862.jpeg", "IMG_5863.jpeg", "IMG_5864.jpeg",
    "IMG_5866.jpeg", "IMG_5868.jpeg", "IMG_5874.jpeg", "IMG_5877.jpeg",
]

photo_entries = list(original)


def parse_exif(filepath):
    """Run exiftool on a file and extract camera metadata from full output."""
    iso = "unknown"
    ss = "unknown"
    aperture = "unknown"
    focal_length = "unknown"
    date = ""
    camera = "unknown"
    lens = "unknown"

    result = subprocess.run(
        ["exiftool", filepath],
        capture_output=True, text=True, timeout=30
    )

    for line in result.stdout.splitlines():
        if ":" not in line:
            continue
        key, val = line.split(":", 1)
        key = key.strip()
        val = val.strip()

        # ISO — use Recommended Exposure Index (for JPEGs without raw ISO)
        if "ISO" in key and not "RecommendedExposureIndex" in key:
            iso = val or "unknown"
        elif "RecommendedExposureIndex" in key:
            iso = val or "unknown"

        # Shutter speed / SS — ExposureTime (decimal) is the key field
        if "Exposure Time" in line or "ExposureTime" in line:
            if val and "." in val:
                sec = float(val)
                denom = round(1.0 / sec) if sec > 0 else 1
                ss = "1/" + str(int(denom)) + " sec" if denom > 0 else "unknown"
            elif val:
                ss = val or "unknown"

        # Aperture / aperture (f-number) — F Number
        if "F Number" in key:
            aperture = "f / " + val if val else "unknown"

        # Focal length — Focal Length
        if "Focal Length" in key:
            # exiftool includes "(35 mm equivalent: XXX mm)" — strip it
            val = val.split('(')[0].strip() if '(' in val else val
            focal_length = val + " mm" if not val.endswith("mm") else val or "unknown"

        # Date
        if "Date/Time Original" in key:
            parts = val.split()
            if len(parts) >= 1:
                date = parts[0].replace(":", "-")

        # Camera model (Camera Model Name) — this gives the full camera name like "Canon EOS R50 V"
        if "Camera Model Name" in key:
            camera = val.strip() or "unknown"

        # Lens model
        if "Lens Model" in key:
            lens = val.split('|')[0].strip() or "unknown"
        elif "Lens ID" in key:
            lens = val.split('|')[0].strip() or "unknown"

    return iso, ss, aperture, focal_length, date, camera, lens


for filename in new_images:
    filepath = os.path.join(photos_dir, filename)
    print("Processing: " + filename)

    iso, ss, aperture, focal_length, date, camera, lens = parse_exif(filepath)

    entry = {
        "file": filename,
        "title": os.path.splitext(filename)[0],
        "description": "",
        "iso": iso,
        "ss": ss,
        "apature": aperture,
        "focal-length": focal_length,
        "date": date,
        "location": "",
        "camera": camera or "unknown",
        "lens": lens,
        "tags": []
    }

    photo_entries.append(entry)
    print("  -> iso=" + iso + ", ss=" + ss + ", apature=" + aperture +
          ", focal-length=" + focal_length + ", date=" + date)

album = {
    "title": "photo_album",
    "description": "Moments, places and things I've seen.",
    "photos": photo_entries
}

with open(output_file, "w") as f:
    json.dump(album, f, indent=2, ensure_ascii=False)

print("Done! Total photos: " + str(len(photo_entries)))
