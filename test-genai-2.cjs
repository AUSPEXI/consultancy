const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ 
  apiKey: "dummy", 
  httpOptions: { baseUrl: "http://localhost:3000" }
});
try {
  ai.live.connect({ model: "gemini-3.1-pro-preview" }).catch(e => console.log(e.message));
} catch(e) {}
