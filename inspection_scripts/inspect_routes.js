const https = require('https');

function inspectUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`=== URL: ${url} ===`);
        console.log(`Status: ${res.statusCode}`);
        const preloads = [...data.matchAll(/<link rel="modulepreload" href="([^"]+)"/g)].map(m => m[1]);
        console.log('Preloaded bundles:', preloads);
        
        // Find links
        const links = [...data.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
        console.log('Internal links:', [...new Set(links.filter(l => l.startsWith('/')))].slice(0, 10));
        
        // Extract TSR router manifest
        const tsrMatch = data.match(/\$_TSR\.router=([^;]+);/);
        if (tsrMatch) {
          console.log('TSR string length:', tsrMatch[1].length);
        }
        resolve();
      });
    }).on('error', err => {
      console.error(err);
      resolve();
    });
  });
}

(async () => {
  await inspectUrl('https://constructa-page.atumx.in/signup');
  await inspectUrl('https://constructa-page.atumx.in/dashboard');
  await inspectUrl('https://constructa-page.atumx.in/login');
})();
