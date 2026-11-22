"""OSM (ODbL, (c) OpenStreetMap contributors) -> compact world data for Road of the Dead.
Coordinates: metres, origin Tower Bridge centre, x = east, z = south."""
import gzip, json, math, hashlib, collections
from shapely.geometry import Polygon, LineString, Point, MultiPolygon
from shapely.strtree import STRtree
from shapely.ops import unary_union

F = json.load(gzip.open('/home/claude/zombieeu/assets/osm/london_tb_okr.geojson.gz', 'rt'))
RJ = json.load(open('/home/claude/osm/route.json'))
LON0, LAT0 = RJ['lon0'], RJ['lat0']
KX = math.cos(math.radians(LAT0)) * 111320; KZ = 110574
def P(c): return ((c[0] - LON0) * KX, -(c[1] - LAT0) * KZ)
ROUTE = LineString(RJ['route'])
CORR = 340.0
r1 = lambda v: round(v, 1)
def H(s): return int(hashlib.md5(str(s).encode()).hexdigest()[:8], 16)
def flat(pts): return [r1(v) for p in pts for v in p]

def num(v):
    try: return float(str(v).split(';')[0].replace('m', '').strip())
    except Exception: return None

def rings(g):
    if g['type'] == 'Polygon': return [g['coordinates']]
    if g['type'] == 'MultiPolygon': return g['coordinates']
    return []

def poly_of(rr):
    try:
        p = Polygon([P(c) for c in rr[0]], [[P(c) for c in h] for h in rr[1:]])
        if not p.is_valid: p = p.buffer(0)
        return p
    except Exception: return None

near = lambda geom, d=CORR: geom.distance(ROUTE) < d

# ------------------------------------------------------------ roads
RW = {'motorway': 16, 'trunk': 15, 'primary': 13, 'secondary': 11, 'tertiary': 9, 'unclassified': 7.5, 'residential': 7,
      'living_street': 6, 'service': 4.5, 'trunk_link': 8, 'primary_link': 8, 'secondary_link': 7, 'tertiary_link': 7}
RC = {k: i for i, k in enumerate(['trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service'])}
def rclass(hw):
    if hw in ('motorway', 'trunk', 'trunk_link'): return 'trunk'
    if hw in ('primary', 'primary_link'): return 'primary'
    if hw in ('secondary', 'secondary_link'): return 'secondary'
    if hw in ('tertiary', 'tertiary_link'): return 'tertiary'
    if hw == 'service': return 'service'
    return 'minor'
roads = []; road_geoms = []
paths = []
for f in F:
    p = f['p']; hw = p.get('highway'); g = f['g']
    if g['type'] != 'LineString' or not hw: continue
    pts = [P(c) for c in g['coordinates']]
    ls = LineString(pts)
    if not near(ls, CORR + 60): continue
    if hw in RW:
        if p.get('service') in ('parking_aisle', 'driveway') and not near(ls, 60): continue
        if p.get('tunnel') in ('yes', 'building_passage'): continue
        w = RW[hw]
        lanes = num(p.get('lanes'))
        if lanes and hw not in ('service',): w = max(w * .6, min(lanes * 3.4, 22))
        if p.get('width') and num(p.get('width')): w = max(4, min(num(p['width']), 24))
        if p.get('oneway') == 'yes' and hw in ('trunk', 'primary', 'secondary') and not lanes: w *= .7
        br = 1 if p.get('bridge') in ('yes', 'movable', 'viaduct') else 0
        roads.append([RC[rclass(hw)], r1(w), br, int(p.get('layer', 0) or 0) if str(p.get('layer', '0')).lstrip('-').isdigit() else 0, p.get('name', ''), flat(pts)])
        road_geoms.append((ls, w, hw))
    elif hw in ('footway', 'pedestrian', 'path', 'cycleway', 'steps') and p.get('footway') != 'sidewalk' and p.get('tunnel') != 'yes':
        if near(ls, CORR): paths.append([1 if hw == 'pedestrian' else 0, flat(pts)])

