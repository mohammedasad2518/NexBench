with open('app1_test.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re
matches = re.findall(r'.{0,50}CATALOG.{0,50}', js)
print("CATALOG matches:", len(matches))
for m in matches[:10]:
    print(" -", m.strip())

# Search for drag / click on library
lib_matches = re.findall(r'(\.addEventListener\([\'"](?:dragstart|pointerdown|click)[\'"][^\)]+\))', js)
print("\nEvent listeners count:", len(lib_matches))
for l in lib_matches[:10]:
    print(" -", l[:80])
