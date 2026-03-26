#!/usr/bin/env python3
"""Generate radio station icons via MiniMax Image API."""

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

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "assets", "stations")
os.makedirs(OUTPUT_DIR, exist_ok=True)

STATIONS = [
    {
        "name": "main-radio",
        "prompt": "A vibrant glowing golden lotus flower with bright radio sound waves radiating upward, rich warm gold and amber colors, luminous petals, on a solid deep navy blue background. Bold, vivid, high contrast illustration. Large centered subject filling most of the frame. No text.",
    },
    {
        "name": "mantra-radio",
        "prompt": "A large bright golden Om symbol glowing with divine light, surrounded by vibrant concentric sound wave circles in gold and amber. Rich warm luminous colors against solid deep purple background. Bold, vivid, high contrast spiritual illustration. Large centered subject. No text.",
    },
    {
        "name": "stories-radio",
        "prompt": "A large open ancient sacred book with bright golden light and sparks radiating from its pages, warm amber glow, lotus petals floating around, luminous and vivid. Solid deep navy blue background. Bold high contrast spiritual illustration. Large centered subject. No text.",
    },
    {
        "name": "kirtan-circle",
        "prompt": "A bright golden harmonium musical instrument in the center surrounded by a glowing circle of golden musical notes and symbols, warm amber light emanating outward. Solid deep navy blue background. Bold, vivid, high contrast illustration. Large centered subject filling the frame. No text.",
    },
]


def generate_icon(station: dict) -> str:
    path = os.path.join(OUTPUT_DIR, f"{station['name']}.png")
    if os.path.exists(path):
        print(f"  {station['name']} — already exists, skipping")
        return path

    print(f"  Generating {station['name']}...")
    payload = {
        "model": "image-01",
        "prompt": station["prompt"],
        "aspect_ratio": "1:1",
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
    print(f"  -> {station['name']}.png ({len(img_data) // 1024} KB)")
    return path


if __name__ == "__main__":
    print("Generating station icons via MiniMax...")
    for station in STATIONS:
        try:
            generate_icon(station)
        except Exception as e:
            print(f"  ERROR for {station['name']}: {e}")
    print("Done!")
