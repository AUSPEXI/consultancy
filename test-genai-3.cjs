const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('hello');
});

server.on('upgrade', (req, socket, head) => {
  console.log('UPGRADE REQUEST TO:', req.url);
  socket.destroy();
  server.close();
});

server.listen(3001, () => {
  console.log('Listening on 3001');
  
  const { GoogleGenAI } = require('@google/genai');
  const ai = new GoogleGenAI({ 
    apiKey: "dummy", 
    httpOptions: { baseUrl: "http://localhost:3001/api/genai" }
  });
  ai.live.connect({ model: "gemini-3.1-pro-preview" }).catch(e => console.log('Connect failed', e.message));
});
