import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const brandPath = path.join(root, 'public', 'brand.json')
const evidencePath = path.join(root, 'public', 'evidence.json')
const outDir = path.join(root, 'public', 'blog-library')

function loadJson(p) {
	try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return null }
}

function sanitize(text) {
	return text.replace(/\b(AGI|miracle|consciousness|proprietary algorithm)\b/gi, '').replace(/\s{2,}/g,' ').trim()
}

function ensureOutDir() {
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
}

function toSlug(title) {
	return title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
}

function buildArticle({ title, excerpt, sections }) {
	const h = [
		`<h2>${sections[0].heading}</h2>\n<p>${sections[0].body}</p>`,
		`<h2>${sections[1].heading}</h2>\n<p>${sections[1].body}</p>`,
		`<h2>${sections[2].heading}</h2>\n<p>${sections[2].body}</p>`
	].join('\n\n')
	return {
		title: sanitize(title),
		excerpt: sanitize(excerpt),
		contentHtml: h + `\n\n<p>Learn more: <a href="/ai">/ai</a> · <a href="/whitepaper">/whitepaper</a></p>`
	}
}

function createDrafts(brand, evidence) {
	const topics = [
		{
			title: 'Evidence‑Led Synthetic Data: How We Validate at Scale',
			excerpt: 'A practical walk‑through of our validation steps and why they matter for regulated buyers.',
			sections: [
				{ heading: 'Why Evidence Matters', body: 'Evidence builds trust, speeds procurement, and reduces risk. We publish claims with hashes and verifiable references.' },
				{ heading: 'Our Process', body: 'From schema design and ablations to bundle creation, each step has guardrails and metrics tied to outcomes.' },
				{ heading: 'How to Reproduce', body: 'Use our datasets and scripts to reproduce key metrics; contact us for evaluation packs.' }
			]
		},
		{
			title: 'Scheduling Social Posts and Blogs: A Practical Setup',
			excerpt: 'We automated B2B posting and blog scheduling without paid APIs. Here’s our setup.',
			sections: [
				{ heading: 'Architecture', body: 'Queue tables in Supabase, Netlify Functions for enqueue/publish, and UI presets for UK/US windows.' },
				{ heading: 'Guardrails', body: 'Sanitizers, tone checks, and manual library review keep quality high and IP safe.' },
				{ heading: 'Next Steps', body: 'Add analytics, org posting, and assisted generation from internal docs and change logs.' }
			]
		}
	]
	return topics.map(t => ({ ...t, slug: toSlug(t.title) }))
}

function main() {
	ensureOutDir()
	const brand = loadJson(brandPath)
	const evidence = loadJson(evidencePath)
	const drafts = createDrafts(brand, evidence)
	const manifest = []
	for (const d of drafts) {
		const file = path.join(outDir, `${d.slug}.json`)
		const article = buildArticle(d)
		const payload = { slug: d.slug, ...article, tags: [] , createdAt: new Date().toISOString() }
		fs.writeFileSync(file, JSON.stringify(payload, null, 2))
		console.log('Wrote', file)
		manifest.push({ slug: d.slug, title: payload.title })
	}
	fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
}

main()


