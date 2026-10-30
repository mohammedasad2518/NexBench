with open('app1_test.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re
matches = re.findall(r'.{0,40}tile.{0,40}', js)
print("Matches with tile in js:", len(matches))
for m in matches[:15]:
    print(" -", m.strip())
