export function heuristicRewrite(text: string): string {
  // Simple: expand or compress toward ~30-60 words
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 60) return words.slice(0, 60).join(' ');
  if (words.length < 30) {
    const pad = Array.from({ length: Math.max(0, 30 - words.length) }, (_, i) => `detail${i+1}`);
    return words.concat(pad).join(' ');
  }
  return text;
}

export function heuristicUnravel(text: string): string {
  // Extract core: keep first sentence per line, strip adjectives crudely
  const lines = text.split(/\n+/);
  return lines.map(l => {
    const sent = l.split(/[.!?]/)[0];
    return sent.replace(/\b(very|really|quite|extremely|highly|deeply)\b/gi, '').trim();
  }).join('\n');
}

export function heuristicRenest(text: string, lines = 5): string {
  const tokens = text.split(/\s+/).filter(Boolean);
  const per = Math.ceil(tokens.length / Math.max(1, lines));
  const out: string[] = [];
  for (let i = 0; i < lines; i++) {
    const seg = tokens.slice(i * per, (i + 1) * per).join(' ');
    if (seg) out.push(seg);
  }
  return out.join('\n');
}


