with open('app1.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

target = 'window.__btOfficial=!1'
pos = js.find(target)
print("pos:", pos)
if pos != -1:
    print(js[pos-100:pos+150])
