#!/usr/bin/env python3
"""Download game assets listed in assets/manifest.json.
- polyhaven: CC0 textures / HDRIs / models via api.polyhaven.com (first available id in each `want` list)
- urls: direct downloads (e.g. generated GLB / audio results)
Writes assets/fetch-log.json with what was fetched and from where (rights register input)."""
import json, os, sys, urllib.request, urllib.error
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets')
UA = {'User-Agent': 'ZombieEU-asset-fetch/1.0'}
def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r: return r.read()
def save(rel, url):
    p = os.path.join(A, rel)
    if os.path.exists(p) and os.path.getsize(p) > 0: return 'exists'
    os.makedirs(os.path.dirname(p), exist_ok=True)
    data = get(url)
    with open(p, 'wb') as f: f.write(data)
    return len(data)
man = json.load(open(os.path.join(A, 'manifest.json')))
log = {'polyhaven': [], 'urls': [], 'errors': []}
ph = man.get('polyhaven', {})
RES = ph.get('res', '1k')
def files(aid):
    try: return json.loads(get(f'https://api.polyhaven.com/files/{aid}'))
    except Exception as e: return None
for t in ph.get('textures', []):
    for aid in t['want']:
        fj = files(aid)
        if not fj: continue
        got = {}
        for want_map in t['maps']:
            key = next((k for k in fj if k.lower() == want_map.lower()), None)
            if not key: continue
            node = fj[key].get(t.get('res', RES)) or next(iter(fj[key].values()))
            fmt = 'jpg' if 'jpg' in node else next(iter(node))
            url = node[fmt]['url']
            rel = f"tex/{t['as']}_{want_map.lower()}.{fmt}"
            try: save(rel, url); got[want_map] = rel
            except Exception as e: log['errors'].append([aid, want_map, str(e)])
        log['polyhaven'].append({'as': t['as'], 'id': aid, 'license': 'CC0', 'source': f'https://polyhaven.com/a/{aid}', 'maps': got})
        break
    else:
        log['errors'].append([t['as'], 'no id found', t['want']])
for h in ph.get('hdris', []):
    for aid in h['want']:
        fj = files(aid)
        if not fj or 'hdri' not in fj: continue
        node = fj['hdri'].get(h.get('res', RES))
        url = node['hdr']['url']
        try: save(f"hdri/{h['as']}.hdr", url)
        except Exception as e: log['errors'].append([aid, str(e)]); continue
        log['polyhaven'].append({'as': h['as'], 'id': aid, 'license': 'CC0', 'source': f'https://polyhaven.com/a/{aid}'}); break
for m in ph.get('models', []):
    for aid in m['want']:
        fj = files(aid)
        if not fj or 'gltf' not in fj: continue
        node = fj['gltf'].get(m.get('res', RES)) or next(iter(fj['gltf'].values()))
        g = node['gltf']
        try:
            save(f"models/{m['as']}/{m['as']}.gltf", g['url'])
            for rel, inc in g.get('include', {}).items(): save(f"models/{m['as']}/{rel}", inc['url'])
        except Exception as e: log['errors'].append([aid, str(e)]); continue
        log['polyhaven'].append({'as': m['as'], 'id': aid, 'license': 'CC0', 'source': f'https://polyhaven.com/a/{aid}', 'origname': os.path.basename(g['url'])}); break
    else:
        log['errors'].append([m['as'], 'no model found', m['want']])
for u in man.get('urls', []):
    try: n = save(u['path'], u['url']); log['urls'].append({**{k: v for k, v in u.items() if k != 'url'}, 'bytes': n})
    except Exception as e: log['errors'].append([u['path'], str(e)])
if man.get('catalog'):
    cat = {}
    for t in ['models', 'hdris']:
        try:
            j = json.loads(get(f'https://api.polyhaven.com/assets?t={t}'))
            cat[t] = {k: {'c': v.get('categories', []), 'tags': v.get('tags', [])[:8]} for k, v in j.items()}
        except Exception as e: log['errors'].append(['catalog', t, str(e)])
    json.dump(cat, open(os.path.join(A, 'polyhaven-catalog.json'), 'w'))
json.dump(log, open(os.path.join(A, 'fetch-log.json'), 'w'), indent=1)
print(json.dumps(log, indent=1))
