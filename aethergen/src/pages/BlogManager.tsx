import React from 'react';

type BlogIndexEntry = {
  slug: string;
  title: string;
  readTime?: string;
};

const BlogManager: React.FC = () => {
  const [index, setIndex] = React.useState<BlogIndexEntry[]>([]);
  const [slug, setSlug] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [html, setHtml] = React.useState('');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/blog-html/index.json');
        if (res.ok) {
          const data = await res.json();
          setIndex(Array.isArray(data) ? data : []);
        }
      } catch {}
    })();
  }, []);

  const loadPost = async (entry: BlogIndexEntry) => {
    try {
      const res = await fetch(`/blog-html/${entry.slug}.html`);
      if (!res.ok) throw new Error('Not found');
      const text = await res.text();
      setSlug(entry.slug);
      setTitle(entry.title);
      setHtml(text);
      setMessage('Loaded. Edit below and copy or download. Changes are not saved automatically.');
    } catch (e: any) {
      setMessage(`Failed to load: ${e?.message || 'Unknown error'}`);
    }
  };

  const createStub = () => {
    const safeSlug = slug.trim() || 'new-post';
    const safeTitle = title.trim() || 'New Blog Post';
    const template = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>${safeTitle}</title>\n</head>\n<body>\n  <h1>${safeTitle}</h1>\n  <p>Intro paragraph. Replace this content, then click Download and place the file at public/blog-html/${safeSlug}.html</p>\n</body>\n</html>\n`;
    setHtml(template);
    setMessage('Stub created in editor.');
  };

  const downloadFile = () => {
    const safeSlug = (slug || title || 'new-post')
      .toLowerCase()
      .replace(/[^a-z0-9\-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeSlug || 'new-post'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Blog Manager (Local)</h1>
          <p className="text-slate-800 mt-2">No backend writes. Load → edit → Download → place into public/blog-html → git commit.</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Posts</h2>
              <button
                className="text-sm text-blue-600 hover:text-blue-700"
                onClick={async () => {
                  try {
                    const res = await fetch('/blog-html/index.json?ts=' + Date.now());
                    if (res.ok) {
                      const data = await res.json();
                      setIndex(Array.isArray(data) ? data : []);
                      setMessage('Index reloaded.');
                    }
                  } catch {}
                }}
              >Reload</button>
            </div>
            <ul className="max-h-[60vh] overflow-auto divide-y divide-slate-100">
              {index.map((e) => (
                <li key={e.slug} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-slate-900 font-medium line-clamp-1">{e.title}</div>
                    <div className="text-slate-800 text-xs">{e.slug} {e.readTime ? `• ${e.readTime}` : ''}</div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm" onClick={() => loadPost(e)}>Load</button>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-xs text-slate-800 mt-3">
            Delete instructions: run git rm public/blog-html/&lt;slug&gt;.html then commit.
          </div>
        </aside>

        <section className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                placeholder="slug (e.g. evidence-led-ai-regulated-industries)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm md:col-span-2"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex gap-2">
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={createStub}>New</button>
                <button className="px-3 py-2 bg-slate-700 text-white rounded-lg text-sm" onClick={() => { navigator.clipboard.writeText(html); setMessage('Copied editor HTML to clipboard.'); }}>Copy</button>
                <button className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm" onClick={downloadFile}>Download</button>
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="w-full h-[60vh] border border-slate-300 rounded-lg p-3 font-mono text-sm bg-white text-slate-900"
                spellCheck={false}
              />
              {message ? <div className="text-sm text-slate-800 mt-2">{message}</div> : null}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-slate-800">
          Local-only editing tool. Paste over an existing file or drop the downloaded file into public/blog-html/, then commit.
        </div>
      </footer>
    </div>
  );
};

export default BlogManager;


