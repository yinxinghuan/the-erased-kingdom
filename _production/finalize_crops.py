#!/usr/bin/env python3
"""Crop accepted full-scene regions from platform generations."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
DEST = Path("/Users/yin/code/games/cinematic-story-template/src/story/img/worlds")


def main() -> None:
    # The repaired cover contains a clean continuous village scene inside the
    # rejected presentation border. This crop removes that border completely.
    cover = Image.open(ROOT / "raw" / "cover-repaired.png").convert("RGB")
    cover_scene = cover.crop((70, 70, 954, 954)).resize((1024, 1024), Image.Resampling.LANCZOS)
    cover_scene.save(DEST / "the-erased-kingdom.webp", "WEBP", quality=90, method=6)
    # Development listing image. It contains no text, so it also satisfies the
    # platform rule that a poster must never contain Chinese characters.
    cover_scene.save(ROOT.parent / "public" / "poster.png", "PNG", optimize=True)

    # The repaired entry placed the original narrative scene inside a frame.
    # Crop only the scene pixels into the required 4:5 master; no frame remains.
    entry = Image.open(ROOT / "raw" / "entry-repaired.png").convert("RGB")
    entry.crop((300, 277, 699, 776)).resize((1024, 1280), Image.Resampling.LANCZOS).save(
        DEST / "the-erased-kingdom-entry.webp", "WEBP", quality=90, method=6,
    )


if __name__ == "__main__":
    main()
