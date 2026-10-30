with open('app1.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

pos = js.find('window.__btOfficial=!1')
print(js[pos:pos+400])
