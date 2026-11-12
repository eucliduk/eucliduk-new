#!/usr/bin/env python3
"""Regenerate Euclid's source-preserving rotating-frame trajectory.

Verified WebMUST/GRAINS-derived points are retained unchanged through their
final supplied epoch. NASA/JPL Horizons supplies the later ESA flight-path
prediction. The output is a browser-ready JavaScript file. Only Python's
standard library is required so this can run locally and in GitHub Actions.
"""

from __future__ import annotations

import csv
import json
import math
import os
import re
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


UTC = timezone.utc
API = "https://ssd.jpl.nasa.gov/api/horizons.api"
MONTH = {
    month: index
    for index, month in enumerate(
        ("Jan", "Feb", "Mar", "Apr", "May", "Jun",
         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"),
        1,
    )
}
CALENDAR_PATTERN = re.compile(
    r"A\.D\.\s+(\d{4})-([A-Za-z]{3})-(\d{2})\s+"
    r"(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)"
)


@dataclass(frozen=True)
class Row:
    julian_day: float
    when: datetime
    xyz: tuple[float, float, float]
    velocity: tuple[float, float, float] | None = None


def parse_history_date(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%d %H:%M").replace(tzinfo=UTC)


def parse_event_date(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%d %H:%M:%S").replace(tzinfo=UTC)


def load_history(path: Path) -> dict[str, object]:
    with path.open(encoding="utf-8") as source:
        history = json.load(source)

    required_arrays = ("x", "y", "z", "t", "dates")
    arrays = {name: history.get(name) for name in required_arrays}
    if any(not isinstance(values, list) for values in arrays.values()):
        raise RuntimeError(f"Malformed WebMUST history in {path}")
    lengths = {name: len(values) for name, values in arrays.items()}
    if len(set(lengths.values())) != 1 or lengths["dates"] != 1_349:
        raise RuntimeError(f"Unexpected WebMUST array lengths: {lengths}")

    dates = [parse_history_date(str(value)) for value in arrays["dates"]]
    if dates[0] != datetime(2023, 7, 1, 15, tzinfo=UTC):
        raise RuntimeError("Unexpected first WebMUST display epoch")
    if dates[-1] != datetime(2026, 7, 22, 16, tzinfo=UTC):
        raise RuntimeError("Unexpected final WebMUST display epoch")

    first = dates[0]
    for index, when in enumerate(dates):
        if index and when <= dates[index - 1]:
            raise RuntimeError("WebMUST timestamps are not strictly increasing")
        xyz = tuple(float(arrays[axis][index]) for axis in ("x", "y", "z"))
        if not all(math.isfinite(value) for value in xyz):
            raise RuntimeError(f"Non-finite WebMUST position at {when}")
        distance = math.sqrt(sum(value * value for value in xyz))
        if not 1_000 < distance < 3_000_000:
            raise RuntimeError(
                f"Implausible WebMUST Euclid range {distance:g} km"
            )
        elapsed_days = (when - first).total_seconds() / 86_400
        if abs(float(arrays["t"][index]) - elapsed_days) > 1e-8:
            raise RuntimeError(f"WebMUST elapsed-time mismatch at {when}")

    source_metadata = history.get("source")
    if not isinstance(source_metadata, dict):
        raise RuntimeError("WebMUST history has no provenance metadata")
    if source_metadata.get("provider") != (
        "ESA GRAINS export accessed through WebMUST"
    ):
        raise RuntimeError("Unexpected WebMUST history provider")

    manoeuvres = history.get("manoeuvres")
    manoeuvre_source = history.get("manoeuvreSource")
    if not isinstance(manoeuvres, list) or len(manoeuvres) != 26:
        raise RuntimeError("WebMUST history has invalid manoeuvre data")
    if not isinstance(manoeuvre_source, dict):
        raise RuntimeError("WebMUST history has no manoeuvre provenance")
    if manoeuvre_source.get("provider") != (
        "SOPS_MASTER embedded in the supplied original HTML"
    ):
        raise RuntimeError("Unexpected manoeuvre provider")
    if manoeuvre_source.get("deltaVUnit") != (
        "Not supplied by the source HTML"
    ):
        raise RuntimeError("Unexpected manoeuvre delta-v provenance")
    previous_event: datetime | None = None
    for manoeuvre in manoeuvres:
        if not isinstance(manoeuvre, dict):
            raise RuntimeError("Malformed manoeuvre record")
        try:
            when = parse_event_date(str(manoeuvre["date"]))
            xyz = tuple(float(manoeuvre[axis]) for axis in ("x", "y", "z"))
            elapsed_days = float(manoeuvre["t"])
            raw_delta_v = manoeuvre["deltaV"]
            if not isinstance(raw_delta_v, str) or not re.fullmatch(
                r"\d+\.\d{5}",
                raw_delta_v,
            ):
                raise ValueError
            delta_v = float(raw_delta_v)
        except (KeyError, TypeError, ValueError) as exc:
            raise RuntimeError("Malformed manoeuvre record") from exc
        if previous_event is not None and when <= previous_event:
            raise RuntimeError("Manoeuvre timestamps are not strictly increasing")
        previous_event = when
        if not all(math.isfinite(value) for value in (*xyz, elapsed_days, delta_v)):
            raise RuntimeError(f"Non-finite manoeuvre value at {when}")
        if not first <= when <= dates[-1]:
            raise RuntimeError(f"Manoeuvre lies outside the WebMUST history: {when}")
        distance = math.sqrt(sum(value * value for value in xyz))
        if not 1_000 < distance < 3_000_000:
            raise RuntimeError(f"Implausible manoeuvre range at {when}")
        if abs(elapsed_days - (when - first).total_seconds() / 86_400) > 1e-8:
            raise RuntimeError(f"Manoeuvre elapsed-time mismatch at {when}")

    return history


def quoted(value: str) -> str:
    return f"'{value}'"


def parse_calendar(value: str) -> datetime:
    match = CALENDAR_PATTERN.fullmatch(value.strip())
    if not match or match.group(2) not in MONTH:
        raise ValueError(f"Unexpected Horizons calendar value: {value!r}")

    seconds_float = float(match.group(6))
    seconds = int(seconds_float)
    microseconds = round((seconds_float - seconds) * 1_000_000)
    return datetime(
        int(match.group(1)),
        MONTH[match.group(2)],
        int(match.group(3)),
        int(match.group(4)),
        int(match.group(5)),
        seconds,
        microseconds,
        tzinfo=UTC,
    )


def fetch_vectors(
    target: str,
    start: datetime,
    stop: datetime,
    step: str,
    include_velocity: bool = False,
    transport: str = "urllib",
) -> list[Row]:
    def stamp(value: datetime) -> str:
        return value.strftime("%Y-%b-%d %H:%M:%S")

    params = {
        "format": "json",
        "COMMAND": quoted(target),
        "OBJ_DATA": quoted("NO"),
        "MAKE_EPHEM": quoted("YES"),
        "EPHEM_TYPE": quoted("VECTORS"),
        "CENTER": quoted("500@399"),
        "START_TIME": quoted(stamp(start)),
        "STOP_TIME": quoted(stamp(stop)),
        "STEP_SIZE": quoted(step),
        "TIME_TYPE": quoted("UT"),
        "TIME_DIGITS": quoted("SECONDS"),
        "REF_SYSTEM": quoted("ICRF"),
        "REF_PLANE": quoted("ECLIPTIC"),
        "OUT_UNITS": quoted("KM-S"),
        "VEC_TABLE": quoted("2" if include_velocity else "1"),
        "VEC_CORR": quoted("NONE"),
        "CSV_FORMAT": quoted("YES"),
        "VEC_LABELS": quoted("NO"),
        "CAL_TYPE": quoted("GREGORIAN"),
    }
    url = API + "?" + urlencode(params)
    error: Exception | None = None

    for attempt in range(4):
        try:
            request = Request(
                url,
                headers={
                    "Accept": "application/json",
                    "User-Agent": "eucliduk.github.io ephemeris updater/1.0",
                },
            )
            if transport == "curl":
                response = subprocess.run(
                    ["curl", "--fail", "--silent", "--show-error", "--location",
                     "--max-time", "90", url],
                    capture_output=True, text=True, check=True, timeout=100,
                )
                payload = json.loads(response.stdout)
            elif transport == "urllib":
                with urlopen(request, timeout=90) as response:
                    if response.status != 200:
                        raise RuntimeError(f"Horizons HTTP {response.status}")
                    payload = json.load(response)
            else:
                raise ValueError(f"Unknown Horizons transport: {transport}")

            if payload.get("error"):
                raise RuntimeError(f"Horizons error: {payload['error']}")
            if payload.get("signature", {}).get("source") != "NASA/JPL Horizons API":
                raise RuntimeError("Unexpected Horizons response signature")

            result = payload.get("result", "")
            checks = (
                r"Center body name:\s+Earth \(399\)",
                r"Reference frame\s+: Ecliptic of J2000\.0",
                r"Output units\s+: KM-S",
                r"Output type\s+: GEOMETRIC cartesian states",
            )
            target_check = rf"Target body name:.*\({re.escape(target)}\)"
            if (
                not re.search(target_check, result)
                or any(not re.search(pattern, result) for pattern in checks)
            ):
                raise RuntimeError(
                    "Horizons response metadata did not match the requested target/frame"
                )

            try:
                table = result.split("$$SOE", 1)[1].split("$$EOE", 1)[0]
            except IndexError as exc:
                raise RuntimeError("Horizons response has no ephemeris table") from exc

            rows: list[Row] = []
            for line in table.splitlines():
                if not line.strip():
                    continue
                fields = [value.strip() for value in next(csv.reader([line]))]
                if len(fields) < (8 if include_velocity else 5):
                    raise RuntimeError(f"Malformed Horizons row: {line!r}")
                julian_day = float(fields[0])
                when = parse_calendar(fields[1])
                xyz = tuple(float(value) for value in fields[2:5])
                velocity = (
                    tuple(float(value) for value in fields[5:8])
                    if include_velocity else None
                )
                if (
                    not math.isfinite(julian_day)
                    or not all(math.isfinite(value) for value in xyz)
                    or (velocity is not None and not all(
                        math.isfinite(value) for value in velocity
                    ))
                ):
                    raise RuntimeError("Horizons returned a non-finite value")
                rows.append(Row(julian_day, when, xyz, velocity))

            if not rows:
                raise RuntimeError("Horizons returned zero ephemeris rows")
            return rows
        except (
            HTTPError,
            URLError,
            TimeoutError,
            OSError,
            ValueError,
            json.JSONDecodeError,
            RuntimeError,
            subprocess.SubprocessError,
        ) as exc:
            error = exc
            if attempt < 3:
                time.sleep(2**attempt)

    raise RuntimeError(f"Horizons request failed after retries: {error}")


def expected_count(start: datetime, stop: datetime, step: str) -> int:
    interval = timedelta(hours=1) if step == "1 h" else timedelta(days=1)
    quotient = (stop - start) / interval
    if abs(quotient - round(quotient)) > 1e-9:
        raise ValueError("Segment endpoints are not aligned to their step")
    return round(quotient) + 1


def rotating_position(euclid_row: Row, sun_row: Row) -> tuple[float, float, float]:
    if (
        abs(euclid_row.julian_day - sun_row.julian_day) > 1e-8
        or euclid_row.when != sun_row.when
    ):
        raise RuntimeError(
            "Euclid/Sun timestamp mismatch: "
            f"{euclid_row.when} / {sun_row.when}"
        )

    rx, ry, rz = euclid_row.xyz
    sx, sy, sz = sun_row.xyz
    euclid_distance = math.sqrt(rx * rx + ry * ry + rz * rz)
    sun_distance = math.sqrt(sx * sx + sy * sy + sz * sz)
    if not 1_000 < euclid_distance < 3_000_000:
        raise RuntimeError(f"Implausible Euclid range {euclid_distance:g} km")
    if not 140_000_000 < sun_distance < 160_000_000:
        raise RuntimeError(f"Implausible Sun range {sun_distance:g} km")

    projected_sun_distance = math.hypot(sx, sy)
    antisolar_x = -sx / projected_sun_distance
    antisolar_y = -sy / projected_sun_distance
    tangent_x = -antisolar_y
    tangent_y = antisolar_x
    rotating_x = rx * antisolar_x + ry * antisolar_y
    rotating_y = rx * tangent_x + ry * tangent_y
    rotating_z = rz
    transformed_distance = math.sqrt(
        rotating_x * rotating_x
        + rotating_y * rotating_y
        + rotating_z * rotating_z
    )
    if abs(transformed_distance - euclid_distance) > 0.01:
        raise RuntimeError("Rotating-frame transform failed its norm check")

    return rotating_x, rotating_y, rotating_z


def main() -> None:
    output = Path(
        sys.argv[1] if len(sys.argv) > 1 else "euclid-orbit-data.js"
    ).resolve()
    history_path = Path(
        sys.argv[2]
        if len(sys.argv) > 2
        else Path(__file__).resolve().parents[1]
        / "data"
        / "euclid-webmust-history.json"
    ).resolve()
    history = load_history(history_path)
    now = datetime.now(UTC)
    future_date = (now + timedelta(days=370)).date()
    future_stop = datetime(
        future_date.year,
        future_date.month,
        future_date.day,
        16,
        tzinfo=UTC,
    )
    history_dates = [
        parse_history_date(str(value)) for value in history["dates"]
    ]
    history_end = history_dates[-1]
    if future_stop <= history_end:
        raise RuntimeError("Forecast stop does not follow the WebMUST history")

    # Query the shared boundary epoch as an overlap check, then retain the
    # WebMUST value at that epoch and append only later Horizons values.
    euclid = fetch_vectors("-680", history_end, future_stop, "1 d")
    sun = fetch_vectors("10", history_end, future_stop, "1 d")
    count = expected_count(history_end, future_stop, "1 d")
    if len(euclid) != count or len(sun) != count:
        raise RuntimeError(
            f"Unexpected forecast row count: Euclid={len(euclid)}, "
            f"Sun={len(sun)}, expected={count}"
        )

    forecast_positions = [
        rotating_position(euclid_row, sun_row)
        for euclid_row, sun_row in zip(euclid, sun)
    ]
    history_boundary = tuple(
        float(history[axis][-1]) for axis in ("x", "y", "z")
    )
    join_difference = math.sqrt(
        sum(
            (forecast_positions[0][index] - history_boundary[index]) ** 2
            for index in range(3)
        )
    )
    if join_difference > 5_000:
        raise RuntimeError(
            "WebMUST/Horizons overlap differs by "
            f"{join_difference:g} km at {history_end}"
        )

    x = [float(value) for value in history["x"]]
    y = [float(value) for value in history["y"]]
    z = [float(value) for value in history["z"]]
    dates = [str(value) for value in history["dates"]]
    for row, position in zip(euclid[1:], forecast_positions[1:]):
        x.append(round(position[0], 6))
        y.append(round(position[1], 6))
        z.append(round(position[2], 6))
        dates.append(row.when.strftime("%Y-%m-%d %H:%M"))

    combined_dates = [parse_history_date(value) for value in dates]
    first = combined_dates[0]
    days = [float(value) for value in history["t"]]
    days.extend(
        round((when - first).total_seconds() / 86_400, 9)
        for when in combined_dates[len(history_dates):]
    )

    data = {
        "x": x,
        "y": y,
        "z": z,
        "t": days,
        "dates": dates,
        "manoeuvres": history["manoeuvres"],
        "generatedAt": now.replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
        "validThrough": future_stop.isoformat().replace("+00:00", "Z"),
        "sourceBoundary": history_end.isoformat().replace("+00:00", "Z"),
        "sourceBoundaryIndex": len(history_dates) - 1,
        "forecastStart": euclid[1]
        .when.isoformat()
        .replace("+00:00", "Z"),
        "joinDifferenceKm": round(join_difference, 6),
        "sources": {
            "history": history["source"],
            "manoeuvres": history["manoeuvreSource"],
            "forecast": {
                "provider": "NASA/JPL Horizons",
                "target": "Euclid spacecraft -680",
                "centre": "Earth 500@399",
                "frame": "ICRF/J2000 ecliptic",
                "vectorType": "geometric, no light-time correction",
                "units": "kilometres",
                "timeType": "UT",
                "role": (
                    "ESA-provided predicted flight path after the "
                    "WebMUST boundary"
                ),
                "queriedAt": now.replace(microsecond=0)
                .isoformat()
                .replace("+00:00", "Z"),
            },
        },
        "source": (
            "ESA GRAINS/WebMUST supplied history through 2026-07-22 "
            "16:00; NASA/JPL Horizons ESA flight-path prediction thereafter"
        ),
    }
    encoded = json.dumps(
        data,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
    )
    content = (
        "/* WebMUST/GRAINS history plus NASA/JPL Horizons forecast; generated by "
        "scripts/update_euclid_ephemeris.py. Do not edit. */\n"
        "window.EUCLID_ORBIT_DATA = "
        + encoded
        + ";\n"
    )

    output.parent.mkdir(parents=True, exist_ok=True)
    temporary_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            dir=output.parent,
            prefix=output.name + ".",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temporary_name = temporary.name
            temporary.write(content)
            temporary.flush()
            os.fsync(temporary.fileno())
        os.replace(temporary_name, output)
        temporary_name = None
    finally:
        if temporary_name:
            try:
                os.unlink(temporary_name)
            except FileNotFoundError:
                pass

    print(
        f"Wrote {output} with {len(dates)} points "
        f"({dates[0]} through {dates[-1]} display time); "
        f"source-boundary difference {join_difference:.3f} km"
    )


if __name__ == "__main__":
    main()
