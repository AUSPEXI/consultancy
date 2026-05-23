import React, { useMemo, useState } from 'react';

type ReviewRow = {
  id: string;
  question: string;
  answer: string;
  citations: string;
  reviewer: string;
  email: string;
  dt: string;
  relevant: string;
  citation_match: string;
  faithful: string;
  clear_safe: string;
  score: string;
  notes: string;
  final_label?: string;
};

function parseCsv(text: string): ReviewRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length);
  if (lines.length === 0) return [];
  const header = lines[0];
  const cols = header.split(',').map(s => s.trim());
  const rows: ReviewRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        // toggle quotes or escape
        if (inQuotes && line[j + 1] === '"') {
          cur += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    const obj: any = {};
    cols.forEach((c, idx) => { obj[c] = (fields[idx] || '').trim(); });
    rows.push(obj as ReviewRow);
  }
  return rows;
}

function pct(n: number, d: number): string {
  if (!d) return '—';
  return `${Math.round((n / d) * 100)}%`;
}

const ReviewTab: React.FC = () => {
  const [rows, setRows] = useState<ReviewRow[]>([]);

  const metrics = useMemo(() => {
    const total = rows.length;
    const yes = (k: keyof ReviewRow) => rows.filter(r => (r[k] || '').toString().toLowerCase().startsWith('y')).length;
    const rel = yes('relevant');
    const cit = yes('citation_match');
    const fai = yes('faithful');
    const cls = yes('clear_safe');
    const scores = rows.map(r => Number(r.score)).filter(n => !Number.isNaN(n));
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const agreement = (() => {
      const byId: Record<string, Set<string>> = {};
      for (const r of rows) {
        const key = r.id;
        if (!byId[key]) byId[key] = new Set();
        if (r.final_label) byId[key].add(r.final_label);
      }
      const decided = Object.values(byId).filter(s => s.size > 0).length;
      return { decided };
    })();
    return { total, rel, cit, fai, cls, avg, agreement };
  }, [rows]);

  function handleFile(file: File) {
    const fr = new FileReader();
    fr.onload = () => {
      const text = (fr.result || '').toString();
      setRows(parseCsv(text));
    };
    fr.readAsText(file);
  }

  function exportHtml() {
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>QA Review Summary</title>
      <style>body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;padding:24px;color:#111827}
      h1{font-size:20px;margin:0 0 8px} table{border-collapse:collapse;width:100%;margin-top:12px}
      td,th{border:1px solid #e5e7eb;padding:6px 8px;font-size:12px;text-align:left}
      .muted{color:#6b7280;font-size:12px}</style></head><body>
      <h1>QA Review Summary</h1>
      <div class="muted">Generated ${new Date().toISOString()}</div>
      <p>Total: ${metrics.total} • Relevant: ${metrics.rel} (${pct(metrics.rel, metrics.total)}) • Citation match: ${metrics.cit} (${pct(metrics.cit, metrics.total)}) • Faithful: ${metrics.fai} (${pct(metrics.fai, metrics.total)}) • Clear/safe: ${metrics.cls} (${pct(metrics.cls, metrics.total)}) • Avg score: ${metrics.avg.toFixed(2)}</p>
      <table><thead><tr><th>id</th><th>question</th><th>relevant</th><th>citation_match</th><th>faithful</th><th>clear_safe</th><th>score</th><th>final_label</th></tr></thead>
      <tbody>${rows.slice(0, 200).map(r => `<tr><td>${r.id}</td><td>${(r.question||'').slice(0,80)}</td><td>${r.relevant}</td><td>${r.citation_match}</td><td>${r.faithful}</td><td>${r.clear_safe}</td><td>${r.score}</td><td>${r.final_label||''}</td></tr>`).join('')}</tbody></table>
      </body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'qa_review_summary.html';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>QA Review Summary (PDF)</title>
      <style>@page{margin:12mm} body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;padding:0 4mm;color:#111827}
      h1{font-size:18px;margin:0 0 6px} table{border-collapse:collapse;width:100%;margin-top:8px}
      td,th{border:1px solid #e5e7eb;padding:4px 6px;font-size:11px;text-align:left}
      .muted{color:#6b7280;font-size:11px}</style></head><body>
      <h1>QA Review Summary</h1>
      <div class="muted">Generated ${new Date().toISOString()}</div>
      <p>Total: ${metrics.total} • Relevant: ${metrics.rel} (${pct(metrics.rel, metrics.total)}) • Citation match: ${metrics.cit} (${pct(metrics.cit, metrics.total)}) • Faithfulness: ${metrics.fai} (${pct(metrics.fai, metrics.total)}) • Clear/safe: ${metrics.cls} (${pct(metrics.cls, metrics.total)}) • Avg score: ${metrics.avg.toFixed(2)}</p>
      <table><thead><tr><th>id</th><th>question</th><th>relevant</th><th>citation_match</th><th>faithful</th><th>clear_safe</th><th>score</th><th>final_label</th></tr></thead>
      <tbody>${rows.slice(0, 500).map(r => `<tr><td>${r.id}</td><td>${(r.question||'').slice(0,80)}</td><td>${r.relevant}</td><td>${r.citation_match}</td><td>${r.faithful}</td><td>${r.clear_safe}</td><td>${r.score}</td><td>${r.final_label||''}</td></tr>`).join('')}</tbody></table>
      <script>window.onload=function(){setTimeout(function(){window.print()},150)}</script>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Load QA CSV</h3>
        <p className="text-gray-700 mb-4">Use the template at <code>docs/templates/qa_review_template.csv</code>.</p>
        <input type="file" accept=".csv,text/csv" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {rows.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded">Total<br/><strong>{metrics.total}</strong></div>
            <div className="p-3 bg-gray-50 rounded">Relevant<br/><strong>{metrics.rel}</strong> <span className="text-gray-600">({pct(metrics.rel, metrics.total)})</span></div>
            <div className="p-3 bg-gray-50 rounded">Citation match<br/><strong>{metrics.cit}</strong> <span className="text-gray-600">({pct(metrics.cit, metrics.total)})</span></div>
            <div className="p-3 bg-gray-50 rounded">Faithful<br/><strong>{metrics.fai}</strong> <span className="text-gray-600">({pct(metrics.fai, metrics.total)})</span></div>
            <div className="p-3 bg-gray-50 rounded">Clear/safe<br/><strong>{metrics.cls}</strong> <span className="text-gray-600">({pct(metrics.cls, metrics.total)})</span></div>
            <div className="p-3 bg-gray-50 rounded">Avg score<br/><strong>{metrics.avg.toFixed(2)}</strong></div>
          </div>
          <div className="mt-4">
            <button onClick={exportHtml} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Export HTML report</button>
            <button onClick={exportPdf} className="ml-3 px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Print to PDF</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewTab;


