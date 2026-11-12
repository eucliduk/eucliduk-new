"""Trace the supplied Fingertip Galaxy photograph into individually editable SVG marks.

Requires Pillow and NumPy. The perspective correction and extraction region are
recorded here so the trace can be regenerated without inventing fingerprint marks.
"""
from pathlib import Path
from collections import deque, defaultdict
from html import escape
import json
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
W, H = 1400, 990
SOURCE = ROOT / 'data/fingertip-galaxy/reference.jpg'
OUTPUT = ROOT / 'assets/fingertip-galaxy'
OUTPUT.mkdir(parents=True, exist_ok=True)

def rectify():
    a, b = [], []
    for (x,y),(u,v) in zip([(0,0),(W,0),(W,H),(0,H)], [(80,44),(518,16),(562,306),(76,338)]):
        a += [[x,y,1,0,0,0,-u*x,-u*y], [0,0,0,x,y,1,-v*x,-v*y]]
        b += [u,v]
    return Image.open(SOURCE).convert('RGB').transform((W,H), Image.Transform.PERSPECTIVE, tuple(np.linalg.solve(a,b)), Image.Resampling.BICUBIC)

def simplify(points, tolerance=.7):
    if len(points) < 3: return points
    a, b = np.array(points[0]), np.array(points[-1])
    v = b-a
    pts = np.array(points)
    if np.dot(v,v) == 0: distances = np.linalg.norm(pts-a, axis=1)
    else:
        t = np.clip((pts-a)@v / np.dot(v,v), 0, 1)
        distances = np.linalg.norm(pts-(a+t[:,None]*v), axis=1)
    i = int(np.argmax(distances))
    if distances[i] <= tolerance: return [points[0],points[-1]]
    return simplify(points[:i+1], tolerance)[:-1]+simplify(points[i:], tolerance)

def outlines(component):
    pixels = set(component)
    edges = defaultdict(list)
    for x,y in pixels:
        if (x,y-1) not in pixels: edges[(x,y)].append((x+1,y))
        if (x+1,y) not in pixels: edges[(x+1,y)].append((x+1,y+1))
        if (x,y+1) not in pixels: edges[(x+1,y+1)].append((x,y+1))
        if (x-1,y) not in pixels: edges[(x,y+1)].append((x,y))
    paths=[]
    while edges:
        start=next(iter(edges));current=start;loop=[start]
        while True:
            following=edges[current].pop()
            if not edges[current]: del edges[current]
            loop.append(following);current=following
            if current==start or current not in edges: break
        if len(loop)>4:
            loop=simplify(loop)
            # Round the traced pixel steps with closed quadratic curves while
            # keeping every contour, hole and original fingerprint position.
            if loop[-1] == loop[0]: loop = loop[:-1]
            midpoints = [((loop[i-1][0]+point[0])/2, (loop[i-1][1]+point[1])/2)
                         for i, point in enumerate(loop)]
            point_text = lambda point: ','.join(f'{value:g}' for value in point)
            commands = ['M'+point_text(midpoints[0])]
            for i, point in enumerate(loop):
                commands.append('Q'+point_text(point)+' '+point_text(midpoints[(i+1)%len(loop)]))
            paths.append(''.join(commands)+'Z')
    return ''.join(paths)

image=rectify();gray=image.convert('L')
base=np.asarray(gray.filter(ImageFilter.GaussianBlur(10)),dtype=float)
light=np.asarray(gray,dtype=float)
mask=Image.new('1',(W,H));ImageDraw.Draw(mask).polygon([(180,12),(1040,12),(1140,30),(1190,160),(1270,340),(1255,485),(1190,650),(1140,780),(1100,875),(520,880),(260,775),(130,570),(140,220),(180,170)],fill=1)
binary=(light-base>14)&(light>72)&np.asarray(mask)
binary[:38,650:]=False  # Exclude reflected metal along the upper edge.
seen=np.zeros((H,W),bool);components=[]
for y,x in zip(*np.where(binary)):
    if seen[y,x]:continue
    q=deque([(int(x),int(y))]);seen[y,x]=True;component=[]
    while q:
        px,py=q.popleft();component.append((px,py))
        for nx,ny in [(px-1,py),(px+1,py),(px,py-1),(px,py+1)]:
            if 0<=nx<W and 0<=ny<H and binary[ny,nx] and not seen[ny,nx]:
                seen[ny,nx]=True;q.append((nx,ny))
    if 8<=len(component)<=1500:components.append(component)
