import urllib.request
import os

url = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
os.makedirs("assets_dl/js", exist_ok=True)
dest = "assets_dl/js/three.min.js"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp, open(dest, "wb") as f:
    f.write(resp.read())

print("Downloaded three.min.js, size:", os.path.getsize(dest))
