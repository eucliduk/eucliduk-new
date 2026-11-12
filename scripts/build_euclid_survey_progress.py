#!/usr/bin/env python3
"""Build a compact, time-aware sky mask from Euclid's reference schedule.

The Euclid Consortium visualiser draws every schedule row as an ecliptic
J2000 quadrilateral.  Loading that 22 MB source in the public interactive
would be wasteful and is blocked by CORS, so this script rasterises the first
scheduled-observation hour for every covered sky pixel into a two-byte PNG.

The red byte is the low byte and green is the high byte.  Zero means that a
pixel is outside the reference schedule.  The browser compares the decoded
hour with the latest completed UTC hour, allowing the overlay to advance
without a daily download.
"""

from __future__ import annotations

import argparse
import base64
import json
import math
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image, ImageDraw


UTC = timezone.utc
DEFAULT_SOURCE = (
    "https://www.euclid-ec.org/survey-map/footprint/rsd2026a_small.txt"
)
DEFAULT_VISUALISER = (
    "https://www.euclid-ec.org/survey-map/euclid_footprint.html"
)
SCHEDULE_EPOCH = datetime(2024, 2, 14, tzinfo=UTC)
MAX_ENCODED_HOUR = 65_534


@dataclass(frozen=True)
class Pointing:
    when: datetime
    corners: tuple[tuple[float, float], ...]