# ------------------------------------------------------------ areas
areas = []
AK = {'water': 0, 'grass': 1, 'park': 2, 'pitch': 3, 'parking': 4, 'plaza': 5, 'wood': 6, 'rail': 7, 'construction': 8}
water_polys = []
for f in F:
    p = f['p']; k = None
    if p.get('natural') == 'water' or p.get('waterway') in ('riverbank', 'dock'): k = 'water'
    elif p.get('leisure') in ('park', 'garden', 'common', 'recreation_ground') or p.get('landuse') in ('grass', 'village_green', 'recreation_ground', 'cemetery', 'meadow', 'flowerbed'): k = 'grass' if p.get('landuse') else 'park'
    elif p.get('leisure') in ('pitch', 'playground', 'sports_centre'): k = 'pitch'
    elif p.get('amenity') == 'parking' and p.get('parking', 'surface') == 'surface': k = 'parking'
    elif p.get('highway') == 'pedestrian' or p.get('area:highway') or p.get('place') == 'square': k = 'plaza'
    elif p.get('natural') in ('wood', 'scrub'): k = 'wood'
    elif p.get('landuse') == 'railway': k = 'rail'
    elif p.get('landuse') in ('construction', 'brownfield'): k = 'construction'
    if not k: continue
    for rr in rings(f['g']):
        pg = poly_of(rr)
        if not pg or pg.is_empty: continue
        if k == 'water':
            pg = pg.intersection(ROUTE.buffer(1600))
            water_polys.append(pg)
            continue
        if not near(pg): continue
        pg = pg.intersection(ROUTE.buffer(CORR + 80))
        for q in (pg.geoms if hasattr(pg, 'geoms') else [pg]):
            if q.geom_type != 'Polygon' or q.area < 20: continue
            q = q.simplify(.4)
            areas.append([AK[k], flat(q.exterior.coords[:-1]), [flat(h.coords[:-1]) for h in q.interiors]])
wu = unary_union(water_polys)
for q in (wu.geoms if hasattr(wu, 'geoms') else [wu]):
    if q.geom_type != 'Polygon' or q.area < 50: continue
    q = q.simplify(1)
    areas.append([0, flat(q.exterior.coords[:-1]), [flat(h.coords[:-1]) for h in q.interiors]])

# ------------------------------------------------------------ railways (viaducts)
rails = []
for f in F:
    p = f['p']
    if p.get('railway') not in ('rail', 'light_rail', 'subway') or f['g']['type'] != 'LineString': continue
    if p.get('tunnel') == 'yes' or p.get('railway') == 'subway': continue
    pts = [P(c) for c in f['g']['coordinates']]; ls = LineString(pts)
    if not near(ls, CORR + 100): continue
    rails.append([1 if p.get('bridge') in ('yes', 'viaduct') or p.get('layer') in ('1', '2') else 0, flat(pts)])

# ------------------------------------------------------------ points
NK = {}
pts_out = []
shops = []
def addn(kind, x, z, a=0):
    pts_out.append([kind, r1(x), r1(z), round(a, 2)])
SHOPLABEL = {'convenience': 'NEWS & WINE', 'hairdresser': 'BARBER', 'supermarket': 'SUPERMARKET', 'alcohol': 'OFF LICENCE', 'clothes': 'FASHION',
             'mobile_phone': 'PHONE REPAIRS', 'bakery': 'BAKERY', 'beauty': 'BEAUTY', 'butcher': 'BUTCHER', 'laundry': 'LAUNDERETTE', 'dry_cleaning': 'DRY CLEANERS',
             'chemist': 'CHEMIST', 'betting': 'BOOKMAKERS', 'bookmaker': 'BOOKMAKERS', 'furniture': 'FURNITURE', 'car_repair': 'MOT · REPAIRS', 'tyres': 'TYRES',
             'charity': 'CHARITY SHOP', 'estate_agent': 'ESTATE AGENTS', 'florist': 'FLORIST', 'hardware': 'HARDWARE', 'greengrocer': 'GROCER', 'kiosk': 'NEWSAGENT',
             'variety_store': 'POUND STORE', 'pawnbroker': 'CASH CONVERTERS', 'electronics': 'ELECTRONICS', 'optician': 'OPTICIAN', 'travel_agency': 'TRAVEL',
             'tattoo': 'TATTOO', 'car': 'CAR SALES', 'motorcycle': 'MOTORBIKES', 'bicycle': 'CYCLES', 'pet': 'PET SHOP', 'books': 'BOOKS', 'deli': 'DELI', 'wine': 'WINES'}
