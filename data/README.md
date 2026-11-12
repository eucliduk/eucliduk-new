# Euclid orbit data

## Moon and Sun ephemerides

`euclid-lunar-data.js` caches NASA/JPL Horizons Moon (301) and Sun (10)
geometric position and velocity states relative to the Earth geocentre (399),
in the J2000 ecliptic frame. Positions are kilometres; velocities are km/s.
The requested time type is UT, with modern calendar timestamps stored as UTC.
Light-time and aberration corrections are disabled. Source:
https://ssd.jpl.nasa.gov/horizons/manual.html

Run `python scripts/build_lunar_ephemeris.py` to refresh the bundle after
updating Euclid's trajectory. `--transport curl` uses the system downloader
when Python's certificate store is not configured; certificate validation
remains enabled. The shared Horizons reader defaults to Python's standard
library, so GitHub Actions requires no added dependencies.

Six-hour samples include sixteen days of padding before the timeline and at
least sixteen after it, covering the displayed 27.3-day lunar path. Runtime
cubic Hermite interpolation uses both positions and velocities. Moon vectors
are rotated using the selected date's geocentric Sun direction, matching the
forecast's Earth–Sun-relative basis. Orbit-path samples retain that same
selected-date frame. The star field uses the Sun's J2000 ecliptic longitude.
The Sun's geometric distance updates too; its texture remains historical.

All scene dates follow the timeline, including Earth's solar-calculation
rotation and day/night imagery. Current-time mode refreshes once per minute;
historical/future selections remain fixed until the timeline changes. The
Now shortcut restores current-time mode. If cached ephemerides are unavailable
or out of range, the earlier analytic Moon model is retained as an explicitly
labelled approximate fallback. Enlarged display radii, simplified lunar
orientation and non-eclipse lighting remain intentional visual limitations.

## Euclid trajectory

`euclid-webmust-history.json` is the fixed, verified historical segment used by
the public visualisation. It contains the exact 1,349 Earth–L2 rotating-frame
positions from the supplied original HTML:

- hourly from 1 July 2023 15:00 through 11 July 2023 16:00;
- daily at 16:00 through 22 July 2026.

`scripts/import_euclid_webmust_history.py` generated the file after matching
every display epoch to the supplied ESA GRAINS/WebMUST export and confirming
that every position-vector norm was preserved by the original page's rotation.
The JSON records the raw export's filename and SHA-256 digest. The 3.9 MB raw
export is not duplicated in this repository.

The GRAINS parameter export is not a complete CCSDS OEM file. It declares its
units as `null` and does not include a reference frame, time system or
reconstructed/predicted status. Those limitations are retained in the JSON
provenance instead of being guessed away.

The history file also preserves the 26 commanded manoeuvre records in the
original page's embedded `SOPS_MASTER` data. Their timestamps and positions
match the trajectory, but they are not present in the raw WebMUST export and
therefore form a fixed snapshot. The original supplies commanded Δv values but
does not state their unit, so the visualisation leaves the unit unspecified.

`euclid-orbit-data.js` is the browser bundle. The daily updater preserves every
WebMUST-derived point unchanged, checks an overlapping NASA/JPL Horizons point
at the boundary, and appends the later Horizons flight-path prediction without
crossfading or translating either source.
