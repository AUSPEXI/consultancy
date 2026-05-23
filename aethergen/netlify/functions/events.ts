import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'access-control-allow-origin': '*'
    },
    // Minimal stream: fact update + example mention-drop alert
    body: `event: fact-update\n` +
          `data: {"fact": "Facts updated", "timestamp": "${new Date().toISOString()}"}\n\n` +
          `event: mention-drop\n` +
          `data: {"prompt": "Best synthetic data tools", "action": "Publish a short explainer with bullet points"}\n\n` +
          `event: visibility-score\n` +
          `data: {"visibilityScore": 73}\n\n` +
          `event: content-gap\n` +
          `data: {"prompt": "Compare synthetic data platforms", "competitor": "Y", "action": "Create comparative blog post"}\n\n`
  };
};


