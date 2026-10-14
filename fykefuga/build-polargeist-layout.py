"""Extract gameplay positions from a locally held Geometry Dash LevelData.plist.

The original game resource stays in the ignored _kjelder directory. Only
object IDs and positions needed for a new Fykefuga layout are published.
"""

import argparse
import base64
import gzip
import hashlib
import plistlib
from pathlib import Path


GROUPS = {
    "blocks": set(range(1, 8)),
    "spikes": {8, 39},
    "pits": {9},
    "pads": {35},
    "rings": {36},
    "ledges": {40},
    "chains": {41},
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    source_bytes = args.source.read_bytes()
    level = plistlib.loads(source_bytes)["3"]
    if not level.startswith("H4s"):
        level = "H4sIAAAAAAAAA" + level
    text = gzip.decompress(base64.urlsafe_b64decode(level + "=" * (-len(level) % 4))).decode()
    groups = {name: [] for name in GROUPS}
    for object_text in text.split(";")[1:]:
        fields = object_text.split(",")
        obj = dict(zip(fields[::2], fields[1::2]))
        if not {"1", "2", "3"}.issubset(obj):
            continue
        object_id = int(obj["1"])
        for name, ids in GROUPS.items():
            if object_id in ids:
                position = (object_id, round(float(obj["2"])), round(float(obj["3"])))
                # Key 5 mirrors a spike vertically; key 6 rotates it. Without
                # these, ceiling and wall spikes point into their own blocks.
                angle = int(float(obj.get("6", "0")))
                if name == "spikes" and obj.get("5") == "1":
                    angle = (angle + 180) % 360
                groups[name].append(position + (angle,) if angle else position)
                break

    lines = [
        "(function (root) {",
        "  'use strict';",
        "  // Gameplay coordinates from Polargeist (official level 3); no game artwork or audio.",
        "  // Source: LevelData.plist, 15th manifest in GuesterReal/Geometry-Dash-All-In-One.",
        "  // Source SHA-256: " + hashlib.sha256(source_bytes).hexdigest(),
        "  const groups = {",
    ]
    for name, objects in groups.items():
        lines.append("    " + name + ": [")
        for at in range(0, len(objects), 8):
            chunk = objects[at:at + 8]
            lines.append("      " + ", ".join("[" + ",".join(map(str, item)) + "]" for item in chunk) + ",")
        lines.append("    ],")
    lines.extend(["  };", "  root.Fykefuga.PolargeistSource = groups;", "})(window);"])
    args.output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print({name: len(items) for name, items in groups.items()})


if __name__ == "__main__":
    main()
