const fs = require('fs');

const code = fs.readFileSync('C:/Users/MOHD ASAD ALI/.gemini/antigravity-ide/scratch/constructa_investigation/workbench_main.js', 'utf8');

console.log('=== WORKBENCH CODE ANALYSIS ===');
console.log('Total characters:', code.length);

// 1. Dynamic imports
const dynamicImports = [...code.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)].map(m => m[1]);
console.log('\n--- 1. Dynamic Imports ---');
console.log([...new Set(dynamicImports)]);

// 2. Auth & Session handling
console.log('\n--- 2. Auth / Access Handling ---');
const csIndex = code.indexOf('#cs=');
if (csIndex !== -1) {
  console.log('Found #cs= token reader:');
  console.log(code.substring(Math.max(0, csIndex - 300), Math.min(code.length, csIndex + 500)));
} else {
  const csIndex2 = code.indexOf('cs=');
  console.log('cs= occurrences:', csIndex2 !== -1 ? code.substring(csIndex2 - 100, csIndex2 + 200) : 'none');
}

// Check how project is loaded from URL (?project=...)
const projIndex = code.indexOf('project');
const urlParamMatches = [...code.matchAll(/get\(['"`](project|app|ro|highlight)['"`]\)/g)].map(m => m[1]);
console.log('URL search params checked:', [...new Set(urlParamMatches)]);

// 3. Hardware Components
console.log('\n--- 3. Hardware Components & Parts Catalog ---');
const components = [...code.matchAll(/["'](servo|motor|sensor|ultrasonic|oled|led|wheel|chassis|subo|arduino|esp32|battery|switch|buzzer|camera|gripper|ir|potentiometer)["']/gi)].map(m => m[1].toLowerCase());
console.log('Hardware keyword frequencies:', components.reduce((acc, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {}));

// Search for component definitions or catalogs
const partMatches = [...code.matchAll(/id:\s*["']([a-zA-Z0-9_\-]+)["'],\s*name:\s*["']([^"']+)["']/g)].map(m => `${m[1]} (${m[2]})`);
console.log('Component catalog items (sample):', partMatches.slice(0, 25));
