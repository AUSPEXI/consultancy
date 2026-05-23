import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const sitemapPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
const xml = fs.readFileSync(sitemapPath, 'utf8');
const dom = new JSDOM(xml, { contentType: 'text/xml' });
const urls = [...dom.window.document.querySelectorAll('urlset > url')];
const rows = urls.map(u => {
  const loc = u.querySelector('loc')?.textContent?.trim() || '';
  const lastmod = u.querySelector('lastmod')?.textContent?.trim() || '';
  return { loc, lastmod };
});

const out = ['loc,lastmod'].concat(rows.map(r => `${r.loc},${r.lastmod}`)).join('\n');
const outPath = path.resolve(process.cwd(), 'public', 'sitemap_coverage.csv');
fs.writeFileSync(outPath, out);
console.log('Wrote CSV:', outPath);





