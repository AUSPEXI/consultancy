#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.resolve(process.cwd(), 'public', 'blog-html', 'dataset-and-model-cards-that-buyers-actually-use.html');
if (!fs.existsSync(target)) {
  console.error('Target file not found:', target);
  process.exit(1);
}
let html = fs.readFileSync(target, 'utf8');

// 1) Remove remaining explicit date sentence variants
html = html.replace(/This system is fully operational as of [A-Za-z]+\s+\d{1,2},\s+\d{4}\./g, 'This system is fully operational.');

// 2) Insert Quick Start + End-to-End Example after Executive Summary paragraph
const execSumPattern = /(<h2>Executive Summary<\/h2>\s*<p>[^<]*?<\/p>)/;
if (execSumPattern.test(html)) {
  const insert = `
  <h2>Quick Start<\/h2>
  <ol>
    <li>Run evidence at target operating point (e.g., <strong>fpr=0.01<\/strong>) and export metrics + plots.<\/li>
    <li>Fill the card fields from templates (purpose, schema, utility@OP with CIs, stability, limits).<\/li>
    <li>Publish assets to Unity Catalog (catalog.schema.table) and attach a short comment with card excerpt.<\/li>
    <li>Bundle evidence (metrics, plots, seeds, hashes) and link from the card.<\/li>
    <li>QA check against the internal checklist; ship to buyers/Marketplace.<\/li>
  <\/ol>

  <h2>End‑to‑End Example (Dataset + Model)<\/h2>
  <p><strong>Dataset<\/strong>: prod.ai.claims (Delta)<\/p>
  <ul>
    <li>Purpose: fraud triage prototyping<\/li>
    <li>Schema: claims, line_item, provider*<\/li>
    <li>Evidence (links): <a href=\"metrics/utility@op.json\">metrics/utility@op.json<\/a>, <a href=\"plots/roc_pr.html\">plots/roc_pr.html<\/a><\/li>
  <\/ul>
  <p><strong>Model<\/strong>: prod.ai.claims_fraud_udf<\/p>
  <ul>
    <li>Operating point: <strong>fpr=0.01<\/strong>; threshold <strong>0.42<\/strong><\/li>
    <li>Utility@OP: <strong>+0.18 lift<\/strong> (CI [0.161, 0.202])<\/li>
    <li>Stability: max segment delta ≤ 0.028<\/li>
  <\/ul>
  <p><strong>Unity Catalog comment (illustrative)<\/strong>:<\/p>
  <pre>
COMMENT ON TABLE prod.ai.claims IS 'Purpose: fraud triage; Evidence: utility@op fpr=1%, lift=0.18 (CI [0.161,0.202]); Stability: max_delta≤0.028; See metrics/utility@op.json';
  <\/pre>`;
  html = html.replace(execSumPattern, `$1 ${insert}`);
}

// 3) Link evidence snippet filenames if present
html = html.replace(
  /These snippets prove performance\.\s*<strong>metrics\/utility@op\.json: /,
  'These snippets prove performance. <strong><a href="metrics/utility@op.json">metrics/utility@op.json</a>: '
);
html = html.replace(
  /<strong>metrics\/stability_by_segment\.json: /,
  '<strong><a href="metrics/stability_by_segment.json">metrics/stability_by_segment.json</a>: '
);

fs.writeFileSync(target, html, 'utf8');
console.log('Updated:', target);


