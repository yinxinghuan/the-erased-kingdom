#!/usr/bin/env python3
"""Use platform img2img to turn rejected framed generations into full-bleed scene art."""

from __future__ import annotations

import json
import ssl
import time
import urllib.request
from pathlib import Path

from PIL import Image


API = "https://chat.aiwaves.tech/aigram/api/gen-image"
DEST = Path("/Users/yin/code/games/cinematic-story-template/src/story/img/worlds")
RAW = Path(__file__).resolve().parent / "raw"
HEADERS = {"Content-Type": "application/json", "Origin": "https://aigram.app", "Referer": "https://aigram.app/", "User-Agent": "Mozilla/5.0"}
SSL = ssl.create_default_context()

SOURCES = [
    (
        "cover",
        "https://cdn.aiwaves.tech/prod/telegram/avatar/0/1786292448365116.webp",
        "Transform the reference into a full-bleed cinematic film still photographed from inside the physical village. Preserve the courier, mapmaker, orchard, stone bridge, villagers, white spatial absence and distant knight as one continuous real environment. The image edges show only landscape, sky, ground and architecture. The white region is literal missing space inside the world. The mapmaker is being rescued, not posing. Remove every presentation device and emblem: the entire outer parchment, torn page edge, black surround, crown, seal badge, icon, red graphic stripe and decorative layout must cease to exist. No objects floating over the scene. Grounded premium high-fantasy realism, natural anatomy, late summer dusk, ordinary sharp square image corners. No title, words, letters, symbols, crown, crest, badge, border, frame, parchment, page, book, poster, UI or watermark.",
    ),
    (
        "entry",
        "https://cdn.aiwaves.tech/prod/telegram/avatar/0/1786292466738431.webp",
        "Transform the reference into a full-bleed cinematic 4:5-ready film still photographed from inside the physical village. Preserve the courier pulling the young mapmaker by the wrist, her applewood ruler, the orchard road and warm village dissolving into literal white spatial absence. Make the rescue urgent and natural. Extend real sky, architecture and ground to every outer image edge. Remove every presentation device and floating object: the entire outer parchment, torn page edge, black surround, crown, badge, hand icon, red graphic paint, open book and decorative layout must cease to exist. Keep faces, linked hands and ruler in the central portrait column. Grounded premium high-fantasy realism, natural anatomy, dusk light, ordinary sharp image corners. No title, words, letters, symbols, crown, crest, badge, border, frame, parchment, page, book, poster, UI or watermark.",
    ),
]


def call(prompt: str, ref_url: str) -> str:
    body = json.dumps({"prompt": prompt, "ref_url": ref_url}).encode()
    for attempt in range(3):
        try:
            request = urllib.request.Request(API, data=body, method="POST", headers=HEADERS)
            with urllib.request.urlopen(request, timeout=900, context=SSL) as response:
                result = json.loads(response.read())
            if result.get("url"):
                return result["url"]
            raise RuntimeError(result)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(8 * (attempt + 1))
    raise RuntimeError("unreachable")


def download(url: str, name: str) -> Path:
    path = RAW / f"{name}-repaired.png"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=300, context=SSL) as response:
        path.write_bytes(response.read())
    return path


def save_square(source: Path) -> None:
    image = Image.open(source).convert("RGB")
    side = min(image.size)
    x = (image.width - side) // 2
    y = (image.height - side) // 2
    image.crop((x, y, x + side, y + side)).resize((1024, 1024), Image.Resampling.LANCZOS).save(DEST / "the-erased-kingdom.webp", "WEBP", quality=90, method=6)


def save_portrait(source: Path) -> None:
    image = Image.open(source).convert("RGB")
    width = min(image.width, int(image.height * .8))
    height = int(width / .8)
    x = (image.width - width) // 2
    y = (image.height - height) // 2
    image.crop((x, y, x + width, y + height)).resize((1024, 1280), Image.Resampling.LANCZOS).save(DEST / "the-erased-kingdom-entry.webp", "WEBP", quality=90, method=6)


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    output_urls = []
    for index, (name, source, prompt) in enumerate(SOURCES):
        url = call(prompt, source)
        path = download(url, name)
        (save_square if name == "cover" else save_portrait)(path)
        output_urls.append(url)
        if index + 1 < len(SOURCES):
            time.sleep(4)
    print("\n".join(output_urls))


if __name__ == "__main__":
    main()
