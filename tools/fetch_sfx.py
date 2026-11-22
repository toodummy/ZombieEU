"""Fetch CC0 sound packs (Kenney.nl — CC0 1.0) and convert the useful clips to small mono mp3s."""
import os, re, subprocess, urllib.request, zipfile, io, glob, shutil
os.makedirs('assets/sfx_cc0', exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 ZombieEU-builder'}
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120).read()
for page in ['https://kenney.nl/assets/impact-sounds', 'https://kenney.nl/assets/rpg-audio']:
    try:
        h = get(page).decode('utf8', 'ignore')
        links = re.findall(r'(https?://[^"\' ]+?\.zip|/media/[^"\' ]+?\.zip)', h)
        if not links:
            name0 = page.rsplit('/', 1)[1]
            for folder in set(re.findall(r'/media/pages/assets/' + name0 + r'/([^/]+)/', h)):
                for zn in [f'kenney_{name0}.zip', f'kenney_{name0.replace("-", "")}.zip', f'{name0}.zip']:
                    u = f'https://kenney.nl/media/pages/assets/{name0}/{folder}/{zn}'
                    try:
                        urllib.request.urlopen(urllib.request.Request(u, headers=UA, method='HEAD'), timeout=30); links = [u]; print('found', u, flush=True); break
                    except Exception as e: print('miss', u, e, flush=True)
                if links: break
        if not links:
            for m in re.finditer(r'(download|zip)', h, re.I):
                print('CTX', h[max(0, m.start()-160):m.start()+120].replace('\n', ' '), flush=True)
                break
        print(page, links[:3], flush=True)
        if not links: continue
        u = links[0] if links[0].startswith('http') else 'https://kenney.nl' + links[0]
        z = zipfile.ZipFile(io.BytesIO(get(u)))
        name = page.rsplit('/', 1)[1]
        z.extractall('/tmp/' + name); print('zip entries', len(z.namelist()), z.namelist()[:6], flush=True)
    except Exception as e: print('fail', page, e, flush=True)
allf = glob.glob('/tmp/impact-sounds/**/*', recursive=True) + glob.glob('/tmp/rpg-audio/**/*', recursive=True)
print('extracted', len(allf), allf[:12])
files = [f for f in allf if f.lower().endswith(('.ogg', '.wav', '.mp3'))]
print('ogg files', len(files))
keep = re.compile(r'(footstep_concrete|footstep_grass|footstep_wood|impactMetal_heavy|impactMetal_light|impactGlass|impactPlate|impactPunch|impactWood|impactTin|impactBell|metalClick|metalLatch|cloth|chop|knifeSlice|footstep0)', re.I)
n = 0
for f in files:
    b = os.path.splitext(os.path.basename(f))[0]
    if not keep.search(b): continue
    out = f'assets/sfx_cc0/{b}.mp3'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f, '-ac', '1', '-ar', '32000', '-b:a', '64k', out], check=True); n += 1
open('assets/sfx_cc0/LICENSE.txt', 'w').write('Sounds from Kenney.nl (Impact Sounds, RPG Audio) — CC0 1.0 Universal. https://kenney.nl\n')
print('converted', n)
