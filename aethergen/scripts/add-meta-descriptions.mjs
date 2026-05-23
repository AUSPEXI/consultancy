import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'public');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function inferDescription(html, url) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim().slice(0, 150);
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1) return h1[1].trim().slice(0, 150);
  return `Page on Auspexi: ${url}`.slice(0, 150);
}

const files = walk(root).filter(p => !p.includes('/blog-html/'));
let updated = 0;
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const hasDesc = /<meta\s+name=["']description["']/i.test(html);
  if (!hasDesc) {
    const rel = path.relative(root, file).replace(/\\/g, '/');
    let url = 'https://auspexi.com/' + rel.replace(/index\.html$/,'').replace(/\.html$/,'');
    if (url.endsWith('/')) url = url.slice(0, -1);
    const desc = inferDescription(html, url);
    const tag = `\n<meta name="description" content="${desc}">`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${tag}\n</head>`);
      fs.writeFileSync(file, html);
      updated++;
      console.log('Added description:', file);
    }
  }
}

console.log(`Descriptions added to ${updated} file(s).`);





