"""Download open-licensed rigged creatures/characters for the infected roster.
- Quaternius "Ultimate Animated Animals" (CC0 1.0) — mirrored in public repos
- Khronos glTF-Sample-Assets Fox (CC-BY 4.0: PixelMannen / tomkranis / AsoboStudio & scurest)
- three.js example characters Michelle.glb, Soldier.glb (Mixamo characters bundled with three.js examples)"""
import os, json, urllib.request, urllib.parse
UA = {'User-Agent': 'ZombieEU-builder'}
os.makedirs('assets/creatures', exist_ok=True)
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120).read()
def save(u, name):
    try:
        d = get(u); open('assets/creatures/' + name, 'wb').write(d); print('ok', name, len(d), flush=True); return True
    except Exception as e: print('fail', name, u, e, flush=True); return False
save('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb', 'fox.glb')
save('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Michelle.glb', 'michelle.glb')
save('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb', 'soldier.glb')
want = ['Husky', 'ShibaInu', 'Wolf']
for repo, path in [('laoniutoushx/TD-demo-2024-04-03', 'Asserts/Models/ulitimate animals/glTF'), ('NazarMuhammadFF/otaklalat-ke-npc', 'assets/models/animals'), ('xxfrigorizxx/The-Legacy-Of-Seroka', '_tmp_quaternius_animals/glTF'), ('pashaydev/Metamorph', 'assets/models/characters/forms/glTF')]:
    try:
        lst = json.loads(get('https://api.github.com/repos/%s/contents/%s' % (repo, urllib.parse.quote(path))))
    except Exception as e: print('list fail', repo, e); continue
    names = {f['name']: f['download_url'] for f in lst if f.get('download_url')}
    print(repo, sorted(names)[:40], flush=True)
    for w in list(want):
        for ext in ['.glb', '.gltf']:
            if w + ext in names:
                okk = save(names[w + ext], w.lower() + ext)
                if ext == '.gltf' and okk:
                    g = json.load(open('assets/creatures/' + w.lower() + '.gltf'))
                    for b in g.get('buffers', []):
                        u = b.get('uri', '')
                        if u and not u.startswith('data:'):
                            base = names[w + ext].rsplit('/', 1)[0]; save(base + '/' + urllib.parse.quote(u), u)
                    for im in g.get('images', []):
                        u = im.get('uri', '')
                        if u and not u.startswith('data:'):
                            base = names[w + ext].rsplit('/', 1)[0]; save(base + '/' + urllib.parse.quote(u), u)
                if okk: want.remove(w); break
    if not want: break
open('assets/creatures/LICENSES.txt', 'w').write("""husky/shibainu/wolf: Quaternius, Ultimate Animated Animals — CC0 1.0 (quaternius.com)
fox.glb: Khronos glTF-Sample-Assets 'Fox' — CC-BY 4.0: model by PixelMannen, rigging/animation by @tomkranis, glTF conversion by @AsoboStudio and @scurest
michelle.glb, soldier.glb: three.js examples (characters from Mixamo / Adobe)
""")
