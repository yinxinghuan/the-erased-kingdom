#!/usr/bin/env python3
"""Generate the Erased Kingdom cover and portrait entry art through Aigram transit."""

from __future__ import annotations

import json
import ssl
import time
import urllib.request
from pathlib import Path

from PIL import Image


API = "https://chat.aiwaves.tech/aigram/api/gen-image"
ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "src" / "story" / "img" / "worlds"
RAW = ROOT / "_production" / "raw"
HEADERS = {
    "Content-Type": "application/json",
    "Origin": "https://aigram.app",
    "Referer": "https://aigram.app/",
    "User-Agent": "Mozilla/5.0",
}
SSL = ssl.create_default_context()

COVER_PROMPT = (
    "Square full-bleed cinematic grounded high-fantasy narrative scene with ordinary sharp image edges. "
    "A traveling courier and a young woman mapmaker stand at the edge of a warm orchard village being erased from physical reality: "
    "the left half remains richly colored with apple trees, stone bridge, bakery fire and villagers, while the right half becomes silent "
    "ivory spatial absence with missing roads and architecture, not torn paper. A distant armored royal knight rides toward them. "
    "One small unmarked brass hand seal glints in the courier's hand. Grounded medieval clothing, natural anatomy, expressive faces, tactile stone "
    "and wood, cobalt accents, one vermilion deletion trace, restrained brass light, adventurous and emotionally clear, premium editorial "
    "fantasy realism. Central subjects and village conflict remain readable at 160 by 160. Full bleed, sharp square corners. "
    "This is a real landscape and an unfolding rescue, never a poster or book cover. Absolutely no title, no letters, no words, no numbers, "
    "no Chinese characters, no pseudo-text, no crown, no crest, no logo, no UI, no border, no frame, no parchment, no page corners, no book, no paper collage."
)

ENTRY_PROMPT = (
    "Create a fresh 4:5 portrait opening scene for a cinematic grounded high-fantasy RPG. This is the instant BEFORE the player makes any choice: "
    "at dusk on the village road of warm Apple Vale, a border courier has just turned back after delivering an ordinary sealed letter; nearby, "
    "the young cartographer Mara stands separately, gripping an old applewood ruler and urgently warning the courier. Behind them, the village road "
    "sign has suddenly become blank, distant orchard houses are losing colour and dissolving into silent clean ivory absence, and a confused wagon "
    "driver looks back from the road. A clerk opening the letter may be visible only as a small background figure in the registry-house doorway. "
    "The courier and Mara are the two readable focal subjects, with space between them. Show shock, uncertainty and the first onset of erasure. "
    "IMPORTANT temporal continuity: no handshake, no touching, no pulling, no rescue, no completed spell, no restored landmark, no royal seal being "
    "used, no battle, no knight. Natural anatomy, lived-in medieval clothing, broad readable environment, cobalt clothing accent and restrained "
    "vermilion deletion traces, cinematic dusk light, central 58 percent safe composition, no text, no readable letters, no title, no logo, no UI, no decorative frame."
)
ENTRY_REF_URL = "https://images.aiwaves.tech/uploads/1786300261780-qwdssm8a9j.webp"


def generate(prompt: str, name: str, ref_url: str | None = None) -> tuple[str, Path]:
    body = json.dumps({"prompt": prompt, **({"ref_url": ref_url} if ref_url else {})}).encode()
    result = None
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(API, data=body, method="POST", headers=HEADERS)
            with urllib.request.urlopen(request, timeout=900, context=SSL) as response:
                result = json.loads(response.read())
            break
        except Exception as error:
            last_error = error
            if attempt == 2:
                raise
            time.sleep(8 * (attempt + 1))
    if result is None:
        raise RuntimeError(last_error)
    url = result.get("url")
    if not url:
        raise RuntimeError(result)
    path = RAW / f"{name}.png"
    download = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(download, timeout=300, context=SSL) as response:
        path.write_bytes(response.read())
    return url, path


def square(source: Path, output: Path) -> None:
    image = Image.open(source).convert("RGB")
    side = min(image.size)
    left = (image.width - side) // 2
    top = (image.height - side) // 2
    image.crop((left, top, left + side, top + side)).resize((1024, 1024), Image.Resampling.LANCZOS).save(output, "WEBP", quality=90, method=6)


def portrait(source: Path, output: Path) -> None:
    image = Image.open(source).convert("RGB")
    target_ratio = 4 / 5
    width = min(image.width, int(image.height * target_ratio))
    height = min(image.height, int(width / target_ratio))
    left = (image.width - width) // 2
    top = (image.height - height) // 2
    image.crop((left, top, left + width, top + height)).resize((1024, 1280), Image.Resampling.LANCZOS).save(output, "WEBP", quality=90, method=6)


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    DEST.mkdir(parents=True, exist_ok=True)
    cover_url, cover_raw = generate(COVER_PROMPT, "cover")
    time.sleep(4)
    entry_url, entry_raw = generate(ENTRY_PROMPT, "entry", ENTRY_REF_URL)
    square(cover_raw, DEST / "the-erased-kingdom.webp")
    portrait(entry_raw, DEST / "the-erased-kingdom-entry.webp")
    provenance = ROOT / "doc" / "image-provenance.md"
    provenance.write_text(
        "# 制作期图像来源\n\n"
        "- 接口：`POST https://chat.aiwaves.tech/aigram/api/gen-image`\n"
        "- 请求 Origin：`https://aigram.app`\n"
        "- 生成方式：平台 transit 文生图；未使用 ComfyUI、本地工作流、SVG、Canvas 或 UI 截图。\n"
        f"- 封面原图：{cover_url}\n"
        f"- 入口原图：{entry_url}\n"
        "- 入口图后处理：仅执行中央 4:5 裁切与缩放，不增加文字、边框或程序化图形。\n\n"
        "## Cover prompt\n\n```text\n" + COVER_PROMPT + "\n```\n\n"
        "## Entry prompt\n\n```text\n" + ENTRY_PROMPT + "\n```\n",
        encoding="utf-8",
    )
    print(cover_url)
    print(entry_url)


if __name__ == "__main__":
    main()
