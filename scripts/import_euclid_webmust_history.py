#!/usr/bin/env python3
"""Import and verify the WebMUST/GRAINS history used by the source HTML.

The GRAINS export contains hourly inertial state-vector channels but omits
frame, unit and time-system metadata. The supplied source HTML contains the
same positions after its Earth-L2 rotating-frame transform. This importer
proves that relationship by matching every timestamp and vector norm, then
writes the exact transformed history used by the public visualisation.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import tempfile
from datetime import datetime, timedelta
from pathlib import Path


DATE_FORMAT = "%Y-%m-%d %H:%M"
EVENT_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
ROW_PATTERN = re.compile(
    r"^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+(.+)$"
)
MANOEUVRE_PATTERN = re.compile(
    r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"
    r"<br>Commanded Δv: (\d+\.\d{5})$"
)


def html_array(source: str, name: str) -> list[object]:
    match = re.search(
        rf"^\s*var {re.escape(name)} = (\[.*\]);\s*$",
        source,
        re.MULTILINE,
    )
    if not match:
        raise ValueError(f"Could not find {name} in the supplied HTML")
    value = json.loads(match.group(1))
    if not isinstance(value, list):
        raise ValueError(f"{name} is not an array")
    return value


def html_object(source: str, name: str) -> dict[str, object]:
    match = re.search(
        rf"^\s*var {re.escape(name)} = (\{{.*\}});\s*$",
        source,
        re.MULTILINE,
    )
    if not match:
        raise ValueError(f"Could not find {name} in the supplied HTML")
    value = json.loads(match.group(1))
    if not isinstance(value, dict):
        raise ValueError(f"{name} is not an object")
    return value


def parse_grains(path: Path) -> tuple[str, dict[str, tuple[float, ...]]]:
    raw = path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    source = raw.decode("ascii")

    required_header_text = (
        "# Exported Parameter(s) from GRAINS",
        "OEM_x - AVG - 1 Non [EUCLID]",
        "OEM_y - AVG - 1 Non [EUCLID]",
        "OEM_z - AVG - 1 Non [EUCLID]",
        "OEM_vx - AVG - 1 Non [EUCLID]",
        "OEM_vy - AVG - 1 Non [EUCLID]",
        "OEM_vz - AVG - 1 Non [EUCLID]",
    )
    missing = [text for text in required_header_text if text not in source]
    if missing:
        raise ValueError(f"Unexpected GRAINS header; missing {missing}")

    rows: dict[str, tuple[float, ...]] = {}
    ordered_dates: list[datetime] = []
    for line_number, line in enumerate(source.splitlines(), 1):
        match = ROW_PATTERN.match(line)
        if not match:
            continue
        values = match.group(3).split()
        if len(values) != 6:
            # The two requested-window header values also look like dates.
            continue
        timestamp = f"{match.group(1)} {match.group(2)[:5]}"
        if timestamp in rows:
            raise ValueError(f"Duplicate GRAINS timestamp at line {line_number}")
        try:
            vector = tuple(float(value) for value in values)
        except ValueError as exc:
            raise ValueError(
                f"Malformed numeric value at GRAINS line {line_number}"
            ) from exc
        if not all(math.isfinite(value) for value in vector):
            raise ValueError(f"Non-finite GRAINS value at line {line_number}")
        rows[timestamp] = vector
        ordered_dates.append(datetime.strptime(timestamp, DATE_FORMAT))

    if len(rows) != 26_817:
        raise ValueError(f"Expected 26,817 GRAINS rows, found {len(rows)}")
    if ordered_dates[0] != datetime(2023, 7, 1, 15):
        raise ValueError("Unexpected first GRAINS epoch")
    if ordered_dates[-1] != datetime(2026, 7, 22, 23):
        raise ValueError("Unexpected final GRAINS epoch")
    for previous, current in zip(ordered_dates, ordered_dates[1:]):
        if current - previous != timedelta(hours=1):
            raise ValueError(
                f"GRAINS cadence is not hourly at {previous} / {current}"
            )

    return digest, rows


def atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            dir=path.parent,
            prefix=path.name + ".",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temporary_name = temporary.name
            temporary.write(content)
            temporary.flush()
            os.fsync(temporary.fileno())
        os.replace(temporary_name, path)
        temporary_name = None
    finally:
        if temporary_name:
            try:
                os.unlink(temporary_name)
            except FileNotFoundError:
                pass


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--grains", required=True, type=Path)
    parser.add_argument("--html", required=True, type=Path)
    parser.add_argument(
        "--output",
        default=Path("data/euclid-webmust-history.json"),
        type=Path,
    )
    arguments = parser.parse_args()

    grains_path = arguments.grains.resolve()
    html_path = arguments.html.resolve()
    output_path = arguments.output.resolve()

    source_hash, grains_rows = parse_grains(grains_path)
    html_source = html_path.read_text(encoding="utf-8")
    arrays = {
        "x": html_array(html_source, "FULL_X"),
        "y": html_array(html_source, "FULL_Y"),
        "z": html_array(html_source, "FULL_Z"),
        "t": html_array(html_source, "FULL_T"),
        "dates": html_array(html_source, "FULL_DATE"),
    }
    lengths = {name: len(values) for name, values in arrays.items()}
    if len(set(lengths.values())) != 1 or lengths["dates"] != 1_349:
        raise ValueError(f"Unexpected HTML array lengths: {lengths}")

    parsed_dates = [
        datetime.strptime(str(value), DATE_FORMAT) for value in arrays["dates"]
    ]
    for index, (previous, current) in enumerate(
        zip(parsed_dates, parsed_dates[1:]),
        1,
    ):
        expected = timedelta(hours=1) if index <= 241 else timedelta(days=1)
        if current - previous != expected:
            raise ValueError(
                f"Unexpected HTML cadence at index {index}: "
                f"{previous} / {current}"
            )

    max_norm_error = 0.0
    first_epoch = parsed_dates[0]
    for index, timestamp in enumerate(arrays["dates"]):
        state = grains_rows.get(str(timestamp))
        if state is None:
            raise ValueError(f"HTML epoch is absent from GRAINS: {timestamp}")
        raw_norm = math.sqrt(sum(value * value for value in state[:3]))
        transformed_norm = math.sqrt(
            float(arrays["x"][index]) ** 2
            + float(arrays["y"][index]) ** 2
            + float(arrays["z"][index]) ** 2
        )
        max_norm_error = max(max_norm_error, abs(raw_norm - transformed_norm))
        expected_days = (
            parsed_dates[index] - first_epoch
        ).total_seconds() / 86_400
        if abs(float(arrays["t"][index]) - expected_days) > 1e-9:
            raise ValueError(f"FULL_T mismatch at {timestamp}")

    if max_norm_error > 1e-6:
        raise ValueError(
            "The source HTML positions are not rotations of the GRAINS "
            f"positions (maximum norm error {max_norm_error:g} km)"
        )

    sops = html_object(html_source, "SOPS_MASTER")
    sops_fields = ("x", "y", "z", "t", "text")
    if any(not isinstance(sops.get(name), list) for name in sops_fields):
        raise ValueError("Malformed SOPS_MASTER manoeuvre data")
    sops_lengths = {name: len(sops[name]) for name in sops_fields}
    if len(set(sops_lengths.values())) != 1 or sops_lengths["x"] != 26:
        raise ValueError(f"Unexpected SOPS_MASTER lengths: {sops_lengths}")

    manoeuvres: list[dict[str, object]] = []
    previous_event: datetime | None = None
    for index in range(sops_lengths["x"]):
        text = str(sops["text"][index])
        match = MANOEUVRE_PATTERN.fullmatch(text)
        if not match:
            raise ValueError(f"Malformed manoeuvre text at index {index}: {text}")
        event_date = datetime.strptime(match.group(1), EVENT_DATE_FORMAT)
        if previous_event is not None and event_date <= previous_event:
            raise ValueError("Manoeuvre epochs are not strictly increasing")
        previous_event = event_date
        expected_days = (event_date - first_epoch).total_seconds() / 86_400
        elapsed_days = float(sops["t"][index])
        if abs(elapsed_days - expected_days) > 1e-9:
            raise ValueError(f"Manoeuvre elapsed-time mismatch at {event_date}")
        position = tuple(
            float(sops[axis][index]) for axis in ("x", "y", "z")
        )
        if not all(math.isfinite(value) for value in position):
            raise ValueError(f"Non-finite manoeuvre position at {event_date}")
        distance = math.sqrt(sum(value * value for value in position))
        if not 1_000 < distance < 3_000_000:
            raise ValueError(
                f"Implausible manoeuvre range {distance:g} km at {event_date}"
            )
        manoeuvres.append(
            {
                "x": position[0],
                "y": position[1],
                "z": position[2],
                "t": elapsed_days,
                "date": match.group(1),
                "deltaV": match.group(2),
            }
        )

    output = {
        "x": arrays["x"],
        "y": arrays["y"],
        "z": arrays["z"],
        "t": arrays["t"],
        "dates": arrays["dates"],
        "manoeuvres": manoeuvres,
        "manoeuvreSource": {
            "provider": "SOPS_MASTER embedded in the supplied original HTML",
            "description": "Commanded orbit manoeuvre events",
            "deltaVUnit": "Not supplied by the source HTML",
            "timeSystem": (
                "Not declared; this visualisation treats the supplied "
                "timestamps as UTC"
            ),
        },
        "source": {
            "provider": "ESA GRAINS export accessed through WebMUST",
            "sourceFile": grains_path.name,
            "sourceSha256": source_hash,
            "rawFirstEpoch": "2023-07-01 15:00",
            "rawLastEpoch": "2026-07-22 23:00",
            "displayFirstEpoch": str(arrays["dates"][0]),
            "displayLastEpoch": str(arrays["dates"][-1]),
            "rawCadence": "1 hour",
            "displayCadence": (
                "1 hour through 2023-07-11 16:00, then 1 day"
            ),
            "timeSystem": (
                "Not declared by export; this visualisation treats the "
                "supplied timestamps as UTC"
            ),
            "frame": (
                "Earth-L2 rotating frame calculated in the supplied source "
                "HTML; raw GRAINS frame is not declared"
            ),
            "units": (
                "Export declares null; kilometres inferred and retained from "
                "the supplied source page"
            ),
            "solutionStatus": (
                "Export does not label samples as reconstructed or predicted"
            ),
            "verification": (
                "All 1,349 display epochs match GRAINS rows and preserve "
                "position-vector norm"
            ),
            "maximumNormErrorKm": max_norm_error,
        },
    }
    encoded = json.dumps(
        output,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
    )
    atomic_write(output_path, encoded + "\n")
    print(
        f"Wrote {output_path} with {lengths['dates']} verified WebMUST "
        f"points and {len(manoeuvres)} manoeuvres; "
        f"maximum norm error {max_norm_error:.3g} km"
    )


if __name__ == "__main__":
    main()