AMLABEL = {'pharmacy': 'PHARMACY', 'bank': 'BANK', 'fast_food': 'TAKEAWAY', 'cafe': 'CAFE', 'restaurant': 'RESTAURANT', 'pub': 'PUB', 'bar': 'BAR', 'dentist': 'DENTAL',
           'doctors': 'SURGERY', 'post_office': 'POST OFFICE', 'library': 'LIBRARY'}
for f in F:
    p = f['p']; g = f['g']
    if g['type'] != 'Point': continue
    x, z = P(g['coordinates']); pt = Point(x, z)
    if pt.distance(ROUTE) > CORR: continue
    if p.get('natural') == 'tree': addn('tree', x, z); continue
    hw = p.get('highway'); am = p.get('amenity')
    if hw == 'street_lamp': addn('lamp', x, z)
    elif hw == 'traffic_signals': addn('signal', x, z)
    elif hw == 'bus_stop': addn('busstop', x, z)
    elif am == 'bench': addn('bench', x, z)
    elif am == 'post_box': addn('postbox', x, z)
    elif am == 'telephone': addn('phone', x, z)
    elif am == 'waste_basket': addn('bin', x, z)
    elif am == 'bicycle_parking': addn('bikes', x, z)
    elif p.get('barrier') == 'bollard': addn('bollard', x, z)
    elif p.get('man_made') == 'surveillance': addn('cctv', x, z)
    if p.get('shop') or am in AMLABEL:
        lab = SHOPLABEL.get(p.get('shop'), AMLABEL.get(am))
        nm = p.get('name', '')
        if am in ('pub', 'cafe', 'restaurant', 'bar') and nm and not p.get('brand'): lab = nm.upper()[:22]
        if not lab: lab = (p.get('shop') or am or 'SHOP').replace('_', ' ').upper()[:18]
        shops.append((x, z, lab, am or p.get('shop')))

# ------------------------------------------------------------ buildings
raw = []
for f in F:
    p = f['p']
    isb = 'building' in p and p.get('building') not in ('no', 'roof', 'construction') or 'building:part' in p
    if not isb: continue
    for rr in rings(f['g']):
        pg = poly_of(rr)
        if not pg or pg.is_empty or pg.area < 8: continue
        if pg.geom_type == 'MultiPolygon': pg = max(pg.geoms, key=lambda q: q.area)
        ht = num(p.get('height')) or num(p.get('building:height'))
        tall = ht and ht > 45
        if not near(pg) and not tall: continue
        raw.append({'p': p, 'g': pg, 'part': 'building:part' in p, 'id': p.get('@id', id(f))})
parts = [b for b in raw if b['part']]
ptree = STRtree([b['g'].representative_point() for b in parts]) if parts else None
blds = []
for b in raw:
    if not b['part'] and ptree is not None:
        idx = ptree.query(b['g'])
        if any(b['g'].contains(parts[i]['g'].representative_point()) for i in idx): continue
    blds.append(b)

# shop nodes -> buildings
btree = STRtree([b['g'] for b in blds])
shoplab = collections.defaultdict(list)
for x, z, lab, typ in shops:
    pt = Point(x, z)
    idx = btree.query(pt.buffer(8))
    best = None; bd = 9
    for i in idx:
        d = blds[i]['g'].distance(pt)
        if d < bd: bd = d; best = i
    if best is not None: shoplab[best].append((x, z, lab, typ))

mainroads = [ls.buffer(w / 2 + 9) for ls, w, hw in road_geoms if hw in ('trunk', 'primary', 'secondary', 'tertiary', 'trunk_link', 'primary_link')]
mtree = STRtree(mainroads)
allroads = [(ls, w) for ls, w, hw in road_geoms]
rtree = STRtree([ls for ls, w in allroads])

