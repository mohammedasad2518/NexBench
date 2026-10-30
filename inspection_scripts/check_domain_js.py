import re

with open('app1.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

# Let's find the exact bt-unoff code
pattern = r'if\(location\.protocol==="file:"\|\|!P\|\|x\.some\([^\)]+\)\)return;'
m = re.search(pattern, js)
if m:
    print("Found domain check in app1.js at", m.start(), ":", m.group(0))
    snippet = js[m.start()-50:m.end()+150]
    print("Snippet:", snippet)
else:
    print("Pattern not found, searching bt-unoff:")
    pos = js.find('bt-unoff')
    print(js[max(0, pos-100):min(len(js), pos+150)])
