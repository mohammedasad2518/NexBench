const https = require('https');
const fs = require('fs');

const outPath = 'C:/Users/MOHD ASAD ALI/.gemini/antigravity-ide/scratch/constructa_investigation/workbench_main.js';

https.get('https://constructa.atumx.in/assets/main-DJiT5BSo.js', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Content-Length:', res.headers['content-length']);
  if (res.statusCode !== 200) {
    console.error('Non-200 response');
    process.exit(1);
  }
  const stream = fs.createWriteStream(outPath);
  res.pipe(stream);
  stream.on('finish', () => {
    stream.close();
    console.log('Success. File size:', fs.statSync(outPath).size);
  });
}).on('error', (err) => {
  console.error('Request error:', err);
});
