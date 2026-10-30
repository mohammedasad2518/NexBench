const https = require('https');

https.get('https://constructa.atumx.in/', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Length:', data.length);
    const titleMatch = data.match(/<title>([^<]+)<\/title>/);
    console.log('Title:', titleMatch ? titleMatch[1] : null);
    const scripts = [...data.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/g)].map(m => m[1]);
    console.log('Scripts:', scripts.slice(0, 10));
    const modules = [...data.matchAll(/<link rel="modulepreload" href="([^"]+)"/g)].map(m => m[1]);
    console.log('Module preloads:', modules.slice(0, 10));
  });
}).on('error', err => {
  console.error('Error fetching editor:', err.message);
});
