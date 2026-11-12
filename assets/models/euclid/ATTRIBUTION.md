# Euclid spacecraft model

The web model in this directory was converted from the detailed textured
Euclid model supplied to Euclid UK on 30 July 2026.

- Supplied source: `Euclid.dsg` with two BaseColor, Normal, Metal and Roughness
  texture sets.
- Adaptation: source geometry decoded, indexed by position/normal/UV,
  centred, converted from the source format's bottom-left UV origin to glTF's
  upper-left origin, fitted with glTF PBR materials, texture resolution
  optimised, and packaged as a self-contained GLB for interactive web display.
- Provenance note: the supplied package contains no README, copyright notice,
  public source URL or licence statement. Publication rights and any required
  public credit should therefore be confirmed with the provider.

The reproducible conversion process is implemented in
`scripts/convert_euclid_dsg_to_glb.py`.

# Earth imagery

The day texture used by the orbit page is NASA's Blue Marble Next Generation
imagery.

- Source: https://svs.gsfc.nasa.gov/3615/
- Credit: NASA/Goddard Space Flight Center Scientific Visualization Studio;
  Blue Marble Next Generation data courtesy Reto Stockli (NASA/GSFC) and NASA
  Earth Observatory.

The night texture is NASA Earth Observatory's 2016 Color Black Marble, derived
from real Suomi NPP VIIRS observations.

- Source: https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/
- Credit: NASA Earth Observatory/Joshua Stevens, using Suomi NPP VIIRS data
  from Miguel Román, NASA Goddard Space Flight Center. Suomi NPP is a joint
  NASA–NOAA mission.

The moving day/night boundary is calculated locally from the current UTC using
NOAA's published general solar-position equations:
https://gml.noaa.gov/grad/solcalc/solareqns.PDF

Blue Marble and Black Marble are satellite-data composites rather than live
cloud or surface imagery. The current-time element is the calculated solar
illumination and terminator.
