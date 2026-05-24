import fs from 'node:fs'
import path from 'node:path'

const BLOG_DIR = 'public/blog-html'
const REF_FILE = path.join(BLOG_DIR, 'green-ai-carbon-neutral-machine-learning.html')

function readFile(p){ return fs.readFileSync(p,'utf8') }
function writeFile(p,s){ fs.writeFileSync(p,s,'utf8') }

function extractBetween(s, start, end){
  const i = s.indexOf(start)
  if (i === -1) return ''
  const j = s.indexOf(end, i + start.length)
  if (j === -1) return ''
  return s.slice(i + start.length, j)
}

function getTitle(html){
  const m = html.match(/<title>([\s\S]*?)<\/title>/i)
  if (m) return m[1].trim()
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1) return h1[1].replace(/<[^>]+>/g,'').trim()
  return 'Article'
}

function getBody(html){
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const inner = m ? m[1] : html
  // strip any <style> blocks inside body
  return inner.replace(/<style[\s\S]*?<\/style>/gi,'').trim()
}

function buildDoc(title, styleCss, bodyInner){
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
${styleCss}
  </style>
  </head>
<body>
  <div class="article">
${bodyInner}
  </div>
</body>
</html>
`
}

function main(){
  const args = process.argv.slice(2)
  const only = args.find(a => a.startsWith('--files='))?.split('=')[1]?.split(',').map(s=>s.trim()).filter(Boolean)

  const refHtml = readFile(REF_FILE)
  const refStyle = extractBetween(refHtml, '<style>', '</style>') || ''
  if (!refStyle) throw new Error('Failed to extract reference style from ' + REF_FILE)

  const targets = only && only.length ? only.map(f=> path.isAbsolute(f) ? f : path.join(BLOG_DIR, path.basename(f))) :
    fs.readdirSync(BLOG_DIR).filter(f=>f.endsWith('.html')).map(f=> path.join(BLOG_DIR, f))

  for (const file of targets){
    const html = readFile(file)
    const title = getTitle(html)
    const bodyInner = getBody(html)
    const doc = buildDoc(title, refStyle, bodyInner)
    try { fs.writeFileSync(file + '.bak', html, 'utf8') } catch {}
    writeFile(file, doc)
    console.log('Normalized', file)
  }
}

main()


