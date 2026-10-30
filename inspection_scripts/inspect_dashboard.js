const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/MOHD ASAD ALI/.gemini/antigravity-ide/scratch/constructa_investigation';

const dash = fs.readFileSync(path.join(dir, 'dashboard-C7pBzHmp.js'), 'utf8');
const work = fs.readFileSync(path.join(dir, 'workspace-D9cYYYvc.js'), 'utf8');

console.log('=== workspace-D9cYYYvc.js ===');
console.log(work);

console.log('=== dashboard queries/tables ===');
const tables = [...dash.matchAll(/\.from\(['"`]([a-zA-Z0-9_\-]+)['"`]\)/g)].map(m => m[1]);
console.log('Tables referenced in dashboard:', [...new Set(tables)]);

const rpc = [...dash.matchAll(/\.rpc\(['"`]([a-zA-Z0-9_\-]+)['"`]\)/g)].map(m => m[1]);
console.log('RPC calls in dashboard:', [...new Set(rpc)]);

const urls = [...dash.matchAll(/https?:\/\/[a-zA-Z0-9\.\-_:\/]+/g)].map(m => m[0]);
console.log('External URLs in dashboard:', [...new Set(urls)]);
