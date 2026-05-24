import React, { useEffect, useState } from 'react';

interface Template { id: string; name: string; domain?: string; created_at: string; }

const TemplatesLibrary: React.FC = () => {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/templates?action=list');
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) { setError(e.message || 'Failed to load'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true); setError(null);
    try {
      const owner_id = localStorage.getItem('aeg_owner_id') || 'anonymous';
      await fetch('/api/templates?action=create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, domain, owner_id }) });
      setName(''); setDomain('');
      await load();
    } catch (e: any) { setError(e.message || 'Create failed'); } finally { setLoading(false); }
  };

  const applyToPipeline = async (templateId: string) => {
    try {
      const owner_id = localStorage.getItem('aeg_owner_id') || 'anonymous';
      const res = await fetch('/api/templates?action=list');
      const js = await res.json();
      const t = (js.items||[]).find((x:any)=>x.id===templateId);
      const config = { template_id: templateId, applied_at: new Date().toISOString(), template_name: t?.name };
      await fetch('/api/pipelines?action=snapshot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: `Apply ${t?.name||templateId}`, config, owner_id }) });
      alert('Applied to pipeline (snapshot created)');
    } catch (e: any) {
      alert('Apply failed: ' + (e.message||'unknown'));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📐 Schema Templates</h2>
        <div className="flex gap-2 mb-4">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Template name" className="border px-3 py-2 rounded w-64" />
          <input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="Domain e.g. automotive" className="border px-3 py-2 rounded w-64" />
          <button onClick={create} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={loading}>Create</button>
        </div>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {loading ? <div>Loading…</div> : (
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Domain</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="px-3 py-2">{it.name}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{it.domain || '—'}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{new Date(it.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={()=>applyToPipeline(it.id)} className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700">Apply to Pipeline</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (<tr><td className="px-3 py-6 text-sm text-gray-500" colSpan={4}>No templates yet.</td></tr>)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TemplatesLibrary;


