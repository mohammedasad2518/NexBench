import urllib.request
import os

imgs = [
    'img/1f60467ded32.webp',
    'img/2253b849bf1f.webp',
    'img/87e90d9fc390.webp',
    'img/8b38f0ad1e44.webp',
    'img/410d19059502.webp',
    'img/33afa00690a7.webp',
    'img/0fe0f4aa3289.webp',
    'img/28fef8fe7474.webp',
    'img/9f8b30db45c3.webp',
    'favicon.ico',
    'favicon.svg',
    'icon-192.png',
    'icon-512.png',
    'apple-touch-icon.png',
    'site.webmanifest'
]

os.makedirs('assets_dl/img', exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0'}
for item in imgs:
    url = f'https://benchtwin.com/{item}'
    dest = os.path.join('assets_dl', item)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp, open(dest, 'wb') as out:
            out.write(resp.read())
        print(f"Downloaded: {item} ({os.path.getsize(dest)} bytes)")
    except Exception as e:
        print(f"Failed {item}: {e}")
