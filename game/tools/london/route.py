import gzip,json,math,heapq,collections
F=json.load(gzip.open('/home/claude/zombieeu/assets/osm/london_tb_okr.geojson.gz','rt'))
LON0,LAT0=-0.075365,51.505517  # Tower Bridge centre
KX=math.cos(math.radians(LAT0))*111320; KZ=110574
P=lambda c:(round((c[0]-LON0)*KX,2),round(-(c[1]-LAT0)*KZ,2))
CAR={'motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','service','trunk_link','primary_link','secondary_link','tertiary_link'}
G=collections.defaultdict(list);names={}
for f in F:
    p=f['p'];hw=p.get('highway')
    if hw not in CAR or f['g']['type']!='LineString':continue
    if not (hw in('trunk','primary','secondary','primary_link','trunk_link') or p.get('name') in('Mansell Street',)):continue
    if p.get('access') in('private','no') or p.get('service') in('parking_aisle','driveway'):continue
    cs=f['g']['coordinates'];ow=p.get('oneway')=='yes'
    cost={'trunk':1,'primary':1,'secondary':1.4,'tertiary':2,'residential':6,'unclassified':5,'service':6}.get(hw,2)
    for a,b in zip(cs,cs[1:]):
        A,B=tuple(a),tuple(b);pa,pb=P(a),P(b);d=math.dist(pa,pb)
        G[A].append((B,d*cost,p.get('name','')));
        G[B].append((A,d*cost*(1 if True else 1),p.get('name','')))  # ignore one-way: apocalypse
def near(lon,lat):
    return min(G,key=lambda n:(n[0]-lon)**2+((n[1]-lat)*1.6)**2)
def path(a,b):
    D={a:0};prev={};q=[(0,a)]
    while q:
        d,u=heapq.heappop(q)
        if u==b:break
        if d>D[u]:continue
        for v,w,_ in G[u]:
            nd=d+w
            if nd<D.get(v,1e18):D[v]=nd;prev[v]=u;heapq.heappush(q,(nd,v))
    out=[b]
    while out[-1]!=a:out.append(prev[out[-1]])
    return out[::-1]
WP=[(-0.0727,51.5108),(-0.0744,51.5069),(-0.0762,51.5042),(-0.0845,51.4943),(-0.0700,51.4862),(-0.0590,51.4811)]
OLD=[(-0.0727,51.5108),(-0.0744,51.5069),(-0.0762,51.5042),(-0.0845,51.4943),(-0.0782,51.4911),(-0.0761,51.4898),(-0.0775,51.4904),(-0.0700,51.4862),(-0.0596,51.4803)]
nodes=[near(*w) for w in WP]
R=[]
for a,b in zip(nodes,nodes[1:]):
    seg=path(a,b);R+=seg if not R else seg[1:]
pts=[P(n) for n in R];L=sum(math.dist(a,b) for a,b in zip(pts,pts[1:]))
# street names along route
nm=[];
for a,b in zip(R,R[1:]):
    for v,w,n in G[a]:
        if v==b and (not nm or nm[-1]!=n):nm.append(n)
print('route length m',round(L),'pts',len(pts));print(nm)
json.dump({'lon0':LON0,'lat0':LAT0,'route':pts},open('route.json','w'))
print(pts[0],pts[-1])
