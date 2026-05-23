import React, { useState } from 'react';
import { buildLocalTrainingScript, downloadScriptFile, LocalTaskType, LocalBackend, buildRequirements, buildReadmeSnippet } from '../../services/localTrainingScriptService';

type TemplateName = 'none' | 'diagnostics-binary' | 'multiclass' | 'regression-forecast';
const templates: Record<TemplateName, { task?: LocalTaskType }> = {
  none: {},
  'diagnostics-binary': { task: 'classification' },
  'multiclass': { task: 'classification' },
  'regression-forecast': { task: 'regression' }
};

const LocalTrainingPanel: React.FC<{ availableFields: string[] }> = ({ availableFields }) => {
  const [target, setTarget] = useState('');
  const [task, setTask] = useState<LocalTaskType>('auto');
  const [backend, setBackend] = useState<LocalBackend>('sklearn');
  const [template, setTemplate] = useState<TemplateName>('none');

  const disabled = !target || !availableFields.includes(target);

  const download = () => {
    const script = buildLocalTrainingScript({ targetColumn: target, task, backend, template });
    downloadScriptFile(script, 'train_baseline.py');
    try { localStorage.setItem('aeg_train_backend', backend); localStorage.setItem('aeg_train_template', template); localStorage.setItem('aeg_train_params', JSON.stringify({ target, task })); } catch {}
  };
  const downloadReqs = () => {
    const content = buildRequirements(backend);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'requirements.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  const downloadReadme = () => {
    const content = buildReadmeSnippet({ backend, target: target || '<target>' });
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'README_local_training.md'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-3">🏃 Train locally (baseline)</h3>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">Target column
          <input list="aeg_fields" className="border rounded px-2 py-1" value={target} onChange={e=>setTarget(e.target.value)} placeholder="label" />
          <datalist id="aeg_fields">
            {availableFields.map(f=> <option value={f} key={f} />)}
          </datalist>
        </label>
        <label className="flex items-center gap-2">Template
          <select value={template} onChange={e=>{ const v=e.target.value as TemplateName; setTemplate(v); if (templates[v]?.task) setTask(templates[v].task!); }} className="border rounded px-2 py-1">
            <option value="none">None</option>
            <option value="diagnostics-binary">Diagnostics (binary)</option>
            <option value="multiclass">Multiclass</option>
            <option value="regression-forecast">Regression (forecast)</option>
          </select>
        </label>
        <label className="flex items-center gap-2">Task
          <select value={task} onChange={e=>setTask(e.target.value as LocalTaskType)} className="border rounded px-2 py-1">
            <option value="auto">Auto</option>
            <option value="classification">Classification</option>
            <option value="regression">Regression</option>
          </select>
        </label>
        <label className="flex items-center gap-2">Backend
          <select value={backend} onChange={e=>setBackend(e.target.value as LocalBackend)} className="border rounded px-2 py-1">
            <option value="sklearn">scikit-learn</option>
            <option value="pytorch">PyTorch</option>
            <option value="tensorflow">TensorFlow</option>
          </select>
        </label>
        <button onClick={download} disabled={disabled} className={`px-4 py-2 rounded ${disabled?'bg-gray-300 text-gray-600':'bg-indigo-600 text-white hover:bg-indigo-700'}`}>Download training script</button>
        <button onClick={downloadReqs} className="px-3 py-2 rounded border">requirements.txt</button>
        <button onClick={downloadReadme} className="px-3 py-2 rounded border">README snippet</button>
      </div>
      <p className="text-xs text-gray-500 mt-2">Use with your exported synthetic dataset: python train_baseline.py --input synthetic_data.csv --target {target||'<target>'} --task {task}</p>
    </div>
  );
};

export default LocalTrainingPanel;


