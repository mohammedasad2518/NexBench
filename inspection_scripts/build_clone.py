import os
import shutil
import re

TARGET_DIR = r"C:\Users\MOHD ASAD ALI\.gemini\antigravity-ide\scratch\benchtwin-clone"
os.makedirs(os.path.join(TARGET_DIR, "js"), exist_ok=True)
os.makedirs(os.path.join(TARGET_DIR, "img"), exist_ok=True)

print("1. Copying static images and icons...")
for f in os.listdir("assets_dl/img"):
    src = os.path.join("assets_dl/img", f)
    dst = os.path.join(TARGET_DIR, "img", f)
    shutil.copy2(src, dst)

for f in ["favicon.ico", "favicon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "site.webmanifest"]:
    src = os.path.join("assets_dl", f)
    if os.path.exists(src):
        dst = os.path.join(TARGET_DIR, f)
        shutil.copy2(src, dst)

print("2. Copying library scripts to js/...")
for f in os.listdir("assets_dl/js"):
    src = os.path.join("assets_dl/js", f)
    dst = os.path.join(TARGET_DIR, "js", f)
    shutil.copy2(src, dst)

print("3. Preparing and patching app1.js...")
with open("app1.js", "r", encoding="utf-8", errors="ignore") as f:
    js_content = f.read()

# Replace unofficial warning banner logic so it always returns cleanly and runs anywhere
# Specifically: window.__btOfficial=!1 -> window.__btOfficial=!0;return
js_patched = js_content.replace("window.__btOfficial=!1", "window.__btOfficial=!0;return")

# Replace CDN scripts with local fallbacks if needed
js_patched = js_patched.replace("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", "./js/three.min.js")
js_patched = js_patched.replace("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/GLTFExporter.js", "./js/GLTFExporter.js")
js_patched = js_patched.replace("https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js", "./js/model-viewer.min.js")
js_patched = js_patched.replace("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js", "./js/supabase.min.js")

with open(os.path.join(TARGET_DIR, "js", "app1.js"), "w", encoding="utf-8") as f:
    f.write(js_patched)
print("Saved patched app1.js, size:", os.path.getsize(os.path.join(TARGET_DIR, "js", "app1.js")))

print("4. Preparing and patching index.html...")
with open("benchtwin_raw.html", "r", encoding="utf-8", errors="ignore") as f:
    html = f.read()

# Remove Netlify RUM tracking script
html = re.sub(r'<script async id="netlify-rum-container"[\s\S]*?</script>', '', html)

# Replace script 2 (the domain / right-click restriction script) with an open version
# Locate the block with __btOfficial
script_search = re.search(r'<script>/\* 2\.43\s+BenchTwin[\s\S]*?</script>', html)
if script_search:
    clean_script = """<script>
/* BenchTwin Official & Developer Mode Enabled */
(function(){
  window.__btOfficial = true;
  console.log('%cBenchTwin Clone Running Successfully', 'font:700 20px system-ui;color:#0e7c86');
})();
</script>"""
    html = html[:script_search.start()] + clean_script + html[script_search.end():]
    print("Replaced restriction script.")
else:
    print("Warning: restriction script pattern not directly matched; checking alternate")

# Update script src references in html
html = html.replace('src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"', 'src="./js/three.min.js"')
html = html.replace('src="js/app1.d7c822a03b.js"', 'src="./js/app1.js"')

with open(os.path.join(TARGET_DIR, "index.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("Saved index.html, size:", os.path.getsize(os.path.join(TARGET_DIR, "index.html")))

print("Done assembling benchtwin-clone!")
