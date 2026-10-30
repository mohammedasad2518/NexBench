const fs = require('fs');

const code = fs.readFileSync('C:/Users/MOHD ASAD ALI/.gemini/antigravity-ide/scratch/constructa_investigation/workbench_main.js', 'utf8');

// Search for component definitions or objects array
// Usually components have names, categories, types, or 3D models
const typeMatches = [...code.matchAll(/type:\s*["']([a-zA-Z0-9_\-]+)["']/g)].map(m => m[1]);
console.log('Unique types in code:', [...new Set(typeMatches)].filter(t => 
  ['servo', 'motor', 'board', 'sensor', 'led', 'chassis', 'wheel', 'battery', 'subo', 'arduino', 'esp32'].some(k => t.toLowerCase().includes(k))
));

// Search for component definitions
const partRegex = /{\s*(?:id|type|name):\s*["'][^"']+["'][^}]+(?:servo|motor|sensor|oled|subo|wheel|ultrasonic|chassis)[^}]+}/gi;
const sampleParts = [...code.matchAll(partRegex)].map(m => m[0]);
console.log('Sample part definitions count:', sampleParts.length);
if (sampleParts.length > 0) {
  console.log('Sample 1:', sampleParts[0].substring(0, 300));
}

// Search for parts catalog or toolbox
const catalogMatches = [...code.matchAll(/category:\s*["']([^"']+)["']/g)].map(m => m[1]);
console.log('Categories:', [...new Set(catalogMatches)]);
