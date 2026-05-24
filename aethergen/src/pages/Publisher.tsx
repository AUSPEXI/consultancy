import React, { useEffect, useMemo, useState } from 'react'
import SEO from '../components/SEO'
import { generateLinkedInDraft, generateReplyDraft } from '../services/socialPublisherService'

const Publisher: React.FC = () => {
	const [title, setTitle] = useState('')
	const [url, setUrl] = useState('')
	const [keyPoints, setKeyPoints] = useState('')
	const [cta, setCta] = useState('Read the guide and get in touch.')
	const [keywords, setKeywords] = useState('')
	const [scheduledAt, setScheduledAt] = useState<string>('')
  const [library, setLibrary] = useState<any[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [replyUrl, setReplyUrl] = useState('')
  const [replyAngle, setReplyAngle] = useState<'appreciation'|'insight'|'question'>('insight')
  const [replyPoints, setReplyPoints] = useState('')
  const [techLens, setTechLens] = useState('')
  const [siteContext, setSiteContext] = useState<Array<{ title: string; summary?: string; url?: string; tags?: string[]; contextOnly?: boolean }>>([])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/blog-library/manifest.json')
        if (res.ok) {
          const js = await res.json()
          setLibrary(Array.isArray(js) ? js : (js.posts || []))
        }
      } catch {}
    })()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/.netlify/functions/site-context')
        if (res.ok) {
          const js = await res.json()
          const pages = Array.isArray(js) ? js : (js.pages || [])
          setSiteContext(pages)
        }
      } catch {}
    })()
  }, [])

	const draft = useMemo(() => generateLinkedInDraft({
		title,
		url,
		keyPoints: keyPoints.split(';').map(s=>s.trim()).filter(Boolean),
		cta,
		seoKeywords: keywords.split(',').map(s=>s.trim()).filter(Boolean),
		techLens,
		contextSnippets: siteContext.slice(0, 6).map((p: any) => ({ title: p.title, summary: p.summary, url: p.url, tags: p.tags })),
	}), [title, url, keyPoints, cta, keywords, techLens, siteContext])

	return (
		<div className="min-h-screen bg-white">
			<SEO
				title="Publisher – Social Drafts"
				description="Generate safe, evidence-led social posts directly from site content."
				canonical="https://auspexi.com/publisher"
				jsonLd={{ '@context':'https://schema.org', '@type':'CreativeWork', name:'Publisher' }}
			/>
			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<h1 className="text-3xl font-bold text-slate-900 mb-6">Publisher</h1>
				<p className="text-slate-800 mb-6">Create LinkedIn drafts from your pages while protecting IP and tone.</p>
				<div className="space-y-4">
					<div className="flex gap-2 items-center">
						<select className="border rounded px-3 py-2 text-slate-900 bg-white" value={selectedSlug} onChange={e=>{
							const slug = e.target.value; setSelectedSlug(slug)
							const found = library.find(x=>x.slug===slug)
							if (found) {
								setTitle(found.title)
								setUrl(`https://auspexi.com/blog/${found.slug}`)
								// Reset draft inputs to avoid cross‑post carryover
								setKeyPoints('')
								setCta('Read the guide and get in touch.')
								setKeywords(Array.isArray((found as any).tags) ? (found as any).tags.join(', ') : '')
								setTechLens('')
							}
						}}>
							<option value="">Pick draft from library…</option>
							{library.map(item=> (
								<option key={item.slug} value={item.slug}>{item.title}</option>
							))}
						</select>
						<button className="px-3 py-2 border rounded text-slate-900" onClick={async ()=>{
							if (!selectedSlug) return
							const res = await fetch(`/blog-library/${selectedSlug}.json`)
							if (!res.ok) return
							const j = await res.json()
							if (!scheduledAt) { alert('Pick a schedule time'); return }
							const r2 = await fetch('/.netlify/functions/blog-queue', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ slug: j.slug, title: j.title, excerpt: j.summary || j.excerpt, contentHtml: j.contentHtml || j.bodyMd || j.body, scheduledAt }) })
							alert(r2.ok ? 'Blog queued' : `Failed: ${await r2.text()}`)
						}}>Queue Blog</button>
					</div>
					<input className="w-full border rounded px-3 py-2 text-slate-900 placeholder-slate-500" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" />
					<input className="w-full border rounded px-3 py-2 text-slate-900 placeholder-slate-500" value={url} onChange={e=>setUrl(e.target.value)} placeholder="URL" />
					<input className="w-full border rounded px-3 py-2 text-slate-900 placeholder-slate-500" value={keyPoints} onChange={e=>setKeyPoints(e.target.value)} placeholder="Key points (semicolon‑separated)" />
					<input className="w-full border rounded px-3 py-2 text-slate-900 placeholder-slate-500" value={cta} onChange={e=>setCta(e.target.value)} placeholder="Call to action" />
					<input className="w-full border rounded px-3 py-2 text-slate-900 placeholder-slate-500" value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="Keywords (comma‑separated)" />
					<input className="w-full border rounded px-3 py-2 text-slate-900 placeholder-slate-500" value={techLens} onChange={e=>setTechLens(e.target.value)} placeholder="Your Tech Lens (tone & perspective)" />
					<div className="flex gap-2 text-sm">
						<button className="px-3 py-2 border rounded text-slate-900" onClick={()=>{
							const d = new Date(); const day = d.getDay(); const add = (2 - day + 7) % 7 || 7; d.setDate(d.getDate()+add); d.setHours(9,0,0,0);
							setScheduledAt(d.toISOString().slice(0,16))
						}}>UK Tue 09:00</button>
						<button className="px-3 py-2 border rounded text-slate-900" onClick={()=>{
							const d = new Date(); const day = d.getDay(); const add = (2 - day + 7) % 7 || 7; d.setDate(d.getDate()+add); d.setHours(14,0,0,0);
							setScheduledAt(d.toISOString().slice(0,16))
						}}>US ET Tue 09:00</button>
					</div>
				</div>
				<div className="mt-8 bg-white border border-slate-200 rounded p-4" style={{ hyphens: 'none' as any, wordBreak: 'normal' }}>
					<h2 className="text-lg font-semibold text-slate-900 mb-3">LinkedIn Draft</h2>
					<p className="font-semibold mb-2 text-slate-900" style={{ hyphens: 'none' as any, wordBreak: 'normal' }}>{draft.headline}</p>
					<pre className="whitespace-pre-wrap text-sm text-slate-900" style={{ hyphens: 'none' as any, wordBreak: 'normal' }}>{draft.body}</pre>
					<p className="mt-3 text-sm text-slate-800" style={{ hyphens: 'none' as any, wordBreak: 'normal' }}>{draft.hashtags}</p>
					<div className="mt-4 flex gap-3 flex-wrap items-center">
						<a href={draft.shareUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded bg-blue-600 text-white">Open LinkedIn Share</a>
						<button
							onClick={() => navigator.clipboard.writeText(`${draft.headline}\n\n${draft.body}\n\n${draft.hashtags}`)}
							className="px-4 py-2 rounded bg-slate-800 text-white"
						>
							Copy Draft
						</button>
						<a href="/.netlify/functions/linkedin-start" className="px-4 py-2 rounded bg-emerald-600 text-white">Connect LinkedIn</a>
						<button
							onClick={async ()=>{
								const res = await fetch('/.netlify/functions/linkedin-publish', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: `${draft.headline}\n\n${draft.body}\n\n${draft.hashtags}`, url }) })
								alert(res.ok ? 'Published (if connected)' : `Failed: ${await res.text()}`)
							}}
							className="px-4 py-2 rounded bg-emerald-700 text-white"
						>
							Publish (LinkedIn)
						</button>
						<input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} className="px-3 py-2 border rounded text-slate-900" />
						<button
							onClick={async ()=>{
								if (!scheduledAt) { alert('Pick a schedule time'); return }
								const res = await fetch('/.netlify/functions/social-queue', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: `${draft.headline}\n\n${draft.body}\n\n${draft.hashtags}`, url, scheduledAt }) })
								alert(res.ok ? 'Queued' : `Failed: ${await res.text()}`)
							}}
							className="px-4 py-2 rounded bg-slate-700 text-white"
						>
							Queue (Scheduled)
						</button>
						<button
							onClick={async ()=>{
								try {
									if (!selectedSlug) { alert('Pick from library first'); return }
									const r = await fetch(`/blog-library/${selectedSlug}.json`)
									if (!r.ok) { alert('Missing library file'); return }
									const j = await r.json()
									const nowIso = new Date().toISOString()
									const res = await fetch('/.netlify/functions/blog-queue', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ slug: j.slug, title: j.title, excerpt: j.summary || j.excerpt || '', contentHtml: j.contentHtml || j.bodyMd || j.body || '', scheduledAt: nowIso }) })
									if (!res.ok) { alert('Failed to publish now: ' + await res.text()); return }
									await fetch('/.netlify/functions/blog-scheduler')
									alert('Blog published')
								} catch (e: any) { alert('Error: ' + (e.message||'unknown')) }
							}}
							className="px-4 py-2 rounded bg-indigo-600 text-white"
						>
							Post Now
						</button>
					</div>
					<p className="mt-4 text-xs text-slate-800">Safety: sanitized for hype and IP terms. Edit as needed before posting.</p>
				</div>
				<div className="mt-8 bg-white border border-slate-200 rounded p-4">
					<h2 className="text-lg font-semibold text-slate-900 mb-3">Reply Assistant</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						<input className="w-full border rounded px-3 py-2 sm:col-span-2 text-slate-900 placeholder-slate-500" placeholder="Target LinkedIn post URL" value={replyUrl} onChange={e=>setReplyUrl(e.target.value)} />
						<select className="border rounded px-3 py-2 text-slate-900 bg-white" value={replyAngle} onChange={e=>setReplyAngle(e.target.value as any)}>
							<option value="appreciation">Appreciation</option>
							<option value="insight">Insight</option>
							<option value="question">Question</option>
						</select>
						<input className="w-full border rounded px-3 py-2 text-slate-900 placeholder-slate-500" placeholder="Talking points (semicolon‑separated)" value={replyPoints} onChange={e=>setReplyPoints(e.target.value)} />
					</div>
					<div className="mt-4 flex gap-3 flex-wrap items-center">
						<button className="px-4 py-2 rounded bg-slate-800 text-white" onClick={()=>{
							if (!replyUrl) { alert('Add a LinkedIn post URL'); return }
							const draft = generateReplyDraft({ targetUrl: replyUrl, angle: replyAngle, points: replyPoints.split(';').map(s=>s.trim()).filter(Boolean) })
							navigator.clipboard.writeText(draft.comment)
							window.open(draft.openUrl, '_blank')
						}}>Copy Reply & Open Post</button>
					</div>
					<p className="mt-4 text-xs text-slate-800">Manual posting preserves account integrity and follows platform policies. Keep it concise, non‑promotional, and relevant.</p>
				</div>
			</div>
		</div>
	)
}

export default Publisher


