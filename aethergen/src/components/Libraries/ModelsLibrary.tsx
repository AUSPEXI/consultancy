import React, { useEffect, useState } from 'react';

interface Model { id: string; name: string; task?: string; created_at: string; }

const ModelsLibrary: React.FC = () => {
  const [items, setItems] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [task, setTask] = useState('');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/models?action=list');
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
      await fetch('/api/models?action=create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, task, owner_id }) });
      setName(''); setTask('');
      await load();
    } catch (e: any) { setError(e.message || 'Create failed'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🧠 Models</h2>
        <div className="flex gap-2 mb-4">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Model name" className="border px-3 py-2 rounded w-64" />
          <input value={task} onChange={e=>setTask(e.target.value)} placeholder="Task e.g. classification" className="border px-3 py-2 rounded w-64" />
          <button onClick={create} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={loading}>Create</button>
        </div>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {loading ? <div>Loading…</div> : (
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Task</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="px-3 py-2">{it.name}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{it.task || '—'}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{new Date(it.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && (<tr><td className="px-3 py-6 text-sm text-gray-500" colSpan={3}>No models yet.</td></tr>)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ModelsLibrary;


