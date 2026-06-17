#!/usr/bin/env node
/**
 * GEO Lab — Report Email Sender
 *
 * Emails Gwylym a "ready to film" digest with the full video package embedded.
 * Uses the same Gmail app-password pattern as consultancy-next/api/cron/daily-autopilot.
 *
 * Usage:
 *   node send-report.mjs <experiment-dir>
 *
 * Env: EMAIL_USER, EMAIL_APP_PASSWORD, REPORT_EMAIL (defaults to EMAIL_USER)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import nodemailer from 'nodemailer';

const __dir = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dir, '.env') });

const experimentDir = process.argv[2];
if (!experimentDir) {
  console.error('Usage: node send-report.mjs <experiment-dir>');
  process.exit(1);
}

const user = (process.env.EMAIL_USER || '').trim();
const pass = (process.env.EMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const toEmail = (process.env.REPORT_EMAIL || user).trim();
console.log(`[send-report] Gmail auth as "${user}" (app-password length after stripping spaces: ${pass.length}; a valid Gmail app password is 16)`);

if (!user || !pass) {
  console.error('EMAIL_USER and EMAIL_APP_PASSWORD must be set');
  process.exit(1);
}

// Load experiment files
async function readFileSafe(p) {
  return fs.readFile(p, 'utf8').catch(() => '');
}

const [finding, design, shortsHook, contentCalendar, script, titles, thumbnail, description] = await Promise.all([
  readFileSafe(path.join(experimentDir, 'FINDING.md')),
  readFileSafe(path.join(experimentDir, 'DESIGN.md')),
  readFileSafe(path.join(experimentDir, 'video', 'shorts-hook.md')),
  readFileSafe(path.join(experimentDir, 'video', 'content-calendar.md')),
  readFileSafe(path.join(experimentDir, 'video', 'script.md')),
  readFileSafe(path.join(experimentDir, 'video', 'titles.md')),
  readFileSafe(path.join(experimentDir, 'video', 'thumbnail.md')),
  readFileSafe(path.join(experimentDir, 'video', 'description.md')),
]);

// Parse experiment ID from directory name (e.g. "001-statistical-anchors")
const expId = path.basename(experimentDir).split('-')[0] || '???';
const expSlug = path.basename(experimentDir);

// Extract headline stat from FINDING.md
function extractHeadlineStat(findingText) {
  const sigMatch = findingText.match(/\*\*([^*]+)\*\* vs \*\*([^*]+)\*\*[^:]*:\s*([^,\n]+)/);
  if (sigMatch) return sigMatch[3].trim();
  const nullMatch = findingText.match(/No significant effects found/i);
  if (nullMatch) return 'No significant effect found (valid null result)';
  return 'See FINDING.md for full results';
}

function extractTopTitle(titlesText) {
  const lines = titlesText.split('\n').filter(l => l.trim().startsWith('1.') || l.trim().match(/^1\s/));
  if (lines.length > 0) return lines[0].replace(/^1[.\s]+/, '').split('—')[0].trim();
  return titlesText.split('\n').find(l => l.trim())?.trim() ?? 'See titles.md';
}

const headlineStat = extractHeadlineStat(finding);
const topTitle = extractTopTitle(titles);
const date = new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' });

// Markdown → minimal HTML (same light transformer as daily-autopilot)
function mdToHtml(text) {
  return text.split('\n').map(line => {
    if (line.startsWith('# '))  return `<h1 style="font-size:20px;font-weight:700;color:#fff;margin:18px 0 6px">${line.slice(2)}</h1>`;
    if (line.startsWith('## ')) return `<h2 style="font-size:16px;font-weight:600;color:#e4e4e7;margin:14px 0 5px">${line.slice(3)}</h2>`;
    if (line.startsWith('### ')) return `<h3 style="font-size:14px;font-weight:600;color:#d4d4d8;margin:12px 0 4px">${line.slice(4)}</h3>`;
    if (line.startsWith('| '))  return `<p style="color:#a1a1aa;font-family:monospace;font-size:12px;margin:2px 0">${line}</p>`;
    if (line.startsWith('- ') || line.startsWith('* ')) return `<li style="color:#d4d4d8;margin:3px 0;padding-left:4px">${line.slice(2)}</li>`;
    if (line.startsWith('**') && line.endsWith('**')) return `<p style="color:#fff;font-weight:600;margin:6px 0">${line.replace(/\*\*/g, '')}</p>`;
    if (line.trim() === '') return '<br/>';
    return `<p style="color:#d4d4d8;margin:4px 0;line-height:1.6;font-size:13px">${line}</p>`;
  }).join('');
}

function section(label, content) {
  if (!content.trim()) return '';
  return `
    <div style="margin:20px 0;border:1px solid #27272a;border-radius:8px;overflow:hidden">
      <div style="padding:10px 16px;background:#18181b;border-bottom:1px solid #27272a">
        <p style="margin:0;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.08em">${label}</p>
      </div>
      <div style="padding:16px 20px;background:#0d0d10">${mdToHtml(content)}</div>
    </div>`;
}

const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:700px;margin:0 auto;background:#09090b;color:#fafafa;border-radius:10px;border:1px solid #27272a">

  <!-- Header -->
  <div style="padding:24px 32px;border-bottom:1px solid #27272a;background:linear-gradient(135deg,#09090b 0%,#111116 100%)">
    <p style="margin:0 0 4px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:.1em">GEO Lab · Experiment ${expId} · ${date}</p>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff">🎬 Ready to Film</h1>
    <p style="margin:0;font-size:16px;font-weight:600;color:#a78bfa">${topTitle || expSlug}</p>
  </div>

  <!-- Headline stat -->
  <div style="padding:20px 32px;background:#0f0f14;border-bottom:1px solid #27272a">
    <p style="margin:0 0 4px;font-size:11px;color:#71717a;text-transform:uppercase">Key finding</p>
    <p style="margin:0;font-size:18px;font-weight:700;color:#4ade80">${headlineStat}</p>
  </div>

  <!-- Body -->
  <div style="padding:20px 32px">
    ${section('Statistical Finding', finding)}
    ${section('📅 Content Calendar (this week)', contentCalendar)}
    ${section('⚡ Shorts Hook Script (45–60s)', shortsHook)}
    ${section('Title Options', titles)}
    ${section('Thumbnail Brief', thumbnail)}
    ${section('Video Description', description)}
    ${section('Long-Form Script', script)}
  </div>

  <!-- Footer -->
  <div style="padding:16px 32px;border-top:1px solid #27272a;background:#0d0d10">
    <p style="margin:0;font-size:12px;color:#52525b">
      Full experiment: <code style="color:#a1a1aa">${expSlug}/</code> — commit to git = pre-registration record ·
      <a href="https://l8entspace.com" style="color:#a78bfa;text-decoration:none">l8entspace.com</a>
    </p>
  </div>
</div>`;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass },
});

await transporter.sendMail({
  from: `"GEO Lab" <${user}>`,
  to: toEmail,
  subject: `GEO Lab #${expId} ready to film — ${topTitle || expSlug}`,
  html,
});

console.log(`Report emailed to ${toEmail}`);
