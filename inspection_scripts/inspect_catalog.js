const fs = require('fs');

const code = fs.readFileSync('C:/Users/MOHD ASAD ALI/.gemini/antigravity-ide/scratch/constructa_investigation/workbench_main.js', 'utf8');

// Find where categories [ 'controller', 'actuator', 'output', 'sensor' ] are defined
const idx = code.indexOf('category:"controller"');
if (idx !== -1) {
  console.log('--- Found category controller ---');
  console.log(code.substring(Math.max(0, idx - 400), Math.min(code.length, idx + 1200)));
}

// Search for all objects with category:
const catItems = [...code.matchAll(/{\s*([^}]+category:\s*["'][^"']+["'][^}]*)}/g)].map(m => m[0]);
console.log('Total catalog items found with category:', catItems.length);
catItems.forEach((item, i) => {
  const nameMatch = item.match(/name:\s*["']([^"']+)["']/);
  const typeMatch = item.match(/type:\s*["']([^"']+)["']/);
  const catMatch = item.match(/category:\s*["']([^"']+)["']/);
  console.log(`${i+1}. [${catMatch ? catMatch[1] : '?'}] ${nameMatch ? nameMatch[1] : '?'} (type: ${typeMatch ? typeMatch[1] : '?'})`);
});