def parse_utc(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError(f"Timestamp has no timezone: {value!r}")
    return parsed.astimezone(UTC)


def read_source(source: str) -> tuple[str, dict[str, str]]:
    path = Path(source)
    if path.exists():
        return path.read_text(encoding="utf-8"), {}

    request = Request(
        source,
        headers={
            "Accept": "text/plain",
            "User-Agent": "eucliduk.github.io survey-mask builder/1.0",
        },
    )
    with urlopen(request, timeout=120) as response:
        if response.status != 200:
            raise RuntimeError(f"Schedule request returned HTTP {response.status}")
        metadata = {
            "etag": response.headers.get("ETag", ""),
            "lastModified": response.headers.get("Last-Modified", ""),
        }
        return response.read().decode("utf-8"), metadata


def parse_pointings(text: str) -> list[Pointing]:
    pointings: list[Pointing] = []
    previous: datetime | None = None

    for line_number, raw_line in enumerate(text.splitlines(), 1):
        line = raw_line.strip()
        if not line:
            continue
        columns = line.split()
        if columns[0] != "POINTING" or len(columns) < 17:
            raise RuntimeError(f"Malformed schedule row {line_number}")

        when = parse_utc(columns[2])
        if previous is not None and when < previous:
            raise RuntimeError("Schedule timestamps are not ordered")
        previous = when

        corners = tuple(
            (float(columns[index]), float(columns[index + 1]))
            for index in range(9, 17, 2)
        )
        if len(corners) != 4 or not all(
            math.isfinite(value)
            for corner in corners
            for value in corner
        ):
            raise RuntimeError(f"Invalid footprint corners on row {line_number}")
        pointings.append(Pointing(when=when, corners=corners))

    if not pointings:
        raise RuntimeError("The schedule contains no POINTING rows")
    if pointings[0].when < SCHEDULE_EPOCH:
        raise RuntimeError("The configured schedule epoch is too late")
    return pointings


def unwrap_longitudes(corners: tuple[tuple[float, float], ...]) -> list[tuple[float, float]]:
    longitudes = [longitude % 360 for longitude, _ in corners]
    if max(longitudes) - min(longitudes) > 180:
        longitudes = [
            longitude + 360 if longitude < 180 else longitude
            for longitude in longitudes
        ]
    return [
        (longitude, corners[index][1])
        for index, longitude in enumerate(longitudes)
    ]


def polygon_pixels(
    corners: tuple[tuple[float, float], ...],
    width: int,
    height: int,
) -> list[tuple[float, float]]:
    return [
        (
            longitude / 360 * width,
            (90 - latitude) / 180 * height,
        )
        for longitude, latitude in unwrap_longitudes(corners)
    ]


def encoded_hour(when: datetime) -> int:
    elapsed = math.floor((when - SCHEDULE_EPOCH).total_seconds() / 3600)
    value = elapsed + 1
    if not 1 <= value <= MAX_ENCODED_HOUR:
        raise RuntimeError(f"Schedule hour {value} cannot be encoded in two bytes")
    return value


def rasterise(
    pointings: list[Pointing],
    width: int,
    height: int,
) -> Image.Image:
    image = Image.new("RGB", (width, height), (0, 0, 0))
    draw = ImageDraw.Draw(image)

    # Drawing newest-to-oldest means an earlier revisit overwrites a later one,
    # leaving each pixel with its first scheduled-observation hour.
    for pointing in reversed(pointings):
        value = encoded_hour(pointing.when)
        colour = (value & 255, value >> 8, 0)
        polygon = polygon_pixels(pointing.corners, width, height)
        draw.polygon(polygon, fill=colour)
        draw.polygon([(x - width, y) for x, y in polygon], fill=colour)
        draw.polygon([(x + width, y) for x, y in polygon], fill=colour)

    return image


def write_metadata(
    path: Path,
    pointings: list[Pointing],
    source_url: str,
    source_headers: dict[str, str],
    width: int,
    height: int,
) -> None:
    metadata = {
        "schedule": "RSD2026a",
        "scheduleEpoch": SCHEDULE_EPOCH.isoformat().replace("+00:00", "Z"),
        "scheduleStart": pointings[0].when.isoformat().replace("+00:00", "Z"),
        "scheduleEnd": pointings[-1].when.isoformat().replace("+00:00", "Z"),
        "pointingCount": len(pointings),
        "sourceUrl": source_url,
        "visualiserUrl": DEFAULT_VISUALISER,
        "sourceLastModified": source_headers.get("lastModified", ""),
        "sourceEtag": source_headers.get("etag", ""),
        "textureWidth": width,
        "textureHeight": height,
        "encoding": "RG little-endian first-observation hour; 0 means uncovered",
    }
    output = (
        "window.EUCLID_SURVEY_PROGRESS_DATA="
        + json.dumps(metadata, separators=(",", ":"))
        + ";\n"
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(output, encoding="ascii")


def write_base64_wrapper(input_path: Path, output_path: Path) -> None:
    encoded = base64.b64encode(input_path.read_bytes()).decode("ascii")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        f'window.EUCLID_SURVEY_PROGRESS_TEXTURE_BASE64="{encoded}";\n',
        encoding="ascii",
    )


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        default=DEFAULT_SOURCE,
        help="Official schedule URL or a local downloaded copy",
    )
    parser.add_argument(
        "--texture",
        type=Path,
        default=Path("assets/textures/euclid-survey-progress-rg.png"),
    )
    parser.add_argument(
        "--metadata",
        type=Path,
        default=Path("euclid-survey-progress-data.js"),
    )
    parser.add_argument(
        "--base64-wrapper",
        type=Path,
        default=Path(
            "assets/textures/euclid-survey-progress-rg.base64.js"
        ),
    )
    parser.add_argument("--width", type=int, default=8192)
    parser.add_argument("--height", type=int, default=4096)
    return parser.parse_args()


def main() -> int:
    options = arguments()
    if options.width < 512 or options.height < 256:
        raise RuntimeError("The survey texture resolution is too low")
    if options.width != options.height * 2:
        raise RuntimeError("The survey texture must use a 2:1 sky projection")

    text, source_headers = read_source(options.source)
    pointings = parse_pointings(text)
    image = rasterise(pointings, options.width, options.height)

    options.texture.parent.mkdir(parents=True, exist_ok=True)
    image.save(options.texture, format="PNG", optimize=True, compress_level=9)
    write_metadata(
        options.metadata,
        pointings,
        options.source
        if options.source.startswith(("https://", "http://"))
        else DEFAULT_SOURCE,
        source_headers,
        options.width,
        options.height,
    )
    write_base64_wrapper(options.texture, options.base64_wrapper)

    print(
        f"Wrote {options.texture} ({options.texture.stat().st_size:,} bytes), "
        f"{options.metadata}, and {options.base64_wrapper} "
        f"from {len(pointings):,} pointings."
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"error: {error}", file=sys.stderr)
        raise
