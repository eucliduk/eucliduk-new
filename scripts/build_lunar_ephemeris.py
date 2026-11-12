#!/usr/bin/env python3
"""Cache geometric NASA/JPL Moon and Sun states for the orbit interactive."""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

from update_euclid_ephemeris import Row, fetch_vectors, parse_history_date


def read_orbit_dates(path: Path) -> list[datetime]:
    match = re.search(
        r"window\.EUCLID_ORBIT_DATA\s*=\s*(\{.*\});?\s*$",
        path.read_text(encoding="utf-8"),
        re.DOTALL,
    )
    if not match:
        raise ValueError(f"No Euclid trajectory data found in {path}")
    dates = [parse_history_date(value) for value in json.loads(match[1])["dates"]]
    if len(dates) < 2 or any(
        later <= earlier for earlier, later in zip(dates, dates[1:])
    ):
        raise ValueError("Trajectory dates must be strictly increasing")
    return dates


def validate_states(
    rows: list[Row], start: datetime, stop: datetime, step_hours: int,
    minimum_range: float, maximum_range: float,
) -> None:
    interval = timedelta(hours=step_hours)
    expected = int((stop - start) / interval) + 1
    if len(rows) != expected:
        raise ValueError(f"Expected {expected} states, received {len(rows)}")
    for index, row in enumerate(rows):
        if row.when != start + index * interval or row.velocity is None:
            raise ValueError(f"Missing state or velocity at sample {index}")
        distance = math.sqrt(sum(value * value for value in row.xyz))
        if not minimum_range < distance < maximum_range:
            raise ValueError(f"Implausible geocentric range: {distance} km")


def flattened(rows: list[Row], attribute: str, digits: int) -> list[float]:
    return [round(value, digits) for row in rows for value in getattr(row, attribute)]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--orbit", type=Path, default=Path("euclid-orbit-data.js"))
    parser.add_argument("--output", type=Path, default=Path("euclid-lunar-data.js"))
    parser.add_argument("--step-hours", type=int, choices=(1, 3, 6, 12), default=6)
    parser.add_argument("--transport", choices=("urllib", "curl"), default="urllib")
    args = parser.parse_args()
    dates = read_orbit_dates(args.orbit)
    start = (dates[0] - timedelta(days=16)).replace(hour=0, minute=0, second=0)
    stop = (dates[-1] + timedelta(days=17)).replace(hour=0, minute=0, second=0)
    step = f"{args.step_hours} h"
    print(f"Fetching JPL Moon/Sun states from {start} through {stop}", flush=True)
    moon = fetch_vectors("301", start, stop, step, include_velocity=True, transport=args.transport)
    sun = fetch_vectors("10", start, stop, step, include_velocity=True, transport=args.transport)
    validate_states(moon, start, stop, args.step_hours, 330_000, 420_000)
    validate_states(sun, start, stop, args.step_hours, 140_000_000, 160_000_000)
    if any(first.when != second.when for first, second in zip(moon, sun)):
        raise ValueError("Moon and Sun timestamps do not match")
    payload = {
        "source": "NASA/JPL Horizons",
        "sourceUrl": "https://ssd.jpl.nasa.gov/horizons/",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "target": "Moon (301)",
        "centre": "Earth geocentre (399)",
        "frame": "Ecliptic of J2000.0 (ICRF)",
        "corrections": "NONE: geometric states, no light-time or aberration",
        "positionUnits": "km",
        "velocityUnits": "km/s",
        "timeScale": "UTC",
        "start": start.isoformat(),
        "end": stop.isoformat(),
        "startMs": int(start.timestamp() * 1000),
        "stepSeconds": args.step_hours * 3600,
        "sampleCount": len(moon),
        "moonPositions": flattened(moon, "xyz", 3),
        "moonVelocities": flattened(moon, "velocity", 9),
        "sunPositions": flattened(sun, "xyz", 3),
        "sunVelocities": flattened(sun, "velocity", 9),
    }
    output = "window.EUCLID_LUNAR_EPHEMERIS=" + json.dumps(
        payload, separators=(",", ":"), allow_nan=False
    ) + ";\n"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary_name = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=args.output.parent,
            prefix=args.output.name + ".", suffix=".tmp", delete=False,
        ) as temporary:
            temporary_name = temporary.name
            temporary.write(output)
        os.replace(temporary_name, args.output)
        temporary_name = None
    finally:
        if temporary_name is not None:
            Path(temporary_name).unlink(missing_ok=True)
    print(f"Wrote {args.output}: {len(moon)} states per body, {len(output):,} bytes")


if __name__ == "__main__":
    main()
