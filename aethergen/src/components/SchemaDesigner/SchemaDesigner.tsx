import React, { useState, useEffect } from 'react';
import { SchemaField, DataSchema } from '../../types/schema';

interface SchemaDesignerProps {
  onSchemaChange: (schema: DataSchema) => void;
  initialSchema?: DataSchema;
  seedData?: any[];
}

const SchemaDesigner: React.FC<SchemaDesignerProps> = ({ onSchemaChange, initialSchema, seedData }) => {
  const [schema, setSchema] = useState<DataSchema>(initialSchema || {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    domain: '',
    fields: [],
    targetVolume: 1000,
    privacySettings: {
      differentialPrivacy: true,
      epsilon: 0.1,
      syntheticRatio: 95
    }
  });

  const [newField, setNewField] = useState<Partial<SchemaField>>({
    name: '',
    type: 'string',
    constraints: {},
    privacyLevel: 'medium'
  });

  const fieldTypes = ['string', 'number', 'boolean', 'date', 'json'];
  const aiModels = ['T5-Small', 'VAE', 'ARIMA', 'IsolationForest', 'Node2Vec'];
  const privacyLevels = ['low', 'medium', 'high'];
  const domains = ['Finance', 'Healthcare', 'Retail', 'Education', 'Transportation', 'Custom'];
  const [fusionMappings, setFusionMappings] = useState<Array<{ sourceField: string; targetField: string }>>([]);
  const [offline, setOffline] = useState<boolean>(() => {
    try { return localStorage.getItem('aeg_offline') === '1'; } catch { return false; }
  });

  useEffect(() => {
    onSchemaChange(schema);
  }, [schema, onSchemaChange]);

  // Debounced autosave
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        if (offline) return; // offline mode: skip autosave
        if (!schema.name && schema.fields.length === 0) return; // avoid saving empty drafts
        await fetch('/api/store-schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: schema.id,
            name: schema.name || 'Untitled Schema',
            description: schema.description || '',
            schema_json: {
              name: schema.name,
              description: schema.description,
              domain: schema.domain,
              fields: schema.fields,
              targetVolume: schema.targetVolume,
              privacySettings: schema.privacySettings
            }
          }),
          signal: controller.signal
        }).then(async (r) => {
          if (!r.ok) return;
          const js = await r.json().catch(() => null);
          if (js?.id && js.id !== schema.id) setSchema(prev => ({ ...prev, id: js.id }));
        });
      } catch {
        /* ignore autosave errors */
      }
    }, 600);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema.name, schema.description, schema.domain, schema.fields, schema.targetVolume, schema.privacySettings, offline]);

  // Listen for offline toggle
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as { offline?: boolean };
      if (typeof d?.offline === 'boolean') setOffline(d.offline);
    };
    window.addEventListener('aeg:offline', handler as EventListener);
    return () => window.removeEventListener('aeg:offline', handler as EventListener);
  }, []);

  const addField = () => {
    if (!newField.name) return;
    
    const field: SchemaField = {
      name: newField.name,
      type: newField.type || 'string',
      constraints: newField.constraints || {},
      privacyLevel: newField.privacyLevel || 'medium',
      aiModel: newField.aiModel,
      relationships: newField.relationships
    };

    setSchema(prev => ({
      ...prev,
      fields: [...prev.fields, field]
    }));

    setNewField({
      name: '',
      type: 'string',
      constraints: {},
      privacyLevel: 'medium'
    });
  };

  const removeField = (index: number) => {
    setSchema(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const updateField = (index: number, field: SchemaField) => {
    setSchema(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? field : f)
    }));
  };

  const updateSchema = (updates: Partial<DataSchema>) => {
    setSchema(prev => ({ ...prev, ...updates }));
  };

  const saveSchemaToSupabase = async () => {
    try {
      const res = await fetch('/api/store-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: schema.name || 'Untitled Schema',
          description: schema.description || '',
          schema_json: {
            name: schema.name,
            description: schema.description,
            domain: schema.domain,
            fields: schema.fields,
            targetVolume: schema.targetVolume,
            privacySettings: schema.privacySettings
          }
        })
      });
      if (!res.ok) throw new Error(`store-schema failed: ${res.status}`);
      const json = await res.json();
      if (json?.id) {
        setSchema(prev => ({ ...prev, id: json.id }));
      }
    } catch (e) {
      console.warn('Schema save failed', e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {offline && (
        <div className="p-3 rounded border border-yellow-200 bg-yellow-50 text-yellow-800 text-sm">
          Offline mode is enabled. Remote saves are disabled; changes persist locally until you go online.
        </div>
      )}
      {/* Schema Definition */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Schema Definition</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schema Name
            </label>
            <input
              type="text"
              value={schema.name}
              onChange={(e) => updateSchema({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Healthcare Patient Records"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domain
            </label>
            <select
              value={schema.domain}
              onChange={(e) => updateSchema({ domain: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Domain</option>
              {domains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={schema.description}
            onChange={(e) => updateSchema({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe your data schema..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Volume (records/day)
            </label>
            <input
              type="number"
              value={schema.targetVolume}
              onChange={(e) => updateSchema({ targetVolume: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Differential Privacy
            </label>
            <select
              value={schema.privacySettings.differentialPrivacy ? 'true' : 'false'}
              onChange={(e) => updateSchema({ 
                privacySettings: { 
                  ...schema.privacySettings, 
                  differentialPrivacy: e.target.value === 'true' 
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Epsilon (Privacy Level)
            </label>
            <input
              type="number"
              step="0.1"
              value={schema.privacySettings.epsilon}
              onChange={(e) => updateSchema({ 
                privacySettings: { 
                  ...schema.privacySettings, 
                  epsilon: parseFloat(e.target.value) || 0.1 
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0.1"
              max="10"
            />
          </div>
        </div>
      </div>

      {/* Field Configuration */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Field Configuration</h2>
        
        {/* Add New Field */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Add New Field</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
              <input
                type="text"
                value={newField.name}
                onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., patient_id"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newField.type}
                onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fieldTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
              <select
                value={newField.aiModel || ''}
                onChange={(e) => setNewField(prev => ({ ...prev, aiModel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Auto-select</option>
                {aiModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Level</label>
              <select
                value={newField.privacyLevel}
                onChange={(e) => setNewField(prev => ({ ...prev, privacyLevel: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {privacyLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={addField}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Field
          </button>
        </div>

        {/* Existing Fields */}
        <div className="space-y-3">
          {schema.fields.map((field, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-800">{field.name}</h4>
                <button
                  onClick={() => removeField(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕ Remove
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(index, { ...field, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {fieldTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
                  <select
                    value={field.aiModel || ''}
                    onChange={(e) => updateField(index, { ...field, aiModel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Auto-select</option>
                    {aiModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Level</label>
                  <select
                    value={field.privacyLevel}
                    onChange={(e) => updateField(index, { ...field, privacyLevel: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {privacyLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required</label>
                  <input
                    type="checkbox"
                    checked={field.constraints.required || false}
                    onChange={(e) => updateField(index, { 
                      ...field, 
                      constraints: { ...field.constraints, required: e.target.checked } 
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Domain Data Fusion (experimental) */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🌐 Cross-Domain Data Fusion (Experimental)</h2>
        <p className="text-sm text-gray-600 mb-3">Align fields across multiple datasets. Start by mapping source to target field names. This will be used by data fusion and ablation recipes.</p>
        <div className="space-y-2">
          {fusionMappings.map((m, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
              <input
                className="px-3 py-2 border rounded"
                placeholder="source.field_name"
                value={m.sourceField}
                onChange={(e) => setFusionMappings(prev => prev.map((x, i) => i === idx ? { ...x, sourceField: e.target.value } : x))}
              />
              <span className="text-center">→</span>
              <input
                className="px-3 py-2 border rounded"
                placeholder="target.field_name"
                value={m.targetField}
                onChange={(e) => setFusionMappings(prev => prev.map((x, i) => i === idx ? { ...x, targetField: e.target.value } : x))}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => setFusionMappings(prev => [...prev, { sourceField: '', targetField: '' }])}>Add Mapping</button>
          {fusionMappings.length > 0 && (
            <button className="px-3 py-2 bg-gray-700 text-white rounded" onClick={() => navigator.clipboard.writeText(JSON.stringify({ mappings: fusionMappings }, null, 2))}>Copy as JSON</button>
          )}
        </div>
      </div>

      {/* Schema Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Schema Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Fields</h3>
            <p className="text-2xl font-bold text-blue-600">{schema.fields.length}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Target Volume</h3>
            <p className="text-2xl font-bold text-green-600">{schema.targetVolume.toLocaleString()}/day</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Privacy Level</h3>
            <p className="text-2xl font-bold text-purple-600">ε = {schema.privacySettings.epsilon}</p>
          </div>
        </div>
        
        {schema.fields.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Field List:</h3>
            <div className="flex flex-wrap gap-2">
              {schema.fields.map((field, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {field.name} ({field.type})
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={saveSchemaToSupabase}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Save to Supabase
          </button>
          <button
            onClick={() => {
              const content = JSON.stringify({
                name: schema.name,
                description: schema.description,
                domain: schema.domain,
                fields: schema.fields,
                targetVolume: schema.targetVolume,
                privacySettings: schema.privacySettings,
              }, null, 2);
              const blob = new Blob([content], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `schema_${schema.name || 'untitled'}.json`;
              document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Save locally (JSON)
          </button>
          {schema.id && (
            <span className="text-sm text-gray-600">Saved schema id: {schema.id}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaDesigner; 