STY = ['stock', 'red', 'warehouse', 'council', 'portland', 'glass', 'stucco', 'ragstone', 'cladding', 'darkbrick']
SI = {s: i for i, s in enumerate(STY)}
out_b = []
for i, b in enumerate(blds):
    p = b['p']; g = b['g'].simplify(.25, preserve_topology=True)
    if g.geom_type != 'Polygon' or g.area < 8: continue
    t = p.get('building') or p.get('building:part') or 'yes'
    hsh = H(b['id'])
    lv = num(p.get('building:levels')); ht = num(p.get('height')) or num(p.get('building:height'))
    mh = num(p.get('min_height')) or (num(p.get('building:min_level')) or 0) * 3.2
    A = g.area
    if not lv:
        lv = {'house': 2, 'detached': 2, 'semidetached_house': 2, 'terrace': 3, 'apartments': 5 if A < 900 else 7, 'residential': 4, 'commercial': 4, 'retail': 2 if A > 1500 else 3,
              'office': 7, 'industrial': 2, 'warehouse': 2, 'garages': 1, 'garage': 1, 'shed': 1, 'church': 4, 'school': 3, 'hotel': 8, 'university': 5,
              'castle': 4, 'service': 1, 'train_station': 3, 'public': 4, 'civic': 4, 'hospital': 6, 'kiosk': 1}.get(t)
    if not lv:
        lv = 2 if A < 70 else 3 if A < 250 else 4 if A < 900 else 5 if A < 2500 else 6
        lv += (hsh % 3 == 0)
    lvh = 4.2 if t in ('industrial', 'warehouse', 'retail', 'church', 'train_station') else 3.15
    if not ht: ht = lv * lvh + (.6 if t not in ('garages', 'shed', 'service') else 0)
    ht = max(ht, 2.6)
    if mh >= ht: mh = 0
    # roof
    rs = p.get('roof:shape') or p.get('building:roof:shape')
    roof = 0
    if rs in ('gabled', 'saltbox', 'gambrel', 'mansard', 'half-hipped', 'round'): roof = 1
    elif rs in ('hipped', 'pyramidal', 'side_hipped', 'skillion'): roof = 2
    elif rs in ('dome', 'onion'): roof = 3
    elif not rs and t in ('house', 'terrace', 'detached', 'semidetached_house') and ht < 14: roof = 1 if len(g.exterior.coords) <= 7 else 2
    elif not rs and t in ('church',): roof = 1
    elif not rs and t in ('residential', 'yes') and ht < 12 and A < 260 and hsh % 3 == 0: roof = 1 if len(g.exterior.coords) <= 7 else 2
    # style
    mat = (p.get('building:material') or '').lower(); col = (p.get('building:colour') or '').lower()
    nm = (p.get('name') or '').lower()
    if t in ('castle',) or 'tower of london' in nm or mat in ('stone', 'sandstone', 'limestone') and t in ('church', 'castle', 'chapel'): sty = 'ragstone'
    elif mat in ('glass', 'mirror') or (t == 'office' and ht > 30 and hsh % 3): sty = 'glass'
    elif mat in ('stone', 'limestone', 'sandstone', 'marble') or (t in ('office', 'civic', 'public', 'bank', 'hotel') and hsh % 2 == 0): sty = 'portland'
    elif mat in ('plaster', 'render', 'stucco') or col in ('white', 'cream', 'beige', 'ivory'): sty = 'stucco'
    elif mat in ('concrete', 'cement_block'): sty = 'council'
    elif mat in ('metal', 'steel', 'panel', 'metal_plates', 'wood', 'timber_framing'): sty = 'cladding'
    elif t in ('industrial', 'warehouse'): sty = 'warehouse' if hsh % 3 else 'cladding'
    elif t in ('apartments', 'residential') and ht > 15: sty = ['council', 'council', 'darkbrick', 'cladding', 'stock'][hsh % 5]
    elif t in ('apartments',) and ht <= 15: sty = ['council', 'stock', 'red', 'darkbrick'][hsh % 4]
    elif t in ('house', 'terrace', 'semidetached_house', 'detached'): sty = ['stock', 'stock', 'red', 'stucco', 'stock', 'darkbrick'][hsh % 6]
    elif t == 'church': sty = 'ragstone' if hsh % 2 else 'stock'
    elif t in ('school', 'hospital', 'university'): sty = ['red', 'stock', 'council'][hsh % 3]
    elif t in ('retail', 'supermarket') and A > 1200: sty = 'cladding'
    else: sty = ['stock', 'red', 'stock', 'darkbrick', 'stucco', 'red', 'council'][hsh % 7]
    if col in ('red', 'brown', 'darkred') and sty in ('stock', 'stucco'): sty = 'red'
    if col in ('yellow', 'tan', 'sand') and sty in ('red', 'stucco'): sty = 'stock'
    # ground-floor shops
    shop = 0; signs = []
    if i in shoplab: shop = 1
    elif t in ('retail', 'commercial') and lv <= 6 and A < 1500 and mtree.query(g).size: shop = 1
    elif t in ('yes', 'residential', 'apartments', 'terrace') and lv <= 5 and A < 700 and any(mainroads[j].contains(g.representative_point()) or mainroads[j].intersects(g) for j in mtree.query(g)) and hsh % 4 != 0 and ht < 18: shop = 2
    # facade facing nearest road edge for signs
    coords = list(g.exterior.coords)[:-1]
    if g.exterior.is_ccw: coords = coords[::-1]  # make clockwise in lon/lat-ish (x east, z south) => consistent outward normals later
    if shop:
        cands = shoplab.get(i) or [(None, None, None, None)]
        used = set()
        for (sx, sz, lab, typ) in cands[:4]:
            # edge with smallest distance to a road, prefer near the shop node
            best = None; bd = 1e9
            for k in range(len(coords)):
                a = coords[k]; c = coords[(k + 1) % len(coords)]
                L = math.dist(a, c)
                if L < 3: continue
                m = ((a[0] + c[0]) / 2, (a[1] + c[1]) / 2)
                rd = min((allroads[j][0].distance(Point(m)) for j in rtree.query(Point(m).buffer(30))), default=99)
                d = rd + (math.dist(m, (sx, sz)) * .5 if sx is not None else 0) + (30 if k in used else 0)
                if d < bd: bd = d; best = k
            if best is not None and bd < 45:
                used.add(best); signs.append([best, lab or ''])
    out_b.append([r1(ht), r1(mh), roof, SI[sty], shop, int(lv), flat(coords), [flat(h.coords[:-1]) for h in g.interiors if Polygon(h).area > 20], signs, (nm or '')[:30]])

