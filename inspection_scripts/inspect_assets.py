import re

with open('app1.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

fetches = re.findall(r'fetch\([\'"`]([^\'"`]+)[\'"`]', js)
print("Fetches count:", len(fetches))
print("Sample fetches:", list(set(fetches))[:25])

asset_urls = re.findall(r'[\'"`](\/[a-zA-Z0-9_\-\.\/]+\.(?:json|glb|gltf|png|jpg|wasm|js|mp3|wav|bin|svg))[\'"`]', js)
print("Asset URLs count:", len(asset_urls))
print("Sample asset URLs:", list(set(asset_urls))[:35])

workers = re.findall(r'new Worker\([\'"`]([^\'"`]+)[\'"`]', js)
print("Workers:", set(workers))
