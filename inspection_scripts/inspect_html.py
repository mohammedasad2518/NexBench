import re

with open('benchtwin_raw.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

links = re.findall(r'<link[^>]+>', html)
print("Link tags:")
for l in links:
    print(" ", l)

img_srcs = re.findall(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', html)
print("\nImages in HTML:", len(img_srcs))
for img in set(img_srcs):
    print(" ", img)

scripts = re.findall(r'<script[^>]*src=[\'"]([^\'"]+)[\'"]', html)
print("\nExternal scripts:")
for s in scripts:
    print(" ", s)