# ------------------------------------------------------------ walls / fences
walls = []
for f in F:
    p = f['p']; br = p.get('barrier')
    if br not in ('wall', 'fence', 'retaining_wall', 'hedge', 'guard_rail', 'city_wall') or f['g']['type'] != 'LineString': continue
    pts = [P(c) for c in f['g']['coordinates']]; ls = LineString(pts)
    if not near(ls, CORR - 60): continue
    walls.append([{'wall': 0, 'retaining_wall': 0, 'city_wall': 3, 'fence': 1, 'hedge': 2, 'guard_rail': 4}[br], r1(num(p.get('height')) or 0), flat(pts)])

W = {'origin': [LON0, LAT0], 'route': flat(RJ['route']), 'roads': roads, 'paths': paths, 'areas': areas, 'rails': rails, 'nodes': pts_out, 'buildings': out_b, 'walls': walls,
     'credit': '© OpenStreetMap contributors, ODbL'}
s = json.dumps(W, separators=(',', ':'))
open('/home/claude/osm/world.json', 'w').write(s)
print('buildings', len(out_b), 'shops', sum(1 for b in out_b if b[4]), 'roads', len(roads), 'areas', len(areas), 'rails', len(rails), 'nodes', len(pts_out),
      collections.Counter(n[0] for n in pts_out), 'walls', len(walls), 'paths', len(paths), 'bytes', len(s))
print(collections.Counter(STY[b[3]] for b in out_b), collections.Counter(b[2] for b in out_b))

# ------------------------------------------------------------ gameplay anchors + clearing + ground
from shapely.geometry import box as sbox
from shapely import affinity
def frame(ax, az, a, ox, oz):
    return dict(ax=round(ax, 2), az=round(az, 2), a=round(a, 4), ox=ox, oz=oz)
def TF(F, x, z):
    c, s = math.cos(F['a']), math.sin(F['a']); lx, lz = x - F['ox'], z - F['oz']
    return (F['ax'] + lx * c + lz * s, F['az'] - lx * s + lz * c)
def rectpoly(F, x0, z0, x1, z1):
    return Polygon([TF(F, x0, z0), TF(F, x1, z0), TF(F, x1, z1), TF(F, x0, z1)])
