with open('benchtwin_raw.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

import re
pos_home = html.find('id="bt-home"')
pos_load = html.find('id="bt-load"')
print("bt-home pos:", pos_home)
print("bt-load pos:", pos_load)

# Find buttons inside bt-home
if pos_home != -1 and pos_load != -1:
    home_html = html[pos_home:pos_load]
    btns = re.findall(r'<a[^>]+>|<button[^>]+>', home_html)
    print("Buttons and links in homepage:", len(btns))
    for b in btns[:20]:
        print(" ", b)
