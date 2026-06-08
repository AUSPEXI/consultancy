const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('FATAL: GEMINI_API_KEY or VITE_GEMINI_API_KEY must be set');
  process.exit(1);
}

app.use(cors({
  origin: [
    'https://l8entspace.com',
    'https://www.l8entspace.com',
    /\.l8entspace\.com$/,
    // allow localhost for dev
    /^http:\/\/localhost(:\d+)?$/,
  ],
  credentials: true,
}));

app.get('/health', (req, res) => res.json({ ok: true }));

// HTTP proxy for regular Gemini REST calls
const httpProxy = createProxyMiddleware({
  target: 'https://generativelanguage.googleapis.com',
  changeOrigin: true,
  pathRewrite: (path) => {
    let newPath = path.replace('/api/genai', '');
    newPath = newPath.replace(/([?&])key=[^&]*/g, '$1').replace(/&$/, '').replace(/\?$/, '');
    newPath += (newPath.includes('?') ? '&' : '?') + `key=${GEMINI_API_KEY}`;
    return newPath;
  },
});

// WebSocket proxy for Gemini Live API
const wsProxy = createProxyMiddleware({
  target: 'wss://generativelanguage.googleapis.com',
  changeOrigin: true,
  ws: true,
  pathRewrite: (path) => {
    let newPath = path.replace('/api/genai', '');
    newPath = newPath.replace(/([?&])key=[^&]*/g, '$1').replace(/&$/, '').replace(/\?$/, '');
    newPath += (newPath.includes('?') ? '&' : '?') + `key=${GEMINI_API_KEY}`;
    console.log('[WS Proxy] →', newPath.replace(GEMINI_API_KEY, '***'));
    return newPath;
  },
});

app.use('/api/genai', httpProxy);

const server = app.listen(PORT, () => {
  console.log(`L8EntSpace GenAI proxy running on port ${PORT}`);
});

// Intercept WebSocket upgrade requests
server.on('upgrade', (req, socket, head) => {
  if (req.url && req.url.startsWith('/api/genai')) {
    wsProxy.upgrade(req, socket, head);
  }
});
