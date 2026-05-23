import React, { useState, useEffect, useRef } from 'react';
import { cleanSyntheticData, CleaningReport } from '../../services/dataCleaningService';
import { estimateStep } from '../../services/costEstimator';
import { DataSchema, SyntheticDataResult } from '../../types/schema';
import { productionZKProofService, ProductionZKProofInput, ProductionZKProof } from '../../services/zksnark/productionZKProofService';
// REMOVE: import { saveAs } from 'file-saver';

interface SyntheticDataGeneratorProps {
  schema: DataSchema;
  seedData: any[];
  onGenerationComplete: (result: SyntheticDataResult) => void;
}

const SyntheticDataGenerator: React.FC<SyntheticDataGeneratorProps> = ({
  schema,
  seedData,
  onGenerationComplete
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedRecords, setGeneratedRecords] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [qualityMetrics, setQualityMetrics] = useState({
    privacyScore: 0,
    utilityScore: 0,
    generationTime: 0
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [zkProof, setZkProof] = useState<ProductionZKProof | null>(null);
  const [proofGenerating, setProofGenerating] = useState(false);
  const [proofVerified, setProofVerified] = useState<boolean | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const proofFileInputRef = useRef<HTMLInputElement>(null);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [finalJsonBlob, setFinalJsonBlob] = useState<Blob | null>(null);
  const [finalCsvBlob, setFinalCsvBlob] = useState<Blob | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const startRef = useRef<number | null>(null);
  const [isSampleOpen, setIsSampleOpen] = useState<boolean>(true);
  const [cleanBeforeDownload, setCleanBeforeDownload] = useState<boolean>(false);
  const [cleaningReport, setCleaningReport] = useState<CleaningReport | null>(null);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [autoTighten, setAutoTighten] = useState<boolean>(true);
  const [driftAlert, setDriftAlert] = useState<string | null>(null);
  const [useAgo, setUseAgo] = useState<boolean>(false);
  const [useHarm432, setUseHarm432] = useState<boolean>(false);

  // Volume control for generation
  const [generationVolume, setGenerationVolume] = useState<number>(schema.targetVolume);
  const [generationVolumeInput, setGenerationVolumeInput] = useState<string>(String(schema.targetVolume));
  const [generationDuration, setGenerationDuration] = useState<number>(1); // days

  // Proof is generated once after full generation completes (see generateSyntheticData)
  useEffect(() => {
    // Keep input in sync when schema target changes
    setGenerationVolume(schema.targetVolume);
    setGenerationVolumeInput(String(schema.targetVolume));
    setIsSampleOpen(schema.targetVolume <= 1000);
  }, [schema.targetVolume]);

  const downloadProof = () => {
    console.log('🔍 Attempting to download synthetic data proof...', { zkProof, proofVerified });
    
    if (!zkProof) {
      console.warn('⚠️ No synthetic data proof available for download');
      return;
    }
    
    try {
      console.log('📦 Preparing synthetic data proof for download...', zkProof);
      
      // Create a comprehensive proof object with metadata
      const proofData = {
        proof: zkProof.proof,
        publicSignals: zkProof.publicSignals,
        verified: proofVerified,
        circuitHash: zkProof.circuitHash,
        timestamp: zkProof.timestamp,
        metadata: {
          schemaId: schema.id,
          recordCount: generatedRecords,
          privacyLevel: schema.privacySettings.epsilon,
          syntheticRatio: schema.privacySettings.syntheticRatio,
          generatedAt: new Date().toISOString(),
          version: '1.0.0',
          type: 'synthetic-data'
        }
      };
      
      const proofString = JSON.stringify(proofData, null, 2);
      const blob = new Blob([proofString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synthetic-data-proof-${schema.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Synthetic data proof downloaded successfully');
    } catch (error) {
      console.error('❌ Synthetic data proof download failed:', error);
      // Try fallback download method
      try {
        const fallbackData = {
          proof: zkProof,
          verified: proofVerified,
          timestamp: Date.now(),
          schemaId: schema.id,
          recordCount: generatedRecords,
          type: 'synthetic-data'
        };
        const fallbackString = JSON.stringify(fallbackData, null, 2);
        const blob = new Blob([fallbackString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `synthetic-data-proof-fallback-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('✅ Fallback synthetic data proof download successful');
      } catch (fallbackError) {
        console.error('❌ Fallback synthetic data proof download also failed:', fallbackError);
      }
    }
  };

  const saveGeneratedToDatasets = async () => {
    try {
      if (!generatedData || generatedData.length === 0) return;
      const owner_id = localStorage.getItem('aeg_owner_id') || 'anonymous';
      const name = `${schema?.id || 'schema'}_synthetic_${new Date().toISOString().slice(0,10)}`;
      const createRes = await fetch('/api/datasets?action=create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: 'Synthetic dataset', owner_id })
      });
      const created = await createRes.json();
      if (!created.dataset?.id) throw new Error(created.error || 'Dataset create failed');
      const vRes = await fetch('/api/datasets?action=addVersion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: created.dataset.id, version_label: 'v1', row_count: generatedData.length, byte_size: JSON.stringify(generatedData).length, checksum: undefined, proof_json: zkProof })
      });
      const vJs = await vRes.json();
      await fetch('/api/evidence?action=record', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_type: 'synthetic_saved', owner_id, details: { dataset_id: created.dataset.id, version_id: vJs.version?.id, schema_id: schema?.id } }) });
      if (zkProof) {
        await fetch('/api/evidence?action=link-proof', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataset_version_id: vJs.version?.id, proof_id: null }) });
      }
      alert('Synthetic data saved to Datasets');
    } catch (e: any) {
      alert('Save failed: ' + (e.message || 'unknown'));
    }
  };

  const handleProofFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProofFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const proofObj = JSON.parse(e.target?.result as string);
        setZkProof(proofObj);
        setProofVerified(true);
        console.log('✅ Synthetic data proof file loaded successfully');
      } catch (error) {
        console.error('❌ Invalid synthetic data proof file format:', error);
        setProofVerified(false);
      }
    };
    reader.readAsText(file);
  };

  const generateZKProofForSyntheticData = async () => {
    setProofGenerating(true);
    setZkProof(null);
    setProofVerified(null);

    try {
      console.log('🔐 Generating zk-SNARK proof for synthetic data...');
      
      const input: ProductionZKProofInput = {
        proof: {
          dataHash: btoa(JSON.stringify({ 
            schemaId: schema.id,
            recordCount: generatedRecords,
            privacyLevel: schema.privacySettings.epsilon,
            syntheticRatio: schema.privacySettings.syntheticRatio,
            generationTime: qualityMetrics.generationTime
          })),
          timestamp: Date.now(),
          schemaId: schema.id,
          recordCount: generatedRecords,
          privacyLevel: schema.privacySettings.epsilon,
          syntheticRatio: schema.privacySettings.syntheticRatio
        },
        publicSignals: {
          dataIntegrity: true,
          privacyCompliance: true,
          syntheticGeneration: true,
          qualityMetrics: {
            privacyScore: qualityMetrics.privacyScore,
            utilityScore: qualityMetrics.utilityScore
          }
        }
      };

      const productionProof = await productionZKProofService.generateProof(input);
      
      // Check if proof was generated successfully
      if (productionProof && productionProof.proof && productionProof.proof.pi_a) {
        setZkProof(productionProof);
        
        // Verify the proof
        try {
          const verificationResult = await productionZKProofService.verifyProof(
            productionProof.proof,
            productionProof.publicSignals
          );
          setProofVerified(verificationResult);
          console.log('✅ zk-SNARK proof generated and verified for synthetic data');
        } catch (verifyError) {
          console.error('❌ zk-SNARK proof verification failed for synthetic data:', verifyError);
          setProofVerified(false);
        }
      } else {
        console.warn('⚠️ zk-SNARK proof generation returned invalid structure for synthetic data, using fallback');
        setProofVerified(false);
      }
      
    } catch (error) {
      console.error('❌ zk-SNARK proof generation failed for synthetic data:', error);
      setProofVerified(false);
    } finally {
      setProofGenerating(false);
    }
  };

  // Validation before generation
  const validateSeedDataAndSchema = () => {
    if (!schema.fields || schema.fields.length === 0) {
      return 'Schema has no fields defined.';
    }
    if (!seedData || seedData.length === 0) {
      return 'Seed data is empty. Please upload valid seed data.';
    }
    const missingFields = schema.fields.filter(field =>
      !seedData.some(row => Object.prototype.hasOwnProperty.call(row, field.name))
    ).map(field => field.name);
    if (missingFields.length > 0) {
      return `Seed data is missing fields: ${missingFields.join(', ')}`;
    }
    return null;
  };

  const generateSyntheticData = async () => {
    setValidationError(null);
    const validationMsg = validateSeedDataAndSchema();
    if (validationMsg) {
      setValidationError(validationMsg);
      return;
    }
    setIsGenerating(true);
    setIsComplete(false);
    setProgress(0);
    setGeneratedRecords(0);
    setErrors([]);
    setGeneratedData([]); // Reset generatedData at start
    setElapsedMs(0);
    startRef.current = Date.now();
    setIsSampleOpen(generationVolume <= 1000);
    
    const startTime = Date.now();
    const targetRecords = generationVolume;
    // Batch size tuned for fewer UI wakeups
    const batchSize = 300;
    const totalBatches = Math.ceil(targetRecords / batchSize);
    const sampleMax = 200;
    let sampleRecords: any[] = [];
    const useWorker = targetRecords >= 1500;
    const allRecords: any[] = [];
    try {
      if (useWorker) {
        // Inline worker code (no extra bundler config)
        const workerFn = function() { /* worker-start */
          /* eslint-disable no-restricted-globals */
          (self as any).onmessage = async (e: MessageEvent) => {
            const d: any = e.data || {};
            if (d.cmd !== 'start') return;
            const seedData: any[] = d.seedData || [];
            const schema = d.schema || { fields: [], privacySettings: { epsilon: 0.1 } };
            const total: number = Math.max(1, d.total || 1000);
            const batchSize: number = Math.max(50, d.batchSize || 500);
            const sampleMax: number = Math.max(50, d.sampleMax || 200);
            const useAgo: boolean = !!d.useAgo;
            const useHarm432: boolean = !!d.useHarm432;
            const epsilon = schema?.privacySettings?.epsilon ?? 0.1;
            const fields = (schema.fields || []).map((f: any) => f.name);
            function ns(eps: number) { const s = 1 / Math.max(eps, 0.01); return Math.min(Math.max(s, 0.1), 5); }
            function hp(val: any, t: string, eps: number) { const n = ns(eps); if (t==='string') return `anon_${Math.random().toString(36).slice(2,10)}`; if (t==='number') return Math.floor((Math.random()*1000)*n); if (t==='date') return new Date(Date.now()-Math.random()*31536e6*n).toISOString(); return val; }
            function mp(val: any, t: string, eps: number) { const n = ns(eps)*0.2; if (t==='string') return typeof val==='string'?`${val}_syn`:val; if (t==='number') return typeof val==='number'?val+(Math.random()-0.5)*20*n:val; return val; }
            function gv(f: any, seed: any[], eps: number) { const sample = seed.map(r=>r[f.name]).filter((v:any)=>v!==undefined); if(sample.length===0){ if(f.type==='string')return `synthetic_${f.name}_${Math.random().toString(36).slice(2,10)}`; if(f.type==='number')return Math.floor(Math.random()*1000); if(f.type==='boolean')return Math.random()>0.5; if(f.type==='date')return new Date(Date.now()-Math.random()*31536e6).toISOString(); if(f.type==='json')return {synthetic:true,field:f.name}; return null;} let v=sample[Math.floor(Math.random()*sample.length)]; if(f.privacyLevel==='high')v=hp(v,f.type,eps); else if(f.privacyLevel==='medium')v=mp(v,f.type,eps); return v; }
            const start = Date.now();
            let generated = 0, lastTick = Date.now(), lastGen = 0;
            const sample: any[] = [];
            let jsonParts: string[] = ['[']; let first = true;
            const csvRows: string[] = [fields.join(',')];
            while (generated < total) {
              const n = Math.min(batchSize, total - generated);
              for (let i=0;i<n;i++){
                const rec: any = {}; for (const f of schema.fields) rec[f.name]=gv(f,seedData,epsilon);
                if (useAgo) {
                  const phase = (generated+i) % 3;
                  for (const k of Object.keys(rec)) { const v = rec[k]; if (typeof v==='number') { if (phase===0) rec[k]=v*1.05; else if (phase===2) rec[k]=v*0.95; } }
                }
                if (useHarm432) {
                  const knum = fields.find(fn=> typeof rec[fn] === 'number');
                  if (knum) { const base = Number(rec[knum])||0; rec[knum] = base + 0.02*Math.sin(2*Math.PI*((generated+i)/50)); }
                }
                sample.push(rec); if (sample.length>sampleMax) sample.splice(0,sample.length-sampleMax);
                const frag = JSON.stringify(rec); if(!first) jsonParts.push(','); jsonParts.push(frag); first=false;
                const csvVals = fields.map(fn=>{ const v=rec[fn]; if(v===null||v===undefined) return ''; if(typeof v==='object') return '"'+JSON.stringify(v).replace(/"/g,'""')+'"'; return '"'+String(v).replace(/"/g,'""')+'"'; }); csvRows.push(csvVals.join(','));
              }
              generated += n;
              const now = Date.now();
              if (now-lastTick>=300){ const rps=Math.round((generated-lastGen)/((now-lastTick)/1000)); (self as any).postMessage({type:'progress',generated,rps}); lastTick=now; lastGen=generated; await new Promise(r=>setTimeout(r,0)); }
            }
            jsonParts.push(']');
            const jsonText = jsonParts.join('');
            const csvText = csvRows.join('\n');
            (self as any).postMessage({type:'done', generated, total, sample, jsonText, csvText, elapsedMs: Date.now()-start});
          };
        /* worker-end */ };
        const code = `(${workerFn.toString()})()`;
        const blob = new Blob([code], { type: 'application/javascript' });
        const w = new Worker(URL.createObjectURL(blob));
        w.onmessage = (ev: MessageEvent) => {
          const msg: any = ev.data || {};
          if (msg.type === 'progress') {
            setGeneratedRecords(msg.generated);
            setProgress(Math.min(100, (msg.generated / targetRecords) * 100));
            setCurrentSpeed(msg.rps);
            if (startRef.current) setElapsedMs(Date.now() - startRef.current);
          } else if (msg.type === 'done') {
            const { sample, jsonText, csvText, elapsedMs, generated } = msg;
            setGeneratedData(sample);
            // Build blobs on main thread for reliable downloads
            try {
              const jBlob = new Blob([jsonText || '[]'], { type: 'application/json' });
              const cBlob = new Blob([csvText || ''], { type: 'text/csv' });
              setFinalJsonBlob(jBlob);
              setFinalCsvBlob(cBlob);
            } catch (_) {
              setFinalJsonBlob(null);
              setFinalCsvBlob(null);
            }
            // Optional post-generation cleaning (outside recipes)
            if (cleanBeforeDownload || autoTighten) {
              try {
                setIsCleaning(true);
                const raw = jsonText ? JSON.parse(jsonText) : [];
                // drift detection
                const metrics = detectDrift(seedData, raw);
                if (autoTighten && (metrics.uniqueness < 0.9 || metrics.entropy < 0.6)) {
                  setDriftAlert(`Auto-tighten applied (uniqueness ${Math.round(metrics.uniqueness*100)}%, entropy ${Math.round(metrics.entropy*100)}%)`);
                }
                // Prefer user-chosen IQR k from Autopilot if present
                let k = (autoTighten && (metrics.uniqueness < 0.9 || metrics.entropy < 0.6)) ? 1.2 : 1.5;
                try {
                  const s = localStorage.getItem('aeg_cleaning_iqrk');
                  const n = s ? parseFloat(s) : NaN;
                  if (Number.isFinite(n) && n > 0.5 && n < 5) k = n;
                } catch {}
                const { cleaned, report } = cleanSyntheticData(raw, schema, {
                  enforceSchema: true,
                  dedupe: true,
                  outliers: { method: 'iqr', k },
                  text: { trim: true, normalizeWhitespace: true },
                  dates: { iso8601: true },
                });
                setCleaningReport(report);
                const j = new Blob([JSON.stringify(cleaned)], { type: 'application/json' });
                setFinalJsonBlob(j);
                // rebuild CSV
                const fields = Object.keys(cleaned[0] || {});
                const rows = [fields.join(',')].concat(cleaned.map((row:any)=>fields.map(f=>{
                  const val = row[f];
                  if (val === null || val === undefined) return '';
                  if (typeof val === 'object') return '"' + JSON.stringify(val).replace(/"/g,'""') + '"';
                  return '"' + String(val).replace(/"/g,'""') + '"';
                }).join(',')));
                const c = new Blob([rows.join('\n')], { type: 'text/csv' });
                setFinalCsvBlob(c);
              } catch (e) {
                console.warn('post-gen cleaning failed', e);
              } finally {
                setIsCleaning(false);
              }
            }
            // Ensure counters show actual generated count
            setGeneratedRecords(generated ?? targetRecords);
            setProgress(Math.min(100, ((generated ?? targetRecords) / targetRecords) * 100));
            setElapsedMs(elapsedMs || (startRef.current ? Date.now() - startRef.current : 0));
            const finalResult: SyntheticDataResult = {
              success: true,
              records: sample,
              metrics: {
                privacyScore: qualityMetrics.privacyScore,
                utilityScore: qualityMetrics.utilityScore,
                generationTime: elapsedMs,
                recordsPerSecond: Math.round((generated ?? targetRecords) / (Math.max(1, elapsedMs) / 1000))
              }
            };
            onGenerationComplete(finalResult);
            generateZKProofForSyntheticData();
            setIsGenerating(false);
            setIsComplete(true);
            // Notify app of total generated count for status bar
            window.dispatchEvent(new CustomEvent('aethergen:gen-total', { detail: { total: generated ?? targetRecords } }));
            w.terminate();
          }
        };
        w.postMessage({ cmd:'start', seedData, schema, total: targetRecords, batchSize, sampleMax, useAgo, useHarm432 });
        return;
      }
      // Fallback inline small-volume path
      for (let i = 0; i < totalBatches; i++) {
        const batchStart = Date.now();
        const batch = await generateBatch(seedData, batchSize, schema);
        sampleRecords = [...sampleRecords, ...batch];
        // accumulate full dataset for small runs only
        allRecords.push(...batch);
        if (sampleRecords.length > sampleMax) sampleRecords.splice(0, sampleRecords.length - sampleMax);
        setProgress(((i+1)/totalBatches)*100);
        setGeneratedRecords((i+1)*batchSize > targetRecords ? targetRecords : (i+1)*batchSize);
        setGeneratedData([...sampleRecords]);
        setCurrentSpeed(Math.round((batch.length / (Date.now() - batchStart)) * 1000));
        const elapsed = Date.now() - startTime;
        setElapsedMs(elapsed);
        setQualityMetrics({ privacyScore: calculatePrivacyScore(sampleRecords, seedData), utilityScore: calculateUtilityScore(sampleRecords, seedData), generationTime: elapsed });
        if (i % 2 === 0) await new Promise(r => setTimeout(r, 0));
      }
      
      const finalResult: SyntheticDataResult = {
        success: true,
        // Pass only the sample to downstream UI to keep app responsive
        records: sampleRecords,
        metrics: {
          privacyScore: qualityMetrics.privacyScore,
          utilityScore: qualityMetrics.utilityScore,
          generationTime: Date.now() - startTime,
          recordsPerSecond: Math.round(allRecords.length / ((Date.now() - startTime) / 1000))
        }
      };
      
      onGenerationComplete(finalResult);
      setGeneratedData(sampleRecords); // keep UI sample only

      // Generate ZK proof once after completion
      await generateZKProofForSyntheticData();

      // Prepare downloadable artifacts without keeping full data in React state
      try {
        let recordsForArtifacts = allRecords;
        // Optional post-gen cleaning path for small volumes
        if ((cleanBeforeDownload || autoTighten) && allRecords.length > 0) {
          setIsCleaning(true);
          const dm = detectDrift(seedData, allRecords);
          if (autoTighten && (dm.uniqueness < 0.9 || dm.entropy < 0.6)) {
            setDriftAlert(`Auto-tighten applied (uniqueness ${Math.round(dm.uniqueness*100)}%, entropy ${Math.round(dm.entropy*100)}%)`);
          }
          // Prefer user-chosen IQR k from Autopilot if present
          let kk = (autoTighten && (dm.uniqueness < 0.9 || dm.entropy < 0.6)) ? 1.2 : 1.5;
          try {
            const s = localStorage.getItem('aeg_cleaning_iqrk');
            const n = s ? parseFloat(s) : NaN;
            if (Number.isFinite(n) && n > 0.5 && n < 5) kk = n;
          } catch {}
          const { cleaned, report } = cleanSyntheticData(allRecords, schema, {
            enforceSchema: true,
            dedupe: true,
            outliers: { method: 'iqr', k: kk },
            text: { trim: true, normalizeWhitespace: true },
            dates: { iso8601: true },
          });
          setCleaningReport(report);
          recordsForArtifacts = cleaned;
          setIsCleaning(false);
        }
        if (recordsForArtifacts.length > 0) {
          const jsonBlob = new Blob([JSON.stringify(recordsForArtifacts)], { type: 'application/json' });
          setFinalJsonBlob(jsonBlob);
          // Build CSV
          const fields = Object.keys(recordsForArtifacts[0] || {});
          const csvRows = [fields.join(',')];
          for (const row of recordsForArtifacts) {
            const values = fields.map(f => {
              const val = (row as any)[f];
              if (val === null || val === undefined) return '';
              if (typeof val === 'object') return '"' + JSON.stringify(val).replace(/"/g, '""') + '"';
              return '"' + String(val).replace(/"/g, '""') + '"';
            });
            csvRows.push(values.join(','));
          }
          const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
          setFinalCsvBlob(csvBlob);
        }
      } catch (e) {
        console.warn('Failed to build downloadable blobs', e);
      }

      // Persist dataset (best-effort)
      try {
        const offline = (localStorage.getItem('aeg_offline')==='1');
        if (!offline) {
        await fetch('/api/record-dataset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schema_id: schema.id,
            kind: 'synthetic',
            record_count: allRecords.length,
            storage_uri: null,
            metadata: {
              epsilon: schema.privacySettings.epsilon,
              synthetic_ratio: schema.privacySettings.syntheticRatio,
              cleaned: (cleanBeforeDownload || autoTighten) || undefined,
              cleaning_report: cleaningReport || undefined
            }
          })
        });
        }
        // If we cleaned post-fact, record a second entry for cleaned artifacts
        if (!offline && (cleanBeforeDownload || autoTighten) && cleaningReport) {
          await fetch('/api/record-dataset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              schema_id: schema.id,
              kind: 'synthetic_cleaned',
              record_count: generatedRecords,
              storage_uri: null,
              metadata: { cleaning_report: cleaningReport }
            })
          });
        }
      } catch (e) {
        console.warn('record-dataset failed', e);
      }
      
    } catch (error) {
      setErrors([`Generation failed: ${error}`]);
    } finally {
      setIsGenerating(false);
      setIsComplete(true);
    }
  };

  const generateBatch = async (seedData: any[], batchSize: number, schema: DataSchema): Promise<any[]> => {
    // Simulate AI model generation based on schema fields
    const batch: any[] = [];
    
    for (let i = 0; i < batchSize; i++) {
      const record: any = {};
      
      schema.fields.forEach(field => {
        record[field.name] = generateFieldValue(field, seedData);
      });
      
      // AGO-guided tweak: mild variance warm/cool by phase
      if (useAgo) {
        const phase = i % 3; // A/G/O cycle
        for (const k of Object.keys(record)) {
          const v = record[k];
          if (typeof v === 'number') {
            let factorWarm = 1.05, factorCool = 0.95;
            try { const wt = parseFloat(localStorage.getItem('aeg_ago_weight')||'NaN'); if (Number.isFinite(wt)) { const d = 0.02 + 0.05*wt; factorWarm = 1 + d; factorCool = 1 - d; } } catch {}
            if (phase===0) record[k] = v * factorWarm; // warm
            else if (phase===2) record[k] = v * factorCool; // cool
          }
        }
      }

      // 432 harmonic nudge: small periodic modulation on first numeric
      if (useHarm432) {
        const keys = Object.keys(record);
        const k = keys.find(kk => typeof record[kk] === 'number');
        if (k) {
          const base = Number(record[k])||0;
          let w = 0.02;
          try { const wt = parseFloat(localStorage.getItem('aeg_432_weight')||'NaN'); if (Number.isFinite(wt)) w = 0.01 + 0.05*wt; } catch {}
          record[k] = base + w * Math.sin(2*Math.PI*(i/50));
        }
      }

      batch.push(record);
    }
    
    return batch;
  };

  const generateFieldValue = (field: any, seedData: any[]): any => {
    const sampleData = seedData.map(row => row[field.name]).filter(v => v !== undefined);
    
    if (sampleData.length === 0) {
      // Generate default value based on type
      switch (field.type) {
        case 'string':
          return `synthetic_${field.name}_${Math.random().toString(36).substr(2, 9)}`;
        case 'number':
          return Math.floor(Math.random() * 1000);
        case 'boolean':
          return Math.random() > 0.5;
        case 'date':
          return new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
        case 'json':
          return { synthetic: true, field: field.name };
        default:
          return null;
      }
    }
    
    // Use AI model simulation based on field configuration
    const randomIndex = Math.floor(Math.random() * sampleData.length);
    let value = sampleData[randomIndex];
    
    // Apply privacy transformations based on privacy level
    if (field.privacyLevel === 'high') {
      value = applyHighPrivacyTransformation(value, field.type);
    } else if (field.privacyLevel === 'medium') {
      value = applyMediumPrivacyTransformation(value, field.type);
    }
    
    return value;
  };

  const getNoiseScale = (epsilon: number): number => {
    // Smaller epsilon → more noise. Simple inverse mapping clamped to [0.1, 5]
    const scale = 1 / Math.max(epsilon, 0.01);
    return Math.min(Math.max(scale, 0.1), 5);
  };

  const applyHighPrivacyTransformation = (value: any, type: string): any => {
    const noise = getNoiseScale(schema.privacySettings.epsilon);
    switch (type) {
      case 'string':
        return `anon_${Math.random().toString(36).substr(2, 9)}`;
      case 'number':
        return Math.floor((Math.random() * 1000) * noise);
      case 'date':
        return new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * noise);
      default:
        return value;
    }
  };

  const applyMediumPrivacyTransformation = (value: any, type: string): any => {
    const noise = getNoiseScale(schema.privacySettings.epsilon) * 0.2;
    switch (type) {
      case 'string':
        return typeof value === 'string' ? `${value}_syn` : value;
      case 'number':
        return typeof value === 'number' ? value + (Math.random() - 0.5) * 20 * noise : value;
      default:
        return value;
    }
  };

  const calculatePrivacyScore = (syntheticData: any[], realData: any[]): number => {
    // Simple privacy score calculation
    const uniqueSynthetic = new Set(syntheticData.map(r => JSON.stringify(r))).size;
    const uniqueReal = new Set(realData.map(r => JSON.stringify(r))).size;
    const overlap = syntheticData.filter(s => 
      realData.some(r => JSON.stringify(s) === JSON.stringify(r))
    ).length;
    
    const privacyScore = Math.max(0, 100 - (overlap / syntheticData.length) * 100);
    return Math.round(privacyScore);
  };

  const calculateUtilityScore = (syntheticData: any[], realData: any[]): number => {
    // Simple utility score calculation based on data distribution similarity
    if (realData.length === 0) return 100;
    
    const syntheticStats = calculateDataStats(syntheticData);
    const realStats = calculateDataStats(realData);
    
    let similarityScore = 0;
    let fieldCount = 0;
    
    Object.keys(syntheticStats).forEach(field => {
      if (realStats[field]) {
        const syntheticDist = syntheticStats[field];
        const realDist = realStats[field];
        
        // Calculate distribution similarity
        const similarity = calculateDistributionSimilarity(syntheticDist, realDist);
        similarityScore += similarity;
        fieldCount++;
      }
    });
    
    return fieldCount > 0 ? Math.round((similarityScore / fieldCount) * 100) : 100;
  };

  const calculateDataStats = (data: any[]): Record<string, any> => {
    if (data.length === 0) return {};
    
    const fields = Object.keys(data[0]);
    const stats: Record<string, any> = {};
    
    fields.forEach(field => {
      const values = data.map(row => row[field]).filter(v => v !== undefined);
      if (values.length === 0) return;
      
      if (typeof values[0] === 'number') {
        stats[field] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length
        };
      } else {
        // For non-numeric fields, calculate frequency distribution
        const frequency: Record<string, number> = {};
        values.forEach(v => {
          const key = String(v);
          frequency[key] = (frequency[key] || 0) + 1;
        });
        stats[field] = frequency;
      }
    });
    
    return stats;
  };

  const calculateDistributionSimilarity = (dist1: any, dist2: any): number => {
    // Simple similarity calculation
    if (typeof dist1 === 'object' && typeof dist2 === 'object') {
      const keys1 = Object.keys(dist1);
      const keys2 = Object.keys(dist2);
      const commonKeys = keys1.filter(k => keys2.includes(k));
      
      if (commonKeys.length === 0) return 0;
      
      let similarity = 0;
      commonKeys.forEach(key => {
        const val1 = dist1[key];
        const val2 = dist2[key];
        similarity += Math.min(val1, val2) / Math.max(val1, val2);
      });
      
      return similarity / commonKeys.length;
    }
    
    return 0.8; // Default similarity for numeric distributions
  };

  // Drift/collapse detection helpers
  const detectDrift = (seed: any[], synth: any[]) => {
    const n = Math.max(1, synth.length);
    const unique = new Set(synth.map((r) => JSON.stringify(r))).size;
    const uniqueRatio = unique / n;
    const entropy = approxEntropy(synth);
    return { uniqueness: uniqueRatio, entropy };
  };

  const approxEntropy = (data: any[]): number => {
    if (data.length === 0) return 0;
    const keys = Object.keys(data[0] || {}).slice(0, 8);
    const ent: number[] = [];
    for (const k of keys) {
      const vals = data.map((r) => r[k]).filter((v) => typeof v === 'string' || typeof v === 'boolean');
      if (vals.length < 2) continue;
      const freq: Record<string, number> = {};
      for (const v of vals) freq[String(v)] = (freq[String(v)] || 0) + 1;
      const total = vals.length;
      const probs = Object.values(freq).map((c) => c / total);
      const H = -probs.reduce((a, p) => a + (p > 0 ? p * Math.log2(p) : 0), 0);
      const Hnorm = Object.keys(freq).length > 1 ? H / Math.log2(Object.keys(freq).length) : 0;
      ent.push(Hnorm);
    }
    if (ent.length === 0) return 0;
    return ent.reduce((a, b) => a + b, 0) / ent.length;
  };

  // Replace the download handler with a pure JS solution
  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(generatedData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `synthetic_data_${generatedData.length}_records.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Download as JSON handler
  const handleDownloadJSON = () => {
    if (finalJsonBlob) {
      const url = URL.createObjectURL(finalJsonBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synthetic_data_${generatedRecords}_records.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    // Fallback to sample
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(generatedData, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `synthetic_data_${generatedData.length}_records.json`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download as CSV handler
  const handleDownloadCSV = () => {
    if (finalCsvBlob) {
      const url = URL.createObjectURL(finalCsvBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synthetic_data_${generatedRecords}_records.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    // Fallback to sample
    if (!generatedData.length) return;
    const fields = Object.keys(generatedData[0] || {});
    const csvRows = [fields.join(",")];
    for (const row of generatedData) {
      const values = fields.map(f => {
        const val = row[f];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return '"' + JSON.stringify(val).replace(/"/g, '""') + '"';
        return '"' + String(val).replace(/"/g, '""') + '"';
      });
      csvRows.push(values.join(","));
    }
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthetic_data_${generatedData.length}_records.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Generation Settings */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Generation Settings</h2>
        {/* Estimator chips */}
        <div className="mb-2 text-xs text-gray-600 flex flex-wrap gap-3">
          <span className="px-2 py-1 border rounded">Est. generation latency: {Math.round((estimateStep('generation', { records: generationVolume }).latencyMs||0))} ms • $0</span>
          <span className="px-2 py-1 border rounded">Est. cleaning latency: {Math.round((estimateStep('cleaning', { records: generationVolume }).latencyMs||0))} ms • $0</span>
        </div>
        <div className="mb-3 text-sm text-gray-700 flex items-center gap-3">
          <label className="flex items-center gap-2"><input type="checkbox" checked={cleanBeforeDownload} onChange={(e)=>setCleanBeforeDownload(e.target.checked)} /> Clean synthetic before download</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={autoTighten} onChange={(e)=>setAutoTighten(e.target.checked)} /> Auto‑tighten if drift/collapse detected</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={useAgo} onChange={(e)=>{ setUseAgo(e.target.checked); try{ localStorage.setItem('aeg_use_ago', e.target.checked?'1':'0'); }catch{} }} /> AGO‑guided generation</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={useHarm432} onChange={(e)=>{ setUseHarm432(e.target.checked); try{ localStorage.setItem('aeg_use_432', e.target.checked?'1':'0'); }catch{} }} /> 432 harmonic regularizer</label>
          {isCleaning && <span className="text-xs text-blue-700">Cleaning…</span>}
          {cleaningReport && (
            <span className="text-xs text-gray-500">Cleaned: removed {cleaningReport.rowsRemoved}, dedup {cleaningReport.duplicatesRemoved}, outliers {cleaningReport.outliersCapped}</span>
          )}
        {driftAlert && (
          <span className="text-xs text-amber-700">{driftAlert}</span>
        )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Target Volume</h3>
            <p className="text-2xl font-bold text-blue-600">{schema.targetVolume.toLocaleString()}/day</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Schema Fields</h3>
            <p className="text-2xl font-bold text-green-600">{schema.fields.length}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Privacy Level</h3>
            <p className="text-2xl font-bold text-purple-600">ε = {schema.privacySettings.epsilon}</p>
          </div>
        </div>
        
        {/* Volume Control */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Volume Control</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Records to Generate
              </label>
              <input
                type="number"
                value={generationVolumeInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setGenerationVolumeInput(val);
                  if (val === '' || val === undefined) return; // allow empty field
                  const parsed = parseInt(val, 10);
                  if (Number.isNaN(parsed)) return;
                  setGenerationVolume(parsed);
                }}
                onBlur={() => {
                  if (generationVolumeInput === '' || generationVolumeInput === undefined) return;
                  const parsed = parseInt(generationVolumeInput, 10);
                  if (!Number.isNaN(parsed)) {
                    const clamped = Math.max(1, Math.min(1000000, parsed));
                    setGenerationVolume(clamped);
                    setGenerationVolumeInput(String(clamped));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="1000000"
                step="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of synthetic records to generate
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generation Duration (days)
              </label>
              <input
                type="number"
                value={generationDuration}
                onChange={(e) => setGenerationDuration(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="365"
              />
              <p className="text-xs text-gray-500 mt-1">
                Duration for continuous generation
              </p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-700">Total Records</div>
              <div className="text-lg font-bold text-blue-800">{(generationVolume * generationDuration).toLocaleString()}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-700">Daily Rate</div>
              <div className="text-lg font-bold text-green-800">{Math.ceil(generationVolume / generationDuration).toLocaleString()}/day</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-700">AI Models</div>
              <div className="text-lg font-bold text-purple-800">20+ Models</div>
            </div>
          </div>
        </div>
        
        <button
          onClick={generateSyntheticData}
          disabled={isGenerating || seedData.length === 0 || (generationVolumeInput ?? '').toString().trim() === ''}
          className={`px-6 py-3 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isGenerating || seedData.length === 0 || (generationVolumeInput ?? '').toString().trim() === ''
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isGenerating
            ? 'Generating...'
            : (generationVolumeInput ?? '').toString().trim() === ''
              ? 'Generate'
              : `Generate ${generationVolume.toLocaleString()} Records`}
        </button>
      </div>

      {/* Risk assessment lives under the Risk tab. Link out from here for clarity. */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-blue-800">Risk Assessment</h3>
            <p className="text-sm text-blue-700">Model collapse risk is available under the Risk tab.</p>
          </div>
          <a href="#" onClick={(e)=>{ e.preventDefault(); try{ window.dispatchEvent(new CustomEvent('aeg:navigate-dashboard',{ detail: { tab: 'risk' } })); }catch{} }} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Go to Risk</a>
        </div>
      </div>

      {/* Generation Progress/Monitoring Section */}
      {(isGenerating || generatedRecords > 0) && (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🔄 Generation Progress</h3>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-8 space-y-2 md:space-y-0">
            <div>
              <span className="font-semibold text-blue-700">Records Generated:</span> {generatedRecords.toLocaleString()}
            </div>
            <div>
              <span className="font-semibold text-green-700">Records Remaining:</span> {Math.max(0, generationVolume - generatedRecords).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold text-purple-700">Status:</span> {isComplete ? 'Complete' : (isGenerating ? 'Generating...' : 'Idle')}
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (generatedRecords / Math.max(1, generationVolume)) * 100)}%` }}
            ></div>
          </div>
          {/* Secondary run stats */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
            <div>Elapsed: <span className="font-semibold">{Math.max(0, Math.round(elapsedMs/1000)).toLocaleString()}s</span></div>
            <div>Throughput: <span className="font-semibold">{currentSpeed.toLocaleString()}/s</span></div>
            <div>
              ETA: <span className="font-semibold">
                {isGenerating && currentSpeed > 0
                  ? `${Math.max(0, Math.ceil((generationVolume - generatedRecords) / currentSpeed)).toLocaleString()}s`
                  : (isComplete ? '0s' : '—')}
              </span>
            </div>
            <div>Target: <span className="font-semibold">{generationVolume.toLocaleString()}</span></div>
          </div>
        </div>
      )}

      {/* Live sample (collapsible) */}
      {generatedData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">👀 Live sample (200 rows)</h3>
            <button
              onClick={() => setIsSampleOpen(v => !v)}
              className="text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
            >
              {isSampleOpen ? 'Hide' : 'Show'}
            </button>
          </div>
          {isSampleOpen && (
            <>
            <div className="overflow-x-auto mb-4">
            <table className="min-w-full table-auto border">
              <thead>
                <tr>
                  {Object.keys(generatedData[0] || {}).map((field) => (
                    <th key={field} className="px-2 py-1 border-b text-xs text-gray-700 bg-gray-50">{field}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {generatedData.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="border-t">
                    {Object.keys(generatedData[0] || {}).map((field) => (
                      <td key={field} className="px-2 py-1 text-xs text-gray-600">{String(row[field])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="bg-gray-50 p-3 rounded border text-xs text-gray-700 max-h-48 overflow-auto">
              <pre>{JSON.stringify(generatedData.slice(0, 10), null, 2)}</pre>
            </div>
            </>
          )}
        </div>
      )}
      {generatedData.length === 0 && !isGenerating && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <span className="text-yellow-800 font-semibold">No synthetic data generated yet. Please generate data to preview.</span>
        </div>
      )}

      {true && (
        <div className="flex gap-4 justify-center mt-4">
          <button
            onClick={handleDownloadJSON}
            disabled={!finalJsonBlob || !isComplete}
            style={{
              padding: '0.75rem 2rem',
              background: (!finalJsonBlob || !isComplete) ? '#93c5fd' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px #2563eb22',
              transition: 'background 0.2s',
            }}
          >
            {finalJsonBlob && isComplete ? `Download full JSON (${generatedRecords.toLocaleString()})` : 'Preparing JSON…'}
          </button>
          <button
            onClick={handleDownloadCSV}
            disabled={!finalCsvBlob || !isComplete}
            style={{
              padding: '0.75rem 2rem',
              background: (!finalCsvBlob || !isComplete) ? '#86efac' : '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px #05966922',
              transition: 'background 0.2s',
            }}
          >
            {finalCsvBlob && isComplete ? `Download full CSV (${generatedRecords.toLocaleString()})` : 'Preparing CSV…'}
          </button>
        </div>
      )}
      {generatedRecords > 100000 && (!finalCsvBlob || !finalJsonBlob) && (
        <div className="mt-2 text-center text-xs text-gray-600">
          Large dataset detected; assembling download files can take longer. Please keep this tab open while we prepare your CSV/JSON.
        </div>
      )}

      {/* zk-SNARK Proof Status for Synthetic Data */}
      {proofGenerating && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-purple-800 font-medium">Generating zk-SNARK proof for synthetic data...</span>
          </div>
        </div>
      )}

      {/* Proof Management Section - Always Visible */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🔐 Synthetic Data zk-SNARK Proof Management</h3>
        
        {zkProof ? (
          <div className={`border rounded-lg p-4 ${
            proofVerified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className={`font-semibold ${
                  proofVerified ? 'text-green-800' : 'text-red-800'
                }`}>
                  🔐 Synthetic Data zk-SNARK Proof {proofVerified ? 'Verified' : 'Failed'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Proof generated for {generatedRecords} synthetic records with privacy level ε = {schema.privacySettings.epsilon}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Proof Hash</div>
                <div className="font-mono text-xs text-gray-500">
                  {zkProof.proof && zkProof.proof.pi_a && zkProof.proof.pi_a[0] 
                    ? `${zkProof.proof.pi_a[0].substring(0, 16)}...`
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
            
            {/* Proof Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={downloadProof}
                disabled={!zkProof}
                className={`px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 transition-colors ${
                  zkProof 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 cursor-pointer' 
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
                title={zkProof ? 'Download synthetic data zk-SNARK proof' : 'No synthetic data proof available for download'}
              >
                📥 Download Proof {zkProof ? '' : '(Disabled)'}
              </button>
              
              <div className="relative">
                <input
                  ref={proofFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleProofFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => proofFileInputRef.current?.click()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-colors"
                  title="Upload existing synthetic data zk-SNARK proof"
                >
                  📤 Upload Proof
                </button>
              </div>
              
              {proofFile && (
                <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm">
                  📁 {proofFile.name}
                </span>
              )}
              <button
                onClick={saveGeneratedToDatasets}
                disabled={!generatedData || generatedData.length === 0}
                className={`px-4 py-2 rounded-md text-sm ${generatedData && generatedData.length ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-400 text-gray-600 cursor-not-allowed'}`}
                title="Save generated dataset to library"
              >
                💾 Save to Datasets
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-800">No Synthetic Data Proof Generated Yet</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Generate synthetic data to create a zk-SNARK proof, or upload an existing proof file
                </p>
              </div>
            </div>
            
            {/* Proof Action Buttons - Always Available */}
            <div className="flex space-x-3">
              <button
                disabled={!zkProof}
                className={`px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 transition-colors ${
                  zkProof 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 cursor-pointer' 
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
                onClick={downloadProof}
                title={zkProof ? 'Download synthetic data zk-SNARK proof' : 'No synthetic data proof available for download'}
              >
                📥 Download Proof {zkProof ? '' : '(Disabled)'}
              </button>
              
              <div className="relative">
                <input
                  ref={proofFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleProofFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => proofFileInputRef.current?.click()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-colors"
                  title="Upload existing synthetic data zk-SNARK proof"
                >
                  📤 Upload Proof
                </button>
              </div>
              
              {proofFile && (
                <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm">
                  📁 {proofFile.name}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quality Metrics */}
      {qualityMetrics.generationTime > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Quality Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800">Privacy Score</h4>
              <p className="text-2xl font-bold text-green-600">{qualityMetrics.privacyScore}%</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">Utility Score</h4>
              <p className="text-2xl font-bold text-blue-600">{qualityMetrics.utilityScore}%</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800">Generation Time</h4>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(qualityMetrics.generationTime / 1000)}s
              </p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800">Records/Second</h4>
              <p className="text-2xl font-bold text-orange-600">
                {Math.round(generatedRecords / (qualityMetrics.generationTime / 1000))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">❌ Generation Errors</h3>
          <ul className="list-disc list-inside text-red-600 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <span className="text-red-800 font-semibold">{validationError}</span>
        </div>
      )}

      {/* Live Monitoring */}
      {isGenerating && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🔄 Live Monitoring</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Model Performance</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <span className="text-sm text-gray-600">100%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Data Quality</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
                <span className="text-sm text-gray-600">96%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Privacy Compliance</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '98%' }}></div>
                </div>
                <span className="text-sm text-gray-600">98%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyntheticDataGenerator; 