const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ 
  apiKey: "dummy", 
  httpOptions: { baseUrl: "http://localhost:3000/proxy" }
});
console.log(ai.live);
