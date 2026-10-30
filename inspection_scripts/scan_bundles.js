const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/MOHD ASAD ALI/.gemini/antigravity-ide/scratch/constructa_investigation';

const files = fs.readdirSync(dir);
for (const f of files) {
  if (!f.endsWith('.js')) continue;
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  console.log(`=== File: ${f} (${content.length} chars) ===`);

  // URLs
  const urls = content.match(/https?:\/\/[a-zA-Z0-9\.\-_:\/]+/g) || [];
  const uniqueUrls = [...new Set(urls)].filter(u => !u.includes('w3.org') && !u.includes('reactjs.org'));
  console.log('URLs:', uniqueUrls.slice(0, 20));

  // Find occurrences of /api/ or fetch or endpoints
  const apiMatches = content.match(/['"`](\/api\/[^'"`]+|https?:\/\/[^'"`]+)['"`]/g) || [];
  const uniqueApis = [...new Set(apiMatches)];
  if (uniqueApis.length > 0) {
    console.log('API / string paths:', uniqueApis.slice(0, 20));
  }
}
