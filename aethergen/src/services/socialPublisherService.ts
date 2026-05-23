type DraftInput = {
	title: string
	url: string
	keyPoints?: string[]
	cta?: string
	seoKeywords?: string[]
	techLens?: string
	contextSnippets?: Array<{ title: string; summary?: string; url?: string; tags?: string[] }>
}

type DraftOutput = {
	headline: string
	body: string
	hashtags: string
	shareUrl: string
}

// Simple sanitizer to avoid disclosing IP: strips sensitive terms and hype
function sanitize(text: string): string {
	const banned = [
		'proprietary algorithm', 'source code', 'trade secret', 'miracle', 'consciousness', 'AGI',
	]
	let out = text
	for (const b of banned) {
		const re = new RegExp(b, 'ig')
		out = out.replace(re, '')
	}
	return out.replace(/\s{2,}/g, ' ').trim()
}

export function generateLinkedInDraft(input: DraftInput): DraftOutput {
	const title = sanitize(input.title)
	const url = input.url
	const cta = sanitize(input.cta || 'Read the guide and get in touch.')
	const lens = sanitize(input.techLens || '')

	// Key points: use provided ones; if empty, infer sensible defaults from title/keywords
	let pointsArr = (input.keyPoints || []).map(p => sanitize(p)).filter(Boolean)
	const kwRaw = (input.seoKeywords || []).map(k => (k || '').toString().toLowerCase().trim()).filter(Boolean)
	const titleLc = title.toLowerCase()
	if (pointsArr.length === 0) {
		if (titleLc.includes('evidence') || titleLc.includes('regulated') || kwRaw.includes('evidence-led')) {
			pointsArr = [
				'Provenance + privacy + utility in a signed bundle',
				'Gates for procurement/compliance, not opinions',
				'Ablation sensitivity shows what actually drives lift',
			]
		} else {
			pointsArr = [
				'Clear outcomes and limits up‑front',
				'Zero sensitive data disclosed',
				'Metrics you can verify and reuse',
			]
		}
	}
	const points = pointsArr.slice(0, 3).map(p => `• ${p}`)

	// Drop context lines to avoid repetition/noise in Publisher preview for now
	const ctxLines: string[] = []

	// Hashtags: only from current input keywords; sanitize, dedupe, keep 3
	const dedupe = new Set<string>()
	const tagList = (kwRaw.length ? kwRaw : ['synthetic data','privacy'])
		.slice(0, 6)
		.map(k => '#' + k.replace(/\s+/g,'').replace(/[^a-z0-9_#]/g,''))
		.filter(t => { if (dedupe.has(t)) return false; dedupe.add(t); return true })
		.slice(0, 3)
	const hashtags = ['#AethergenPlatform', ...tagList].join(' ')

	// Headline: use the post title directly (avoid repetitive suffixes)
	const headline = title
	const body = [
		lens ? `Perspective: ${lens}` : 'Key points:',
		...points,
		...(ctxLines.length ? ['Context:', ...ctxLines] : []),
		'',
		cta,
		url,
	].join('\n')
	const shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
	return { headline, body, hashtags, shareUrl }
}

export function generateReplyDraft(opts: { targetTitle?: string, targetUrl: string, angle?: 'appreciation'|'insight'|'question', points?: string[] }) {
	const angle = opts.angle || 'insight'
	const pts = (opts.points || []).slice(0, 2).map(p=> sanitize(p))
	const blocks: Record<string, string> = {
		appreciation: `Appreciate this share — practical and relevant. ${pts.join(' · ')}`,
		insight: `Useful perspective. Adding a small observation: ${pts.join(' · ')}`,
		question: `Interesting take — curious how you see this in regulated settings? ${pts.join(' · ')}`,
	}
	const text = blocks[angle]
	return {
		comment: text,
		openUrl: opts.targetUrl,
	}
}