components.sort(key=lambda c:(sum(y for _,y in c)/len(c),sum(x for x,_ in c)/len(c)))
marks=[];elements=[]
for i,component in enumerate(components,1):
    cx=sum(x for x,_ in component)/len(component);cy=sum(y for _,y in component)/len(component)
    path=outlines(component)
    if not path:continue
    ident=f'fingerprint-{i:04d}'
    marks.append({'id':ident,'x':round(cx,2),'y':round(cy,2),'area':len(component),'path':path})
    elements.append(f'<path id="{ident}" data-fingerprint="{i}" d="{path}"/>')
poem='We must get our fingerprints onto the keys, our marks into space, for the ache of it, maybe for survival / There is no such thing as unextraordinary light, ordinary matter.'
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" class="fingertip-artwork" role="img" aria-labelledby="fingertip-svg-title fingertip-svg-description" focusable="false">
<title id="fingertip-svg-title">Fingertip Galaxy</title><desc id="fingertip-svg-description">A close digital tracing of the supplied plaque photograph: hundreds of irregular silver fingertip marks curl into a spiral galaxy on a black panel, surrounded by curved typewriter lettering. A readable transcript and credits follow the artwork.</desc>
<defs>
<radialGradient id="plaque-tone" cx="61%" cy="38%" r="76%"><stop offset="0" stop-color="#22292d"/><stop offset=".7" stop-color="#10171b"/><stop offset="1" stop-color="#070b0d"/></radialGradient>
<path id="poem-curve" d="M151 112 C67 264 54 453 107 638 C181 889 468 977 741 953 C1060 927 1290 806 1300 397"/>
<path id="title-curve" d="M48 704 Q105 841 254 940"/>
<path id="closing-curve" d="M1014 958 Q1301 867 1357 526"/>
<path id="credit-curve" d="M1232 126 Q1345 249 1361 467"/>
</defs>
<rect class="plaque-face" x="1" y="1" width="1398" height="988" rx="23"/>
<g class="fingerprint-marks" fill-rule="evenodd">{''.join(elements)}</g>
<g class="plaque-lettering" font-family="'Courier New', Courier, monospace" font-weight="700">
<text font-size="18" textLength="2220" lengthAdjust="spacing"><textPath href="#poem-curve">{escape(poem)}</textPath></text>
<text font-size="25" textLength="279" lengthAdjust="spacing"><textPath href="#title-curve">Fingertip Galaxy</textPath></text>
<text font-size="20" textLength="503" lengthAdjust="spacing"><textPath href="#closing-curve">We light out to observe the darkness visible.</textPath></text>
<text font-size="12" textLength="357" lengthAdjust="spacing"><textPath href="#credit-curve">Created by the Euclid Consortium</textPath></text>
</g></svg>'''
(OUTPUT/'galaxy.svg').write_text(svg)
(ROOT/'data/fingertip-galaxy/marks.json').write_text(json.dumps({'width':W,'height':H,'source':'reference.jpg','marks':marks},separators=(',',':'))+'\n')
preview=Image.new('RGB',(W,H),'#080b0d');draw=ImageDraw.Draw(preview)
for component in components:
    for x,y in component:draw.point((x,y),fill='#c8c8c3')
preview.save('/private/tmp/fingertip-trace-preview.png')
print(f'Traced {len(marks)} individual marks from the supplied photograph.')
