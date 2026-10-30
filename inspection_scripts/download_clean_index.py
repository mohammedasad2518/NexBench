import urllib.request

url = 'https://benchtwin.com/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = resp.read()

print("True index.html size:", len(data))
with open('index_clean.html', 'wb') as f:
    f.write(data)

# Verify valid UTF-8
text = data.decode('utf-8')
print("Successfully decoded index_clean.html as UTF-8!")
