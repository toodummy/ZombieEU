"""Clip the Geofabrik Greater London extract (© OpenStreetMap contributors, ODbL) to the game area and export GeoJSON."""
import subprocess, json, gzip, os, urllib.request
S,W,N,E = 51.476, -0.093, 51.5125, -0.054
os.makedirs("assets/osm",exist_ok=True)
for u in ["https://download.geofabrik.de/europe/united-kingdom/england/greater-london-latest.osm.pbf","https://download.geofabrik.de/europe/great-britain/england/greater-london-latest.osm.pbf","https://download.openstreetmap.fr/extracts/europe/united_kingdom/england/greater_london-latest.osm.pbf"]:
    try:
        urllib.request.urlretrieve(u,"/tmp/gl.pbf");print("got",u,flush=True);break
    except Exception as e: print("fail",u,e,flush=True); print("pbf",os.path.getsize("/tmp/gl.pbf"),flush=True)
subprocess.check_call(["osmium","extract","-b",f"{W},{S},{E},{N}","-s","smart","/tmp/gl.pbf","-o","/tmp/a.pbf","--overwrite"])
subprocess.check_call(["osmium","export","/tmp/a.pbf","-f","geojsonseq","-o","/tmp/a.geojsonseq","--overwrite","-a","type,id"])
keep=("building","building:part","highway","railway","natural","waterway","landuse","leisure","amenity","barrier","man_made","shop","tourism","bridge","place","water","area:highway")
out=[]
for line in open("/tmp/a.geojsonseq",encoding="utf8"):
    line=line.strip().lstrip("\x1e")
    if not line: continue
    f=json.loads(line); p=f.get("properties",{})
    if not any(k in p for k in keep): continue
    def rnd(c):
        if isinstance(c[0],(int,float)): return [round(c[0],6),round(c[1],6)]
        return [rnd(x) for x in c]
    f["geometry"]["coordinates"]=rnd(f["geometry"]["coordinates"])
    out.append({"g":f["geometry"],"p":p})
print("features",len(out),flush=True)
with gzip.open("assets/osm/london_tb_okr.geojson.gz","wt",encoding="utf8") as fh: json.dump(out,fh,separators=(",",":"))
print("size",os.path.getsize("assets/osm/london_tb_okr.geojson.gz"))
