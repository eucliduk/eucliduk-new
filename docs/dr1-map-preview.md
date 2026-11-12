The DR1 map page is a local preview. Its image is prepared in `.build/private-dr1/`, which is ignored by Git. Do not upload the supplied imagery or private viewers.

Prepare the map with `scripts/build_dr1_map.py`, passing the original `1_Gaia+Planck+Euclid-EWS-DR1-8K4K.tif`, then regenerate the site with `scripts/build_site.mjs`.

The outlined northern footprint opens the existing viewer at `http://127.0.0.1:8766/#wide`. The southern footprint opens `http://127.0.0.1:8766/south.html#wide`. These viewers live in `/Users/jfawcet2/Euclid-DR1-PRIVATE/public`, outside this repository, and need their existing loopback server running. No tiles or viewer assets are copied into the website.

The southern footprint is registered from ESA’s supplied zoom infographic to the all-sky map (horizontal scale 0.30431, vertical scale 0.30421, translation 3129.20, 1471.96 pixels). Its four corners come from fitting the centre of the red frame’s edges at original resolution. Only the two areas that correspond to the existing image explorers are outlined. Other yellow areas show survey coverage, including the Deep Survey, and do not have matching viewers here.

The NGC 1316 and M81/M82 detail additions were removed on 10 November 2026
at the user’s request. Both private viewers are restored to their previous
scene files and original detail branches. Supplied originals, removed tiles
and historical registration records are retained in the private project,
outside this website repository.
