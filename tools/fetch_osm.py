"""Download OpenStreetMap data (ODbL) for the game area via Overpass and save raw JSON."""
import json, os, sys, time, urllib.request, urllib.parse
S,W,N,E = 51.476, -0.093, 51.5125, -0.054   # Tower Hill -> Tower Bridge -> Bermondsey -> Old Kent Road
BB=f"{S},{W},{N},{E}"
Q=f"""[out:json][timeout:300][maxsize:1073741824];
(
 way["building"]({BB}); relation["building"]({BB});
 way["building:part"]({BB});
 way["highway"]({BB});
 way["railway"]({BB});
 way["natural"~"water|wood|scrub"]({BB}); relation["natural"="water"]({BB});
 way["waterway"]({BB});
 way["landuse"]({BB}); relation["landuse"]({BB});
 way["leisure"]({BB}); relation["leisure"]({BB});
 way["amenity"]({BB});
 way["barrier"]({BB});
 way["man_made"]({BB});
 node["natural"="tree"]({BB});
 node["highway"~"street_lamp|traffic_signals|bus_stop|crossing"]({BB});
 node["amenity"~"bench|telephone|post_box|waste_basket|bicycle_parking|fuel|pub|cafe|restaurant|fast_food|pharmacy|bank"]({BB});
 node["shop"]({BB});
 node["barrier"~"bollard|gate"]({BB});
 node["man_made"]({BB});
 node["tourism"]({BB});
);
out geom qt;"""
EPS=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter","https://overpass.private.coffee/api/interpreter"]
os.makedirs("assets/osm",exist_ok=True)
for i in range(6):
    ep=EPS[i%len(EPS)]
    try:
        print("query",ep,flush=True)
        req=urllib.request.Request(ep,data=urllib.parse.urlencode({"data":Q}).encode(),headers={"User-Agent":"ZombieEU-game-builder/1.0"})
        d=urllib.request.urlopen(req,timeout=400).read()
        j=json.loads(d); n=len(j.get("elements",[]))
        print("elements",n,flush=True)
        if n<1000: raise Exception("too few")
        open("assets/osm/london_tb_okr.json","wb").write(d); break
    except Exception as e:
        print("fail",e,flush=True); time.sleep(20)
else: sys.exit(1)
