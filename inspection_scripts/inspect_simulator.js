const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/MOHD ASAD ALI/.gemini/antigravity-ide/scratch/constructa_investigation';

const main = fs.readFileSync(path.join(dir, 'workbench_main.js'), 'utf8');
const espPanel = fs.readFileSync(path.join(dir, 'Esp32Panel-Bvcp_a6f.js'), 'utf8');
const blocks = fs.readFileSync(path.join(dir, 'BlocksPanel-Dvhl8DcA.js'), 'utf8');

console.log('=== ARDUINO SIMULATOR INSPECTION ===');

// Check for Arduino/ESP32 interpreter/simulator keywords:
// setup, loop, digitalWrite, analogWrite, pinMode, pulseIn, millis, delay, eval, Function
const simRegex = /(?:digitalWrite|analogWrite|pinMode|pulseIn|delay|millis|Serial\.print)\b/g;
console.log('Simulator API matches in main:', (main.match(simRegex) || []).length);
console.log('Simulator API matches in Esp32Panel:', (espPanel.match(simRegex) || []).length);
console.log('Simulator API matches in BlocksPanel:', (blocks.match(simRegex) || []).length);

// Look for transpile or interpreter functions
const transpileMatches = [...main.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{[^}]*(?:setup|loop|transpile|eval|interpreter)[^}]*\}/gi)].map(m => m[0]);
console.log('Transpiler / interpreter function matches:', transpileMatches.length);

// Search for 'eval' in workbench_main
let evalIdx = 0;
while ((evalIdx = main.indexOf('eval(', evalIdx)) !== -1) {
  console.log('--- eval( call found in main ---');
  console.log(main.substring(Math.max(0, evalIdx - 150), Math.min(main.length, evalIdx + 300)));
  evalIdx += 5;
}

// Search for 'new Function' in workbench_main
let fnIdx = 0;
while ((fnIdx = main.indexOf('new Function(', fnIdx)) !== -1) {
  console.log('--- new Function call found in main ---');
  console.log(main.substring(Math.max(0, fnIdx - 150), Math.min(main.length, fnIdx + 300)));
  fnIdx += 13;
}
