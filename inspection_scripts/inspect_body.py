import re

with open('benchtwin_raw.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# find body contents
body_match = re.search(r'<body[^>]*>([\s\S]*)</body>', html)
if body_match:
    body = body_match.group(1)
    print("Body length:", len(body))
    # Find direct top level sections / divs
    tags = re.findall(r'<([a-zA-Z0-9]+)\s+id=[\'"]([^\'"]+)[\'"]', body)
    print("Top IDs with tags:", len(tags))
    for t, i in tags[:40]:
        print(f"  <{t} id=\"{i}\">")
