import React, { useEffect, useState } from 'react';

interface Dataset {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

const DatasetsLibrary: React.FC = () => {
  const [items, setItems] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/datasets?action=list');
      const js = await res.json();
      setItems(js.items || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true); setError(null);
    try {
      const owner_id = localStorage.getItem('aeg_owner_id') || 'anonymous';
      await fetch('/api/datasets?action=create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, owner_id })
      });
      setName(''); setDescription('');
      await load();
    } catch (e: any) { setError(e.message || 'Create failed'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📦 Datasets</h2>
        <div className="flex gap-2 mb-4">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Dataset name" className="border px-3 py-2 rounded w-64" />
          <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="border px-3 py-2 rounded flex-1" />
          <button onClick={create} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={loading}>Create</button>
        </div>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {loading ? <div>Loading…</div> : (
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="px-3 py-2">{it.name}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{it.description || '—'}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{new Date(it.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={async ()=>{
                      const res = await fetch(`/api/datasets?action=bundle&dataset_id=${it.id}`);
                      const manifest = await res.json();
                      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `${it.name.replace(/\s+/g,'_')}_bundle_manifest.json`; a.click();
                      URL.revokeObjectURL(url);
                    }} className="px-3 py-1 bg-slate-800 text-white rounded text-sm hover:bg-slate-900">Export Manifest</button>
                    <button onClick={async ()=>{
                      const res = await fetch(`/api/datasets?action=bundle&dataset_id=${it.id}&format=zip`, { headers: { Accept: 'application/zip' } } as any);
                      const b64 = await res.text();
                      const bin = atob(b64);
                      const arr = new Uint8Array(bin.length);
                      for (let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
                      const blob = new Blob([arr], { type: 'application/zip' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `${it.name.replace(/\s+/g,'_')}_bundle.zip`; a.click(); URL.revokeObjectURL(url);
                    }} className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">Export Zip</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td className="px-3 py-6 text-sm text-gray-500" colSpan={4}>No datasets yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DatasetsLibrary;


