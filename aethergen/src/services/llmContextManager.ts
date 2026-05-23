export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

// Read provider context cap from env or default to 8192
export function getContextCap(): number {
  const raw = (import.meta as any)?.env?.VITE_PROVIDER_CONTEXT_CAP;
  const n = raw ? parseInt(String(raw), 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 8192;
}

// Very rough token estimator (OpenAI-ish): ~4 chars per token
export function approxTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function approxMessagesTokens(messages: ChatMessage[]): number {
  let total = 0;
  for (const m of messages) total += approxTokenCount(m.content) + 6; // small role/format overhead
  // reply priming
  return total + 10;
}

// Trim/summarize to fit provider cap
export function trimHistoryToCap(
  messages: ChatMessage[],
  requestedMaxTokens: number,
  cap: number = getContextCap()
): { messages: ChatMessage[]; max_tokens: number } {
  // Clamp output tokens
  const max_tokens = Math.max(1, Math.min(requestedMaxTokens, Math.floor(cap / 4)));
  let working = [...messages];
  // Keep system messages at the very start
  const systemMsgs = working.filter(m => m.role === 'system');
  let rest = working.filter(m => m.role !== 'system');

  const fits = () => approxMessagesTokens([...systemMsgs, ...rest]) + max_tokens <= cap;
  if (fits()) return { messages: [...systemMsgs, ...rest], max_tokens };

  // First pass: drop oldest non-system turns until we fit or we reach a minimum recent context
  const minRecentTurns = 6; // keep last N messages minimum
  while (!fits() && rest.length > minRecentTurns) {
    rest.shift();
  }

  if (fits()) return { messages: [...systemMsgs, ...rest], max_tokens };

  // Second pass: summarize the dropped portion into a compact system note
  const droppedCount = Math.max(0, messages.length - systemMsgs.length - rest.length);
  const droppedText = messages
    .slice(systemMsgs.length, systemMsgs.length + droppedCount)
    .map(m => `[${m.role}] ${m.content}`)
    .join('\n');
  const summary = compactSummary(droppedText, 1200); // ~300 tokens
  const summaryMsg: ChatMessage = {
    role: 'system',
    content: `Summary of earlier context (${droppedCount} turns removed):\n${summary}`,
  };
  working = [summaryMsg, ...rest];
  // If we still don't fit, truncate the summary further
  while (!fits() && summaryMsg.content.length > 400) {
    summaryMsg.content = compactSummary(summaryMsg.content, Math.floor(summaryMsg.content.length * 0.7));
  }
  return { messages: working, max_tokens };
}

export function prepareChatRequest(
  model: string,
  messages: ChatMessage[],
  requestedMaxTokens: number,
  cap?: number
): { model: string; messages: ChatMessage[]; max_tokens: number } {
  const { messages: trimmed, max_tokens } = trimHistoryToCap(messages, requestedMaxTokens, cap);
  return { model, messages: trimmed, max_tokens };
}

function compactSummary(text: string, maxChars: number): string {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  const head = text.slice(0, Math.floor(maxChars * 0.6));
  const tail = text.slice(-Math.floor(maxChars * 0.35));
  return `${head}\n...\n${tail}`;
}


