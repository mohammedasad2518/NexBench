with open('app1.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

import re
matches = re.findall(r'app1\.[a-f0-9]+\.js', js)
print("app1 hash references in js:", matches)
