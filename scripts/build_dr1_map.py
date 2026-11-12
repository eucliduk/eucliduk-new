"""Prepare the supplied DR1 map locally. Image output is excluded from Git."""
import argparse
import json
from collections import defaultdict, deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("source", type=Path, help="The supplied Gaia + Planck + Euclid TIFF")
parser.add_argument("--regions-only", action="store_true", help="Update region geometry without re-encoding the map")
args = parser.parse_args()
image = Image.open(args.source).convert("RGB")
if image.size != (7680, 4320):
    raise ValueError("Expected the original 7680 × 4320 map, so the regions remain aligned.")
destination = ROOT / ".build/private-dr1"
destination.mkdir(parents=True, exist_ok=True)
if not args.regions_only:
    image.save(destination / "all-sky.webp", quality=92, method=6)

# Trace the northern survey's silhouette from the yellow pixels. Eight-pixel
# cells smooth tiny gaps between observations without changing its footprint.
step = 8
left, top, right, bottom = 960, 784, 2080, 1328
pixels = np.asarray(image.crop((left, top, right, bottom)), dtype=np.int16)
yellow = (pixels[:, :, 0] > 160) & (pixels[:, :, 1] > 150) & (pixels[:, :, 0] - pixels[:, :, 2] > 25) & (pixels[:, :, 1] - pixels[:, :, 2] > 25)
cells = yellow.reshape((bottom-top)//step, step, (right-left)//step, step).mean(axis=(1, 3)) > .2
remaining = set(zip(*np.nonzero(cells)))
components = []
while remaining:
    seed = remaining.pop()
    region, queue = {seed}, deque([seed])
    while queue:
        y, x = queue.popleft()
        for neighbour in [(y-1,x),(y+1,x),(y,x-1),(y,x+1)]:
            if neighbour in remaining:
                remaining.remove(neighbour)
                region.add(neighbour)
                queue.append(neighbour)
    components.append(region)
region = max(components, key=len)
edges = defaultdict(list)
for y, x in region:
    if (y-1,x) not in region: edges[(x,y)].append((x+1,y))
    if (y,x+1) not in region: edges[(x+1,y)].append((x+1,y+1))
    if (y+1,x) not in region: edges[(x+1,y+1)].append((x,y+1))
    if (y,x-1) not in region: edges[(x,y+1)].append((x,y))
directions = {(1,0):0, (0,1):1, (-1,0):2, (0,-1):3}
loops = []
while edges:
    start = next(iter(edges))
    point, loop, direction = start, [], None
    while point in edges:
        loop.append(point)
        options = edges[point]
        # Keep the observed cells on the right when contours meet diagonally.
        def turn_priority(next_point):
            move = directions[(next_point[0]-point[0],next_point[1]-point[1])]
            return [1,0,3,2].index((move-direction)%4) if direction is not None else 0
        next_point = min(options, key=turn_priority)
        options.remove(next_point)
        if not options: del edges[point]
        direction = directions[(next_point[0]-point[0],next_point[1]-point[1])]
        point = next_point
        if point == start: break
    if point != start: raise ValueError("Survey outline did not close")
    loops.append(loop)
outline = max(loops, key=len)
outline = [p for i,p in enumerate(outline) if (p[0]-outline[i-1][0],p[1]-outline[i-1][1]) != (outline[(i+1)%len(outline)][0]-p[0],outline[(i+1)%len(outline)][1]-p[1])]
north = [[int(left+x*step),int(top+y*step)] for x,y in outline]
# Southern image footprint transferred from ESA's supplied zoom infographic,
# registered to this exact all-sky map. Fit the centre of the four red frame
# edges, rather than estimating corners from a reduced preview. Registration:
# infographic x = .30431 * map x + 3129.20;
# infographic y = .30421 * map y + 1471.96.
# This image footprint is a subset of the yellow southern survey coverage.
south = [[5215,3353],[5326,3283],[5514,3584],[5403,3654]]
(ROOT / "data/site/dr1-map-regions.json").write_text(json.dumps({"north": north, "south": south}, indent=2)+"\n")
print(f"Prepared local map ({(destination / 'all-sky.webp').stat().st_size / 1024**2:.1f} MB) and registered region outlines.")
