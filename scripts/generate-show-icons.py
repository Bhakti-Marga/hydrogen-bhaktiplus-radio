#!/usr/bin/env python3
"""Generate live show cards via MiniMax Image API."""

import os
import requests

API_KEY = os.getenv(
    "MINIMAX_API_KEY",
    "sk-api-SXF6_6tJkuBjUzj-TPH5c_cA1e1CYYblCgsXhllpn30O_lv1_xFF1ItsNLJrJtsk43JziO7cKwA8B3QKBU85yAroeC1W9UMp7brQYSd9ENTVOl1M1uWb_IQ",
)

BASE_URL = "https://api.minimax.io"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "assets", "shows")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SHOWS = [
    {
        "name": "friday-bhakti-live",
        "prompt": "A vibrant warm stage scene for a spiritual live talk show. A glowing microphone on a stand with warm golden spotlight, cozy atmosphere with deep navy and amber tones, bokeh lights in background. Inviting, joyful, warm ambiance. Cinematic wide format. No text, no people.",
    },
    {
        "name": "saturday-kirtan-night",
        "prompt": "A magical Saturday night kirtan music concert scene. Golden harmonium and musical instruments on stage with warm candle lights, sacred atmosphere, devotional music night with deep purple and gold tones, bokeh lights, mystical ambiance. Cinematic wide format. No text, no people.",
    },
    {
        "name": "sunday-program",
        "prompt": "A serene Sunday spiritual gathering scene. A beautiful temple hall with warm golden light streaming through windows, sacred atmosphere, flowers and candles, peaceful devotional setting with deep navy blue and gold tones. Cinematic wide format. No text, no people.",
    },
]


def generate_image(show: dict) -> str:
    path = os.path.join(OUTPUT_DIR, f"{show['name']}.png")
    if os.path.exists(path):
        print(f"  {show['name']} — already exists, skipping")
        return path

    print(f"  Generating {show['name']}...")
    payload = {
        "model": "image-01",
        "prompt": show["prompt"],
        "aspect_ratio": "16:9",
        "response_format": "url",
        "n": 1,
    }

    resp = requests.post(
        f"{BASE_URL}/v1/image_generation",
        headers=HEADERS,
        json=payload,
        timeout=120,
    )
    resp.raise_for_status()
    result = resp.json()

    status = result.get("base_resp", {}).get("status_code", -1)
    if status != 0:
        msg = result.get("base_resp", {}).get("status_msg", "unknown error")
        raise RuntimeError(f"Image error: {status} — {msg}")

    img_url = result["data"]["image_urls"][0]
    img_data = requests.get(img_url, timeout=60).content
    with open(path, "wb") as f:
        f.write(img_data)
    print(f"  -> {show['name']}.png ({len(img_data) // 1024} KB)")
    return path


if __name__ == "__main__":
    print("Generating show images via MiniMax...")
    for show in SHOWS:
        try:
            generate_image(show)
        except Exception as e:
            print(f"  ERROR for {show['name']}: {e}")
    print("Done!")
