#!/usr/bin/env node
const http = require('http');

function fetchLocal(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: 8888, path, method: 'GET' }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    const res = await fetchLocal('/api/pricing');
    if (res.status !== 200) throw new Error(`Unexpected status ${res.status}`);
    if (!/application\/json/.test(res.headers['content-type'] || '')) throw new Error('Missing JSON content-type');
    if (!res.headers['cache-control']) throw new Error('Missing cache-control');
    if (!res.headers['etag']) throw new Error('Missing etag');
    const json = JSON.parse(res.body);
    if (!json.platform || !json.datasets || !json.models) throw new Error('Missing expected keys');
    console.log('OK /api/pricing headers and shape valid');
    process.exit(0);
  } catch (e) {
    console.error('FAIL', e.message);
    process.exit(1);
  }
})();



