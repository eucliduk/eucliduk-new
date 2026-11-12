# Texture sources

## Sun

`sun-nasa-sdo-stereo-2048.jpg` is a 2048 × 1024 web-optimised
derivative of NASA's *Full Sun Map*, combining SDO/AIA and STEREO
observations at 304 Å.

- Source: https://svs.gsfc.nasa.gov/30362/
- Original map: https://svs.gsfc.nasa.gov/vis/a030000/a030300/a030362/euvi_aia304_2012_carrington.tif
- Credit: NASA/SDO/STEREO

The original 4104 × 2304 TIFF was resampled for spherical mapping and
compressed as JPEG. Its published false-colour palette is retained.
This is historical extreme-ultraviolet imagery, not a natural-colour
photograph or a date-synchronised live solar observation. No synthetic
sunspots, granulation, or halo are added. The matching base64 wrapper
contains the identical JPEG for direct `file://` use.

## Milky Way

`milky-way-gaia-edr3-2048.jpg` is a web-optimised 2048 × 1024
derivative of ESA's *The colour of the sky from Gaia's Early Data
Release 3 (equirectangular projection)*. It maps the total brightness
and colour measured from more than 1.8 billion Gaia EDR3 sources in
Galactic coordinates.

- Source: https://sci.esa.int/web/gaia/-/the-colour-of-the-sky-from-gaia-s-early-data-release-3-equirectangular-projection
- Credit: ESA/Gaia/DPAC
- Acknowledgement: A. Moitinho
- Licence: CC BY-SA 3.0 IGO
  https://creativecommons.org/licenses/by-sa/3.0/igo/

The source image was resized from 2000 × 1000 to the power-of-two
dimensions required by the WebGL 1 texture path and compressed as JPEG
for web delivery. The adapted image remains available under the same
CC BY-SA 3.0 IGO licence. `milky-way-gaia-edr3-2048.base64.js` contains
the identical JPEG as base64 so the interactive also works when opened
directly with `file://`.

## Euclid Galactic Bulge Survey

`euclid-galactic-bulge-sky-1024.webp` and
`euclid-galactic-bulge-detail-1600.webp` are web-optimised derivatives
of ESA's coordinate-registered Q2 Euclid Galactic Bulge Survey HiPS:

- HiPS source: https://esdchips.esac.esa.int/EuclidOutreach/Q2-EGBS-PNG-RGB_HIPS/
- Official image page: https://www.esa.int/ESA_Multimedia/Images/2026/06/Euclid_s_view_of_our_galaxy_s_bulge
- Q2 field metadata: https://www.euclid-ec.org/science/q2/
- Credit: ESA/Euclid/Euclid Consortium/NASA, CFHT, image processing by
  J.-C. Cuillandre and E. Bertin (CEA Paris-Saclay)
- Licence: CC BY-SA 3.0 IGO
  https://creativecommons.org/licenses/by-sa/3.0/igo/

The source was extracted as a north-up, east-left, 2.8-degree TAN
projection centred at J2000 RA 268.2373744913 degrees and declination
-29.3696927991 degrees. Transparent pixels preserve the irregular
nine-pointing, 4.8-square-degree survey footprint. The cutout was
resized and encoded as WebP for the interactive; it remains available
under the same CC BY-SA 3.0 IGO licence. The base64 wrapper contains
the identical 1024-pixel sky texture for direct `file://` use.

The orbit interactive also samples only this texture's alpha channel
to draw the outlined amber special-observation footprint. It appears
from 24 March 2025 at 12:00 UTC, the end of the published 23–24 March
observation interval; the image content remains independently gated to
its public release.

## Euclid first 1% mosaic

`euclid-first-one-percent-mosaic-2048.webp` is a 2048 × 647
web-optimised derivative of ESA's *Mosaic of Euclid observations in
the Southern Sky*:

- Official image:
  https://www.esa.int/ESA_Multimedia/Images/2024/10/Mosaic_of_Euclid_observations_in_the_Southern_Sky
- Interactive explorer and coordinate definition:
  https://willjroper.github.io/explore-euclid-imaging/
- Credit: ESA/Euclid/Euclid Consortium/NASA, CEA Paris-Saclay, image
  processing by J.-C. Cuillandre, E. Bertin and G. Anselmi
- Licence: CC BY-SA 3.0 IGO
  https://creativecommons.org/licenses/by-sa/3.0/igo/

The 260 observations were collected from 25 March to 8 April 2024 and
cover 132 square degrees. The texture is placed using the explorer's
internally consistent J2000 centre, RA 06h 08m 54.5s and declination
-39° 47′ 44.8″. The explorer's rounded 31.9° × 10.1° field and 285.6°
image-north values are refined to a 31.75° × 10.01° plate-carrée patch
with a 74.27656° sky roll. The calibration uses the final 1,040 schedule
rows—260 four-dither observations—from the matching RSD2026a campaign
and keeps the published centre fixed. At the source image's angular
resolution, its silhouette reaches 99.05% precision, 99.38% recall and
98.44% intersection-over-union against those pointing polygons.

The RSD2026a campaign also contains 60 earlier pointings, or 15
four-dither observations, that are not included in the released mosaic;
the full reference-schedule layer therefore extends beyond the image in
places. Additive blending leaves the source image's black gaps
transparent against the sky. The matching base64 wrapper preserves
direct `file://` use.

## Euclid reference survey progress

`euclid-survey-progress-rg.png` is a time-aware 8192 × 4096
equirectangular sky mask derived from the Euclid Consortium's RSD2026a
reference survey schedule:

- Visualiser:
  https://www.euclid-ec.org/survey-map/euclid_footprint.html
- Schedule:
  https://www.euclid-ec.org/survey-map/footprint/rsd2026a_small.txt
- Schedule last modified: 16 June 2026
- Credit: Euclid Consortium — RSD2026a
- Website terms: CC-BY-SA-NC
  https://www.euclid-ec.org/about/terms/

The schedule contains 157,602 pointings from 14 February 2024 through
1 January 2030. Each row supplies four corners in ecliptic J2000
coordinates. The texture stores the first scheduled-observation hour
for every covered pixel as a little-endian 16-bit value in the red and
green channels; zero means uncovered. The interactive compares that
value with the date selected on the orbit timeline, so the planned
footprint can advance locally during scrubbing or playback without
downloading the 22 MB schedule at run time. Devices whose WebGL limit
is below 8192 pixels downsample the mask with nearest-neighbour
sampling before upload, so the encoded schedule hours remain discrete.
Current position uses the latest completed UTC hour.

This is reference-schedule coverage, not live spacecraft telemetry or
confirmation that an observation was completed. The source texture and
its matching base64 wrapper can be regenerated with
`scripts/build_euclid_survey_progress.py` when the Consortium publishes
a new schedule.
