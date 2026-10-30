import urllib.request
import os

files = {
    "assets_dl/js/GLTFExporter.js": "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/GLTFExporter.js",
    "assets_dl/js/model-viewer.min.js": "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js",
    "assets_dl/js/supabase.min.js": "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"
}

headers = {'User-Agent': 'Mozilla/5.0'}
for path, url in files.items():
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp, open(path, "wb") as f:
            f.write(resp.read())
        print(f"Downloaded {path}: {os.path.getsize(path)} bytes")
    except Exception as e:
        print(f"Failed {path}: {e}")