car_lines = [(ls, w) for ls, w, hw in road_geoms if hw in ('trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'trunk_link', 'primary_link')]
def routeAt(s):
    q = ROUTE.interpolate(s); q2 = ROUTE.interpolate(min(s + 4, ROUTE.length)); dx, dz = q2.x - q.x, q2.y - q.y; L = math.hypot(dx, dz) or 1
    return q.x, q.y, dx / L, dz / L
A = {}
# --- fuel station (Tesco, Dunton Rd / Mandela Way) : forecourt authored around (87,199), west entrance at local (58,190)
fx, fz = P((-0.076102, 51.489965))
best = None
for ls, w in car_lines:
    d = ls.distance(Point(fx, fz))
    if best is None or d < best[0]: best = (d, ls, w)
q = best[1].interpolate(best[1].project(Point(fx, fz)))
ux, uz = q.x - fx, q.y - fz; L = math.hypot(ux, uz); ux, uz = ux / L, uz / L
a = math.atan2(uz, -ux)
cx, cz = q.x - ux * (29 + best[2] / 2 + 2.5), q.y - uz * (29 + best[2] / 2 + 2.5)
A['fore'] = frame(cx, cz, a, 87, 199)
A['foreRoad'] = [round(q.x, 1), round(q.y, 1), round(best[2], 1)]
# --- military checkpoint and pileup on Old Kent Road; evac yard at the end
S_CHECK, S_PILE0, S_PILE1 = 3330, 3440, 3980
x, z, dx, dz = routeAt(S_CHECK); A['check'] = frame(x, z, math.atan2(dx, dz), 0, 0)
A['s'] = dict(check=S_CHECK, pile0=S_PILE0, pile1=S_PILE1, len=round(ROUTE.length, 1))
# evac yard: authored port x 880..990 (yard) + 990..1060 (convoy). Entrance side local -x faces the route end.
x, z, dx, dz = routeAt(ROUTE.length - 2)
a = math.atan2(-dz, dx)   # local +x  -> route direction
A['port'] = frame(x + dx * 2, z + dz * 2, a, 880, 462)
A['s']['port'] = round(ROUTE.length, 1)
# --- Tower Bridge: towers at bascule ends, authored road along +x at z=459, towers 597 / 669
t1 = P((-0.075162, 51.505816)); t2 = P((-0.075567, 51.505216))
mx, mz = (t1[0] + t2[0]) / 2, (t1[1] + t2[1]) / 2; dx, dz = t2[0] - t1[0], t2[1] - t1[1]; L = math.hypot(dx, dz)
A['bridge'] = frame(mx, mz, math.atan2(-dz / L, dx / L), 633, 459)
A['bridgeLen'] = round(L, 1)
A['s']['bridge'] = round(ROUTE.project(Point(mx, mz)), 1)
# start
x, z, dx, dz = routeAt(14); A['start'] = [round(x, 2), round(z, 2), round(math.atan2(dx, dz), 4)]
clears = [rectpoly(A['fore'], 54, 164, 120, 234), rectpoly(A['port'], 876, 420, 1075, 504), rectpoly(A['bridge'], 460, 428, 810, 490)]
x, z, dx, dz = routeAt(S_CHECK)
clears.append(Point(x, z).buffer(1))
keep = []
for b in W['buildings']:
    c = b[6]; pg = Polygon([(c[i], c[i + 1]) for i in range(0, len(c), 2)])
    if any(cl.intersects(pg) for cl in clears[:3]): continue
    keep.append(b)
print('cleared', len(W['buildings']) - len(keep)); W['buildings'] = keep
W['nodes'] = [n for n in W['nodes'] if not any(cl.contains(Point(n[1], n[2])) for cl in clears[:3])]
conn = LineString([TF(A['fore'], 66, 190), TF(A['fore'], 40, 190), tuple(A['foreRoad'][:2])]).buffer(8)
conn2 = LineString([TF(A['fore'], 75, 226), TF(A['fore'], 75, 260)]).buffer(8)
zones = clears[:3] + [conn, conn2, rectpoly(A['port'], 830, 440, 890, 484)]
nw = len(W['walls'])
W['walls'] = [w for w in W['walls'] if not any(z.intersects(LineString([(w[2][i], w[2][i + 1]) for i in range(0, len(w[2]), 2)])) for z in zones)]
W['buildings'] = [b for b in W['buildings'] if not any(z.intersects(Polygon([(b[6][i], b[6][i + 1]) for i in range(0, len(b[6]), 2)])) for z in zones[3:])]
print('walls removed', nw - len(W['walls']))
W['anchors'] = A
# ground = big buffer minus water
gnd = ROUTE.buffer(1500).difference(wu).simplify(1.5)
W['ground'] = [[flat(q.exterior.coords[:-1]), [flat(h.coords[:-1]) for h in q.interiors]] for q in (gnd.geoms if hasattr(gnd, 'geoms') else [gnd]) if q.area > 100]
s = json.dumps(W, separators=(',', ':'))
open('/home/claude/osm/world.json', 'w').write(s)
print('anchors', json.dumps(A)); print('bytes', len(s))

# ------------------------------------------------------------ v5: clean road surfaces, kerbs, markings, furniture placement
from shapely.geometry import MultiLineString
from shapely.ops import unary_union as UU
CLS = ['trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service']
car_ways = []
for r in W['roads']:
    cls, w, br, layer, name, pts = r
    ls = LineString([(pts[i], pts[i + 1]) for i in range(0, len(pts), 2)])
    car_ways.append((cls, w, br, name, ls))
ground_ways = [c for c in car_ways if not c[2]]
carr = UU([ls.buffer(w / 2, quad_segs=6) for cls, w, br, nm, ls in ground_ways]).simplify(.15)
pavesrc = UU([ls.buffer(w / 2 + 3.2, quad_segs=6) for cls, w, br, nm, ls in ground_ways if cls <= 4])
bldU = UU([Polygon([(b[6][i], b[6][i + 1]) for i in range(0, len(b[6]), 2)]).buffer(0) for b in W['buildings']])
pave = pavesrc.difference(carr).difference(bldU.buffer(.05)).difference(wu).simplify(.15)
# junctions: nodes shared by >=2 ways
cnt = collections.Counter(); wmax = {}
for cls, w, br, nm, ls in car_ways:
    if cls > 4: continue
    for c in set((round(x, 1), round(z, 1)) for x, z in ls.coords):
        cnt[c] += 1; wmax[c] = max(wmax.get(c, 0), w)
junc_pts = [Point(c).buffer(wmax[c] / 2 + 2.5, quad_segs=4) for c, n in cnt.items() if n >= 2]
JZ = UU(junc_pts)
def polys(g):
    return [q for q in (g.geoms if hasattr(g, 'geoms') else [g]) if q.geom_type == 'Polygon' and q.area > 1]
def lines(g):
    out = []
    for q in (g.geoms if hasattr(g, 'geoms') else [g]):
        if q.geom_type == 'LineString' and q.length > 1.5: out.append(flat(q.coords))
        elif q.geom_type in ('MultiLineString', 'GeometryCollection'): out += lines(q)
    return out
W['carr'] = [[flat(q.exterior.coords[:-1]), [flat(h.coords[:-1]) for h in q.interiors]] for q in polys(carr)]
W['pave'] = [[flat(q.exterior.coords[:-1]), [flat(h.coords[:-1]) for h in q.interiors]] for q in polys(pave)]
W['kerb'] = lines(carr.boundary.intersection(pave.buffer(.4)))
main = UU([ls.buffer(w / 2, quad_segs=6) for cls, w, br, nm, ls in ground_ways if cls <= 2])
W['yellow'] = lines(UU([main.buffer(-.45).boundary, main.buffer(-.65).boundary]).difference(JZ).intersection(carr.buffer(-.2)))
W['dash'] = lines(UU([ls for cls, w, br, nm, ls in ground_ways if cls <= 3 and w >= 8.5]).difference(JZ.buffer(2)))
# ---- street furniture: keep off the carriageway, regenerate lamps along kerbs
ctree = carr
def onCarr(x, z): return carr.contains(Point(x, z))
def toKerb(x, z, off=1.0):
    pt = Point(x, z)
    q = carr.exterior.interpolate(0) if False else None
    b = carr.boundary
    d = b.project(pt) if b.geom_type == 'LineString' else None
    # nearest boundary point
    from shapely.ops import nearest_points
    qb = nearest_points(b, pt)[0]
    nx, nz = x - qb.x, z - qb.y; L = math.hypot(nx, nz) or 1
    # outward = away from carriageway: test a probe
    for sgn in (1, -1):
        px, pz = qb.x + nx / L * off * sgn * (1 if onCarr(x, z) is False else -1), qb.y + nz / L * off * sgn * (1 if onCarr(x, z) is False else -1)
        if not onCarr(px, pz) and not bldU.contains(Point(px, pz)): return px, pz
    return None
bt = STRtree(polys(bldU))
def inBld(x, z, r=.3):
    p = Point(x, z).buffer(r)
    return any(bt.geometries[i].intersects(p) for i in bt.query(p))
newn = []; moved = 0; dropped = 0
for n in W['nodes']:
    k, x, z, a = n
    if k == 'lamp': continue   # regenerated below
    if onCarr(x, z) or (k == 'tree' and carr.distance(Point(x, z)) < .9):
        if k == 'signal': newn.append(n); continue  # signals are expanded at junction kerbs below
        r = toKerb(x, z, 1.4 if k == 'tree' else .9)
        if not r: dropped += 1; continue
        x, z = r; moved += 1
    if k == 'tree' and inBld(x, z, 1.2): dropped += 1; continue
    newn.append([k, r1(x), r1(z), a])
# signals: two poles at the kerb either side of the carriageway at each signal node
sig = [n for n in newn if n[0] == 'signal']; newn = [n for n in newn if n[0] != 'signal']
from shapely.ops import nearest_points
for k, x, z, a in sig:
    # nearest way direction
    best = min(ground_ways, key=lambda c: c[4].distance(Point(x, z)), default=None)
    if not best or best[4].distance(Point(x, z)) > 8: continue
    ls = best[4]; t = ls.project(Point(x, z)); p0 = ls.interpolate(max(0, t - 2)); p1 = ls.interpolate(min(ls.length, t + 2))
    dx, dz = p1.x - p0.x, p1.y - p0.y; L = math.hypot(dx, dz) or 1; nx, nz = dz / L, -dx / L
    q = ls.interpolate(t)
    for s in (-1, 1):
        for off in [best[1] / 2 + .6 + i * .4 for i in range(8)]:
            px, pz = q.x + nx * off * s, q.y + nz * off * s
            if not onCarr(px, pz) and not inBld(px, pz, .2): newn.append(['signal', r1(px), r1(pz), round(math.atan2(-nx * s, -nz * s), 2)]); break
# lamps every ~30 m along kerbs of real streets, staggered, never in junction mouths or on the carriageway
lamps = []
from shapely.strtree import STRtree as ST
def farFromLamps(x, z, d=12):
    return all((x - a) ** 2 + (z - b) ** 2 > d * d for a, b in lamps[-60:])
JZb = JZ.buffer(2)
for cls, w, br, nm, ls in ground_ways:
    if cls > 4 or ls.distance(ROUTE) > CORR: continue
    step = 26 if cls <= 2 else 32; side = 1; t = 6
    while t < ls.length - 4:
        p0 = ls.interpolate(t); p1 = ls.interpolate(min(ls.length, t + 1)); dx, dz = p1.x - p0.x, p1.y - p0.y; L = math.hypot(dx, dz) or 1
        nx, nz = dz / L, -dx / L; off = w / 2 + .6
        x, z = p0.x + nx * off * side, p0.y + nz * off * side
        if not onCarr(x, z) and not JZb.contains(Point(x, z)) and not inBld(x, z, .3) and farFromLamps(x, z):
            lamps.append((x, z)); newn.append(['lamp', r1(x), r1(z), round(math.atan2(-nx * side, -nz * side), 2)])
        side = -side; t += step
# road signs near junctions on main roads (breakable props)
SIGNS_K = ['sign_20', 'sign_noentry', 'sign_giveway', 'sign_keepleft', 'sign_bus', 'sign_nostop']
hj = 0
for c, n in cnt.items():
    if n < 2 or Point(c).distance(ROUTE) > CORR: continue
    hj += 1
    if hj % 2: continue
    pt = Point(c)
    for ang in (0.7, 3.9):
        r = wmax[c] / 2 + 2.2
        x, z = c[0] + math.cos(ang + hj) * r, c[1] + math.sin(ang + hj) * r
        if not onCarr(x, z) and not inBld(x, z, .3) and pave.contains(Point(x, z)):
            newn.append([SIGNS_K[(hj // 2 + int(ang)) % len(SIGNS_K)], r1(x), r1(z), round(ang + hj, 2)])
W['nodes'] = newn
print('furniture moved', moved, 'dropped', dropped, 'lamps', len(lamps), collections.Counter(n[0] for n in newn))
print('carr polys', len(W['carr']), 'pave', len(W['pave']), 'kerb', len(W['kerb']), 'yellow', len(W['yellow']), 'dash', len(W['dash']))
s = json.dumps(W, separators=(',', ':'))
open('/home/claude/osm/world.json', 'w').write(s)
print('bytes', len(s))
