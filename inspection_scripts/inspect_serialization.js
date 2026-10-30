const fs = require('fs');

const code = fs.readFileSync('C:/Users/MOHD ASAD ALI/.gemini/antigravity-ide/scratch/constructa_investigation/workbench_main.js', 'utf8');

const idx = code.indexOf('version:"1.1"');
if (idx !== -1) {
  console.log('--- Found version: "1.1" ---');
  console.log(code.substring(Math.max(0, idx - 200), Math.min(code.length, idx + 800)));
}

// Find how an object is created or serialized
const idx2 = code.indexOf('"constructa:load-project"');
if (idx2 !== -1) {
  console.log('--- load-project listener ---');
  console.log(code.substring(idx2 - 100, idx2 + 600));
}

// Find object properties when saved:
const objProps = [...code.matchAll(/{\s*id:\s*([a-zA-Z0-9_\.]+),\s*type:\s*([a-zA-Z0-9_\.]+),\s*position:\s*([a-zA-Z0-9_\.]+)/g)].map(m => m[0]);
console.log('Object serialization shape matches:', objProps.length);
if (objProps.length > 0) {
  console.log('Sample:', objProps[0]);
}
