import React, { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
};

type TestResult = { ok: boolean; message?: string } | null;

const PublisherOnboardingModal: React.FC<Props> = ({ open, onClose }) => {
  const [workspaceUrl, setWorkspaceUrl] = useState('');
  const [patToken, setPatToken] = useState('');
  const [catalog, setCatalog] = useState('');
  const [schema, setSchema] = useState('');
  const [tablePrefix, setTablePrefix] = useState('aethergen_');
  const [useUnityCatalog, setUseUnityCatalog] = useState(true);
  const [useEnv, setUseEnv] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);

  useEffect(() => {
    if (!open) return;
    try {
      const saved = localStorage.getItem('publisher_onboarding');
      if (saved) {
        const cfg = JSON.parse(saved);
        setWorkspaceUrl(cfg.workspaceUrl || '');
        setCatalog(cfg.catalog || '');
        setSchema(cfg.schema || '');
        setTablePrefix(cfg.tablePrefix || 'aethergen_');
        setUseUnityCatalog(cfg.useUnityCatalog ?? true);
      }
    } catch (_) {}
  }, [open]);

  const disabled = !useEnv && (!workspaceUrl || !patToken);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/marketplace-test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workspaceUrl, patToken, useEnv })
      });
      const data = await res.json();
      setTestResult({ ok: res.ok && data?.ok, message: data?.message });
    } catch (e: any) {
      setTestResult({ ok: false, message: e?.message || 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveLocal = () => {
    const cfg = { workspaceUrl, catalog, schema, tablePrefix, useUnityCatalog };
    localStorage.setItem('publisher_onboarding', JSON.stringify(cfg));
  };

  const handleDownload = () => {
    const cfg = { workspaceUrl, catalog, schema, tablePrefix, useUnityCatalog };
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'publisher_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Databricks Publisher Onboarding</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
            Enter your Databricks workspace and publishing settings. We’ll validate your token and save settings locally. No proprietary code or data is shared.
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Workspace URL</label>
            <input value={workspaceUrl} onChange={e=>setWorkspaceUrl(e.target.value)} placeholder="https://adb-xxxx.xx.azuredatabricks.net" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Personal Access Token (PAT)</label>
            <input value={patToken} onChange={e=>setPatToken(e.target.value)} placeholder="dapi..." type="password" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catalog</label>
              <input value={catalog} onChange={e=>setCatalog(e.target.value)} placeholder="aethergen" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Schema</label>
              <input value={schema} onChange={e=>setSchema(e.target.value)} placeholder="public" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Table Prefix</label>
              <input value={tablePrefix} onChange={e=>setTablePrefix(e.target.value)} placeholder="aethergen_" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="useenv" type="checkbox" checked={useEnv} onChange={e=>setUseEnv(e.target.checked)} />
            <label htmlFor="useenv" className="text-sm text-slate-700">Use Netlify environment variables</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="uc" type="checkbox" checked={useUnityCatalog} onChange={e=>setUseUnityCatalog(e.target.checked)} />
            <label htmlFor="uc" className="text-sm text-slate-700">Use Unity Catalog</label>
          </div>

          {testResult && (
            <div className={`text-sm rounded-lg p-3 border ${testResult.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
              {testResult.ok ? 'Connection successful.' : `Connection failed: ${testResult.message || 'Unknown error'}`}
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-2">
            <button disabled={disabled || isTesting} onClick={handleTest} className={`px-4 py-2 rounded-lg text-white ${disabled ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700'} ${isTesting ? 'opacity-70' : ''}`}>
              {isTesting ? 'Testing…' : 'Test Connection'}
            </button>
            <button onClick={handleSaveLocal} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border">Save Locally</button>
            <button onClick={handleDownload} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border">Download JSON</button>
            <button onClick={onClose} className="ml-auto px-4 py-2 rounded-lg bg-white border hover:bg-slate-50">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublisherOnboardingModal;


