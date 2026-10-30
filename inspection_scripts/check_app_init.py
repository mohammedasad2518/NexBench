with open('app1.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

print("Length of app1.js:", len(js))
print("First 200 chars:", js[:200])
print("Last 300 chars:", js[-300:])
