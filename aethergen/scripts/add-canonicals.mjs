import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'public');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function toUrl(filePath) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  let url = 'https://auspexi.com/' + rel.replace(/index\.html$/,'').replace(/\.html$/,'');
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (!url.startsWith('https://auspexi.com')) url = 'https://auspexi.com/' + url;
  return url;
}

const files = walk(root).filter(p => !p.includes('/blog-html/'));

let updated = 0;
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  if (!hasCanonical) {
    const url = toUrl(file);
    const link = `\n<link rel="canonical" href="${url}">`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${link}\n</head>`);
      fs.writeFileSync(file, html);
      updated++;
      console.log('Added canonical:', url);
    }
  }
}

console.log(`Canonicals added to ${updated} file(s).`);





