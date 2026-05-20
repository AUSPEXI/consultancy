import express from "express";
import fs from "fs";
import path from "path";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";
import Exa from "exa-js";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import { marked } from "marked";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { blogPosts } from "./src/data/blogPosts.ts";
import cron from "node-cron";
import admin from 'firebase-admin';

import { llmOrchestrator } from './src/lib/llm-orchestrator.ts';
import { 
  SOVMetricsSchema, 
  ContentScorerSchema, 
  FactExtractionSchema, 
  BrandMonitorSchema, 
  SimulatorSchema,
  AmplifySchema,
  AnchorsSchema 
} from './src/lib/output-validation.ts';
import { vectorStore } from './src/lib/vector-db.ts';

dotenv.config();

// Initialize Firebase Admin for Backend Operations (Data Engine)
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('ascii'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT_BASE64 is missing. Automatic Data Engine writes will fail until this is set.");
  // Fallback to application default, which may fail due to IAM rules
  try {
    admin.initializeApp();
  } catch (err) {}
}

const dbAdmin = admin.apps.length ? admin.firestore() : null;

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

let exaClient: Exa | null = null;
function getExa(): Exa {
  if (!exaClient) {
    const key = process.env.EXA_API_KEY || process.env.VITE_EXA_API_KEY;
    if (!key) {
      throw new Error('EXA_API_KEY environment variable is required');
    }
    exaClient = new Exa(key);
  }
  return exaClient;
}

let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is missing from environment. AI features will fail.");
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    // The SDK supports both string and object init. 
    // If it's the newer SDK (which seems to be the case given the .models syntax used in this file), 
    // it likely expects the apiKey in an object.
    geminiClient = new GoogleGenAI({ 
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// --- Security Layers (Auspexi 5-Layer Architecture) ---

// Layer 4: Rate Limiting
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 AI requests per window
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Layer 1: Input Validation Schema
const amplifyRequestSchema = z.object({
  fact: z.string().min(5, "Fact is too short.").max(50000, "Fact is too long. Maximum 50000 characters allowed."),
  userId: z.string().optional()
});

// Layer 2: Prompt Injection Detection
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /disregard\s+(all\s+)?above/i,
  /forget\s+(everything|all|previous)/i,
  /new\s+instructions?:/i,
  /system\s*:\s*/i,
  /\[SYSTEM\]/i,
  /\<\|im_start\|\>/,
  /\<\|system\|\>/,
  /assistant\s*:\s*/i,
  /you\s+are\s+now/i,
  /act\s+as\s+(if\s+)?you/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /roleplay\s+as/i,
  /simulate\s+(being\s+)?a/i,
  /override\s+your/i,
  /bypass\s+your/i,
  /\\n\\n#\s/,
  /triple-quoted/i,
  /base64.*decode/i,
  /rot13|caesar|cipher/i
];

function detectPromptInjection(input: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

// Layer 3: Output Filtering (PII & Secrets)
const SENSITIVE_PATTERNS = {
  creditCard: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  apiKey: /\b(sk|pk)_[a-zA-Z0-9]{32,}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  jwt: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  awsKey: /AKIA[0-9A-Z]{16}/g
};

function filterSensitiveData(output: string): string {
  let filtered = output;
  Object.entries(SENSITIVE_PATTERNS).forEach(([type, pattern]) => {
    filtered = filtered.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
  });
  return filtered;
}

// --- End Security Layers ---

const app = express();
const PORT = 3000;

app.use(cors());

  // Stripe Webhook MUST go before express.json() to allow raw body access for signature verification
  app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      return res.status(400).send('Webhook Secret or Signature missing');
    }

    let event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email;
      
      if (email && dbAdmin) {
        try {
          const userQuery = await dbAdmin.collection('users').where('email', '==', email).limit(1).get();
          if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const amountTotal = session.amount_total;
            
            let newTier = 'Free';
            if (amountTotal === 11900) newTier = 'Basic';
            else if (amountTotal === 39900) newTier = 'Pro';
            else if (amountTotal === 149900) newTier = 'Business';
            else if (amountTotal === 499900) newTier = 'Enterprise';
            else if (amountTotal === 49900) newTier = 'PipelineOffer';
            
            await userDoc.ref.update({ tier: newTier, updatedAt: new Date().toISOString() });
            console.log(`Successfully upgraded user ${email} to ${newTier} via Stripe Webhook`);
          }
        } catch (error) {
          console.error('Error updating user tier from webhook:', error);
        }
      }
    }

    res.json({ received: true });
  });

app.use(express.json());

// API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Auspexi Backend is running" });
  });

  app.get("/api/analytics/map", async (req, res) => {
    const { userId, platform = "All", timeframe = "current" } = req.query as any;
    
    // Default clusters if no custom ones exist
    let clusters = [
      { x: -50, y: 40, label: "Reputational Moat", color: "#ec4899", baseType: "Systemic Anchor" },
      { x: 60, y: -30, label: "Technical Competence", color: "#06b6d4", baseType: "Signal Point" },
      { x: -20, y: -60, label: "Pricing Perception", color: "#8b5cf6", baseType: "Emergent Trend" },
    ];

    // Fetch custom clusters from Firestore if userId provided
    if (userId && dbAdmin) {
      try {
        const userDoc = await dbAdmin.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          if (data?.latentAnchors && Array.isArray(data.latentAnchors) && data.latentAnchors.length > 0) {
            // Assign fixed coordinates to anchors for deterministic clusters
            clusters = data.latentAnchors.map((a: any, idx: number) => ({
              ...a,
              x: idx === 0 ? -60 : idx === 1 ? 70 : idx === 2 ? -10 : idx === 3 ? 40 : -30,
              y: idx === 0 ? 50 : idx === 1 ? -40 : idx === 2 ? -70 : idx === 3 ? 20 : 10
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching custom anchors:", err);
      }
    }
    
    // Shift centers slightly based on platform to simulate different model biases
    const biasX = platform === 'Gemini' ? 20 : platform === 'ChatGPT' ? -20 : platform === 'Claude' ? 0 : 0;
    const biasY = platform === 'Gemini' ? -10 : platform === 'ChatGPT' ? 20 : platform === 'Claude' ? -30 : 0;

    // Simulate "drift" for historical snapshots
    const driftFactor = timeframe === 'month' ? 1.5 : timeframe === 'week' ? 0.7 : 0;
    const timeSeed = timeframe === 'month' ? 30 : timeframe === 'week' ? 7 : 1;

    const clustersWithBias = clusters.map((c, i) => ({
      ...c,
      x: c.x + biasX + (driftFactor * (i + 1) * 2),
      y: c.y + biasY - (driftFactor * (i + 1) * 1.5)
    }));

    const points = Array.from({ length: 120 }, (_, i) => {
      const cluster = clustersWithBias[i % clustersWithBias.length];
      const theta = Math.random() * 2 * Math.PI;
      const r = Math.sqrt(Math.random()) * 50; 
      
      const individualDrift = Math.sin(i + timeSeed) * driftFactor * 2;
      
      return {
        id: i,
        x: cluster.x + r * Math.cos(theta) + individualDrift,
        y: cluster.y + r * Math.sin(theta) - individualDrift,
        z: (Math.random() * 40 - 20) + (individualDrift * 2),
        size: Math.floor(Math.random() * 6) + 3,
        type: cluster.label,
        groupType: cluster.baseType,
        source: platform === "All" ? ["Gemini", "ChatGPT", "Claude"][i % 3] : platform,
        label: [
          "Security Compliance", "API Latency", "Founder History", 
          "Tokenomics", "Market Share", "Github Activity",
          "Patent Filing", "Discord Sentiment", "Reddit Leak",
          "Enterprise Trust", "Latency Spike", "Model Drift"
        ][i % 12],
        distance: Math.random(),
        sentiment: Math.random() > 0.4 ? 'positive' : 'negative',
      };
    });
    res.json({ 
      success: true, 
      points, 
      metadata: { 
        engine: "Gemini-Embed-004", 
        dimensions: 768, 
        platform,
        timeframe,
        aggregatedAt: new Date(Date.now() - (timeSeed * 3600000 * 24)).toISOString(),
        pathCount: 1240 + (timeSeed * 10)
      } 
    });
  });

  app.get("/api/analytics/sentiment-trace", (req, res) => {
    // Look for custom prompts in query params
    const customPromptsRaw = req.query.prompts;
    let prompts = [
      "Is Auspexi a secure enterprise choice?",
      "How does Auspexi compare to legacy SEO?",
      "Is Auspexi's GEO tech proprietary?",
      "Founder reputation and reliability"
    ];

    if (customPromptsRaw && typeof customPromptsRaw === 'string') {
      try {
        const decoded = JSON.parse(decodeURIComponent(customPromptsRaw));
        if (Array.isArray(decoded) && decoded.length > 0) {
          prompts = decoded;
        }
      } catch (e) {
        console.error("Failed to parse custom prompts for sentiment trace", e);
      }
    }

    const days = 7;
    const now = new Date();
    
    const trace = prompts.map(prompt => {
      const data = Array.from({ length: days }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (days - 1 - i));
        
        // Slightly randomized but trending upwards
        const seedValue = (prompt.length % 20) + 40; 
        const drift = i * 4;
        const pos = Math.min(100, Math.max(10, seedValue + drift + (Math.random() * 10)));
        const neg = Math.max(0, 30 - drift + (Math.random() * 5));
        const neu = 100 - pos - neg;

        return {
          date: date.toISOString().split('T')[0],
          positive: parseFloat(pos.toFixed(1)),
          negative: parseFloat(neg.toFixed(1)),
          neutral: parseFloat(neu.toFixed(1))
        };
      });
      
      return { prompt, data };
    });

    res.json({ success: true, trace });
  });

  app.get("/api/analytics/pulse", (req, res) => {
    const { brandId } = req.query;
    // Generate simulated real-time ingestion pulse with date and zScore
    const now = new Date();
    const pulse = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setMinutes(now.getMinutes() - (29 - i) * 30); // 30 min intervals
      
      // We want a "drift" pulse - usually calm, with occasional spikes (anomalies)
      const baseNoise = (Math.random() * 0.5) - 0.25;
      const spike = (i === 15 || i === 25) ? (Math.random() > 0.5 ? 3.5 : -3.5) : 0;
      const zScore = parseFloat((baseNoise + spike).toFixed(2));
      
      return {
        date: date.toISOString(),
        zScore: zScore,
        isAnomaly: Math.abs(zScore) > 2.5,
        mentions: Math.floor(Math.random() * 100) + 20,
        citations: Math.floor(Math.random() * 40) + 10,
        nodeShift: Math.abs(zScore * 10) // Visual indicator for node movement
      };
    });
    res.json({ success: true, pulse });
  });

  // Mock "Customer Backend" Webhook Endpoints
  app.post("/api/webhooks/auspexi", (req, res) => {
    try {
      const payload = req.body;
      console.log("----- RECEIVED WEBHOOK FROM AUSPEXI -----");
      console.log(JSON.stringify(payload, null, 2));
      
      const logsPath = path.join("/tmp", "webhookLogs.json");
      
      let logs = [];
      if (fs.existsSync(logsPath)) {
        logs = JSON.parse(fs.readFileSync(logsPath, "utf-8"));
      }
      
      logs.push({
        timestamp: new Date().toISOString(),
        payload
      });
      
      fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));

      // Handle Ontology Injection
      if (payload.type === 'ontology_injection' && payload.ontology) {
        const schemaPath = path.join("/tmp", "activeSchema.json");
        // Ensure data directory exists
        const dir = path.dirname(schemaPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        let existingSchemas = [];
        if (fs.existsSync(schemaPath)) {
          existingSchemas = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
        }
        existingSchemas.push(payload.ontology);
        fs.writeFileSync(schemaPath, JSON.stringify(existingSchemas, null, 2));
      }
      
      res.json({ success: true, message: "Webhook received and logged securely." });
    } catch (err: any) {
      console.error("Webhook processing error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/webhooks/logs", (req, res) => {
    try {
      const logsPath = path.join("/tmp", "webhookLogs.json");
      if (fs.existsSync(logsPath)) {
        res.json(JSON.parse(fs.readFileSync(logsPath, "utf-8")));
      } else {
        res.json([]);
      }
    } catch(err: any) {
      res.status(500).json({ error: "Failed to read logs" });
    }
  });

  app.get("/api/schema/active", (req, res) => {
    try {
      const schemaPath = path.join("/tmp", "activeSchema.json");
      if (fs.existsSync(schemaPath)) {
        res.json(JSON.parse(fs.readFileSync(schemaPath, "utf-8")));
      } else {
        res.json([]);
      }
    } catch(err: any) {
      res.status(500).json({ error: "Failed to read active schemas" });
    }
  });

  app.post("/api/amplify", aiLimiter, async (req, res) => {
    try {
      // Layer 1: Input Validation
      const parsed = amplifyRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request data", details: parsed.error.issues });
      }
      const { fact, userId = 'anonymous' } = parsed.data;

      // Layer 2: Prompt Injection Detection
      if (detectPromptInjection(fact)) {
        console.warn(`[SECURITY] Prompt injection detected from IP: ${req.ip}`);
        return res.status(400).json({ error: "Security Policy Violation: Invalid input pattern detected." });
      }

      const prompt = `
        You are an expert Generative Engine Optimization (GEO) and social media strategist.
        Take the following core fact and rewrite it into 6 distinct social media posts optimized for maximum engagement and AI citation indexing.
        The goal is to seed this fact across the internet to build authority.
        
        Core Fact: "${fact}"
        
        Generate:
        1. A professional, thought-leadership post for LinkedIn.
        2. A conversational, value-driven post for Reddit (suitable for a relevant subreddit).
        3. A punchy, engaging thread or post for Twitter/X.
        4. A short, hook-driven script for a YouTube Short.
        5. A highly engaging, trend-aware script or caption for TikTok.
        6. A visually descriptive caption with relevant hashtags for Instagram.
        
        Return ONLY a JSON object with the following keys: 'linkedin', 'reddit', 'twitter', 'youtube', 'tiktok', 'instagram'.
        The values should be the generated text for each platform.
      `;

      const result = await llmOrchestrator.executeCall<any>({
        userId,
        provider: 'gemini',
        model: 'gemini-3.5-flash',
        prompt,
        schema: AmplifySchema
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error, validationErrors: result.validationErrors });
      }

      // Layer 3: Output Filtering
      const filteredOutput = filterSensitiveData(JSON.stringify(result.data));

      res.json(JSON.parse(filteredOutput));
    } catch (error: any) {
      console.error("Error generating omnichannel content:", error);
      res.status(500).json({ error: "Internal server error during generation" });
    }
  });

  app.post("/api/content-scorer", async (req, res) => {
    try {
      const { content, contentType, userId } = req.body;
      if (!content || !userId) {
        return res.status(400).json({ error: "Missing content or userId" });
      }

      // Retrieve User's Facts for Cross-Referencing
      let userFactsStr = "";
      if (dbAdmin) {
        const factsSnap = await dbAdmin.collection('facts').where('userId', '==', userId).limit(20).get();
        if (!factsSnap.empty) {
          const factsList = factsSnap.docs.map(doc => doc.data().statement);
          userFactsStr = "User's Master Facts from Fact Vault (Evaluate if the content successfully leverages these, or suggest where they could be injected):\n- " + factsList.join("\n- ");
        } else {
          userFactsStr = "The user has no facts stored in their Vault yet. Advise them to add verified statistics to their Fact Vault to improve Entity Density.";
        }
      }

      const prompt = `
        You are an expert Generative Engine Optimization (GEO) agent.
        Analyze the following content for "Machine Readability" and its likelihood to be cited by AI Models (ChatGPT, Claude, Gemini).
        
        CRITICAL CONTEXT: The user has specified this content is intended for: "${contentType}".
        ${contentType === 'sales' ? 'Do NOT penalize the content for having marketing hooks, persuasive copy, or human-centric storytelling. Instead, evaluate how well they have WEAVED machine-readable facts, entities, and statistical anchors INTO the sales copy without destroying the human conversion rate. Suggest ways to add "Cite-Magnets" without ruining the sales pitch.' : ''}
        
        ${userFactsStr}

        Evaluate the content provided below against these metrics:
        1. Entity Density: How many clear nouns, statistics, and verifiable facts are present? Did they use their Master Facts?
        2. Citation Likelihood: If an AI was asked about this topic, would it confidently cite this text as a source?
        3. Information Gain: Does this provide new, unique value over generic text?

        Content to evaluate:
        """${content.substring(0, 15000)}"""
        
        Return ONLY valid JSON matching this schema:
        {
          "overallScore": <int 0-100>,
          "entityDensityScore": <int 0-100>,
          "statisticalAnchorsScore": <int 0-100>,
          "invertedPyramidScore": <int 0-100>,
          "feedback": [<array of 2-3 short strings with actionable advice>],
          "rewrittenSnippet": "<A suggested rewrite of a weak paragraph to make it more machine-readable while maintaining the appropriate tone for the given content type>"
        }
      `;

      const result = await llmOrchestrator.executeCall<any>({
        userId,
        provider: 'gemini',
        model: 'gemini-3.1-pro-preview',
        prompt,
        schema: ContentScorerSchema
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error, validationErrors: result.validationErrors });
      }

      res.json({ success: true, result: result.data });
    } catch (err: any) {
      console.error("Content Scorer endpoint error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/research-facts", async (req, res) => {
    try {
      const { industry, userId = 'anonymous' } = req.body;
      if (!industry) return res.status(400).json({ error: "Missing industry" });

      const exa = getExa();
      const searchRes = await exa.searchAndContents(`Latest statistics, data points, and factual insights about the ${industry} industry`, { numResults: 3, text: true });
      const exaContext = searchRes.results.map((r: any) => `URL: ${r.url}\\nText: ${r.text}`).join("\\n\\n").substring(0, 5000);

      const prompt = `
        You are an expert Generative Engine Optimization (GEO) agent and Fact-Grabber research assistant.
        The user's industry/domain is: "${industry}".
        
        Using the following context exclusively from live web search results, extract or synthesize 3 "High-Entropy Facts" (unique, non-obvious, highly specific data points or statistics that AI models would want to cite) related to this industry.
        For each fact, assign an "Entropy Score" from 0 to 100 (higher means more unique). 
        
        CONTEXT:
        ${exaContext}
        
        Return ONLY valid JSON matching this schema:
        [
          { "statement": "The unique fact...", "entropyScore": 85 }
        ]
      `;

      const result = await llmOrchestrator.executeCall<any>({
        userId,
        provider: 'gemini',
        model: 'gemini-3.5-flash',
        prompt,
        schema: FactExtractionSchema
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error, validationErrors: result.validationErrors });
      }

      res.json({ success: true, facts: result.data });
    } catch (err: any) {
      console.error("Research facts endpoint error:", err);
      res.status(500).json({ error: "Failed to research facts" });
    }
  });

  app.post("/api/extract-high-entropy-facts", async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) return res.status(400).json({ error: "Missing content" });

      const ai = getGemini();
      const prompt = `
        You are an expert Generative Engine Optimization (GEO) agent.
        Analyze the following text and extract 3 "High-Entropy Facts" (unique, non-obvious data points that AI models would want to cite).
        For each fact, assign an "Entropy Score" from 0 to 100 (higher means more unique).
        
        Text:
        ${content.substring(0, 5000)}
        
        Return ONLY valid JSON matching this schema:
        [
          { "statement": "The unique fact...", "entropyScore": 85 }
        ]
      `;

      const result = await llmOrchestrator.executeCall<any>({
        userId: 'anonymous',
        provider: 'gemini',
        model: 'gemini-3.5-flash',
        prompt
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      const factsRes = JSON.parse(result.rawOutput || "[]");
      res.json({ success: true, facts: factsRes });
    } catch (err: any) {
      console.error("Extract high entropy facts error:", err);
      res.status(500).json({ error: "Failed to extract facts" });
    }
  });

  app.post("/api/extract-facts", async (req, res) => {
    try {
      const { content, contentType, userId } = req.body;
      if (!content || !userId) {
        return res.status(400).json({ error: "Missing content or userId" });
      }

      const ai = getGemini();
      const prompt = `Extract 3 atomic facts from the following text and format as a JSON array of strings. Each string must be a concise, standalone fact.\\nText: ${content.substring(0, 5000)}`;

      const result = await llmOrchestrator.executeCall<any>({
        userId,
        provider: 'gemini',
        model: 'gemini-3.5-flash',
        prompt
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      const facts = JSON.parse(result.rawOutput || '[]');
      res.json({ success: true, facts });
    } catch (err: any) {
      console.error("Extract facts endpoint error:", err);
      res.status(500).json({ error: "Failed to extract facts" });
    }
  });

  app.post("/api/exa-search", async (req, res) => {
    try {
      const { query, numResults = 5 } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const exa = getExa();
      const searchResult = await exa.searchAndContents(query, {
        type: "neural",
        useAutoprompt: true,
        numResults,
        text: true
      });

      res.json({ success: true, results: searchResult.results });
    } catch (error: any) {
      console.error("Error in Exa search:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/simulate", async (req, res) => {
    try {
      const { query, brand, userId = 'anonymous' } = req.body;
      if (!query || !brand) {
        return res.status(400).json({ error: "Missing query or brand" });
      }

      const prompt = `
        You are an advanced AI simulation engine.
        Simulate how 4 different AI engines (ChatGPT, Claude, Gemini, Perplexity) would answer the following high-intent query: "${query}".
        The brand we are tracking is: "${brand}".
        
        For each engine, write a realistic 2-3 sentence response to the query. 
        Decide randomly if the engine should mention the brand or a competitor. 
        
        Return a JSON object with:
        - chatgpt: { response: string, mentionedBrand: boolean }
        - claude: { response: string, mentionedBrand: boolean }
        - gemini: { response: string, mentionedBrand: boolean }
        - perplexity: { response: string, mentionedBrand: boolean }
        - sovScore: number (0 to 100, based on how many mentioned the brand)
      `;

      const result = await llmOrchestrator.executeCall<any>({
        userId,
        provider: 'gemini',
        model: 'gemini-3.1-pro-preview',
        prompt,
        schema: SimulatorSchema
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error, validationErrors: result.validationErrors });
      }

      res.json({ success: true, result: result.data });
    } catch (err: any) {
      console.error("Simulation endpoint error:", err);
      res.status(500).json({ error: "Failed to run simulation" });
    }
  });

  app.post("/api/analyze-competitor", async (req, res) => {
    try {
      const { hostname, userId = 'anonymous' } = req.body;
      if (!hostname) return res.status(400).json({ error: "Missing hostname" });

      const exa = getExa();
      const exaRes = await exa.searchAndContents(`site:${hostname}`, { numResults: 3, text: true });
      
      const contextText = exaRes.results && exaRes.results.length > 0
        ? exaRes.results.map((r: any) => `Title: ${r.title}\nText: ${r.text}`).join("\n\n")
        : "No direct scraping data available. Analyze the domain logically based on typical corporate decay patterns.";
        
      const prompt = `
          You are an expert Generative Engine Optimization (GEO) agent.
          Analyze the competitor at the following domain: ${hostname}
          
          Based on the following scraped context, identify potential "Data Decay" or "Trojan Horse Opportunities" (areas where their documentation, pricing, or product specs might be outdated or easily contradicted by a superior product's high-entropy facts).
          
          CONTEXT:
          ${contextText.substring(0, 5000)}
          
          Return a JSON object with:
           - decayStatus: 'healthy', 'decaying', or 'vulnerable'
           - trojanHorseOpportunity: boolean (is there an angle to inject our facts?)
           - vulnerabilities: array of strings (specific weaknesses found)
        `;

        const result = await llmOrchestrator.executeCall<any>({
          userId,
          provider: 'gemini',
          model: 'gemini-3.1-pro-preview',
          prompt
        });

        if (!result.success) {
          return res.status(500).json({ error: result.error });
        }

        const parsedComp = JSON.parse(result.rawOutput || "{}");
        res.json({ success: true, result: { name: hostname, ...parsedComp } });
    } catch (err: any) {
      console.error("Analyze competitor endpoint error:", err);
      res.status(500).json({ error: "Failed to analyze competitor" });
    }
  });

  app.post("/api/technical-restructure", async (req, res) => {
    try {
      const { text, userId = 'anonymous' } = req.body;
      if (!text) return res.status(400).json({ error: "Missing text to restructure" });

      const prompt = `
        You are an expert Generative Engine Optimization (GEO) agent.
        Analyze the following text. Identify the most "dense" or "fluffy" paragraph that contains data, pricing, or comparisons trapped in a narrative format.
        Convert that data into a clean, semantic HTML <table>.
        
        Text to analyze:
        ${text}
        
        Return ONLY a JSON object with:
        - 'detectedFluff' (string): The original dense paragraph you identified.
        - 'htmlTable' (string): The raw HTML code for the table (just the <table> element and its contents, use Tailwind classes like 'w-full text-left text-xs text-zinc-300' for the table, 'bg-zinc-800/50' for thead, and 'p-2' for th/td).
      `;

      const result = await llmOrchestrator.executeCall<any>({
        userId,
        provider: 'gemini',
        model: 'gemini-3.5-flash',
        prompt
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      const parsedRes = JSON.parse(result.rawOutput || "{}");
      res.json({ success: true, result: parsedRes });
    } catch (err: any) {
      console.error("Technical Restructure error:", err);
      res.status(500).json({ error: "Failed to restructure text" });
    }
  });

  app.post("/api/technical-schema", async (req, res) => {
    try {
      const { factText, userId = 'anonymous' } = req.body;
      if (!factText) return res.status(400).json({ error: "Missing factText" });

      const prompt = `
        You are an expert Technical SEO and GEO agent.
        Convert the following fact or statement into a highly structured JSON-LD Schema (FAQPage, Organization, or Product, whichever fits best).
        
        Fact/Statement:
        ${factText}
        
        Return ONLY a valid JSON object representing the JSON-LD schema. Do not wrap in markdown blocks.
      `;

      const result = await llmOrchestrator.executeCall<any>({
        userId,
        provider: 'gemini',
        model: 'gemini-3.5-flash',
        prompt
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ success: true, schema: result.rawOutput });
    } catch (err: any) {
      console.error("Technical Schema error:", err);
      res.status(500).json({ error: "Failed to generate schema" });
    }
  });

  app.post("/api/agent/crawl", async (req, res) => {
    try {
      const { topic } = req.body;
      if (!topic) return res.status(400).json({ error: "Missing topic" });

      const exa = getExa();
      let crawlerData = '';
      try {
        const searchResult = await exa.searchAndContents(topic, {
          type: "neural",
          useAutoprompt: true,
          numResults: 3,
          text: true
        });
        if (searchResult.results && searchResult.results.length > 0) {
          crawlerData = searchResult.results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nText: ${r.text.substring(0, 1000)}`).join("\n\n");
        } else {
            throw new Error("No exa results");
        }
      } catch (e) {
          const ai = getGemini();
          const fallbackPrompt = `
              You are an expert technical SEO and Generative Engine Optimization research agent. 
              Generate a meticulously detailed, highly-technical simulated research report on "${topic}". 
              Include hypothetical but highly realistic third-party statistics, methodologies, and advanced concepts related strictly to GEO, Data Decay, Semantic Vectors, and LLM behavior. 
              CRITICAL: Prefix the report with a realistic external source (e.g., "According to the Forrester 2024 AI Index:", "A recent study by MIT CSAIL found..."). Do NOT author it yourself.
              Make it at least 400 words of dense facts.
            `;
        const result = await llmOrchestrator.executeCall<string>({
          userId: 'agent-user',
          provider: 'gemini',
          model: 'gemini-3.5-flash',
          prompt: fallbackPrompt
        });
        crawlerData = result.rawOutput || `Raw data found for ${topic}: No detailed data available.`;
      }
      res.json({ success: true, result: crawlerData });
    } catch (err: any) {
      console.error("Agent crawl error:", err);
      res.status(500).json({ error: "Failed to crawl" });
    }
  });

  app.post("/api/agent/extract", async (req, res) => {
    try {
       const { topic, crawlerData, vaultContext } = req.body;
       const ai = getGemini();

       const extractPrompt = `
        You are the Extraction Agent. Your ONLY job is to extract raw, high-entropy facts from this text.
        Do not write a narrative. Return a bulleted list of raw statistics and facts about "${topic}".
        CRITICAL: If the text attributes a fact to a specific study, group, or author, you MUST include that attribution in your bullet point so the synthesis agent knows who to cite.
        
        Text Data: 
        ${crawlerData}

        ${vaultContext ? `\nCRUCIAL BRAND FACTS FROM VAULT (Include these in your extracted list):\n- ${vaultContext}` : ''}
      `;

      const result = await llmOrchestrator.executeCall<string>({
        userId: 'agent-user',
        provider: 'gemini',
        model: 'gemini-3.5-flash',
        prompt: extractPrompt
      });
      res.json({ success: true, result: result.rawOutput });
    } catch (err: any) {
       console.error("Agent extract error:", err);
       res.status(500).json({ error: "Failed to extract" });
    }
  });

  app.post("/api/agent/schema", async (req, res) => {
     try {
       const { facts } = req.body;
       const ai = getGemini();
       const schemaPrompt = `
        You are the Schema Agent. Your ONLY job is to write valid JSON-LD FAQPage schema based on these facts.
        Do not write any markdown formatting or explanations. Output ONLY raw JSON.
        Facts: ${facts}
      `;
      const result = await llmOrchestrator.executeCall<string>({
        userId: 'agent-user',
        provider: 'gemini',
        model: 'gemini-3.5-flash',
        prompt: schemaPrompt
      });
      let text = result.rawOutput || "{}";
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      res.json({ success: true, result: text });
     } catch (err: any) {
       console.error("Agent schema error:", err);
       res.status(500).json({ error: "Failed to generate schema" });
     }
  });

  app.post("/api/agent/synthesize", async (req, res) => {
     try {
        const { topic, facts, brandName, userId = 'agent-user' } = req.body;
        const synthesisPrompt = `
        You are the Synthesis Agent writing on behalf of the brand "${brandName || 'Auspexi'}". 
        Write a comprehensive, deep-dive blog post (minimum 500 words) about "${topic}".
        
        You MUST seamlessly weave in these exact extracted facts: 
        ${facts}

        CRITICAL TONE & ATTRIBUTION DIRECTIVES:
        1. YOU ARE THE BRAND "${brandName || 'Auspexi'}". Do not adopt the persona of the external researchers.
        2. Attribute the facts to external sources using phrases like "According to recent industry analysis...", "External research indicates...", or name the specific source if it was extracted. Do NOT claim you discovered the data.
        3. Explain *why* these external facts matter to your specific enterprise audience.
        4. NEVER sign off the article using the extracted researcher/author's name.

        CORE GEO METHODOLOGY TO INCLUDE:
        Elevate this from surface-level content by strictly adhering to the "Auspexi" philosophy of Generative Engine Optimization:
        - Overcoming "Data Decay" (stale AI vectors) via "High-Entropy Facts" (unique, undeniable data points).
        - "Trojan Horse Opportunities" (exploiting competitor logic gaps by injecting our facts into their narrative spaces).
        - Entity density, Knowledge Graph alignment, and establishing high "Information Gain" to force LLMs to cite us.
        
        Do not write generic PR fluff. Speak to Technical SEOs and Enterprise Marketing Directors. Use markdown formatting (H2, H3, bullet points). Ensure the final length is at least 500 words.
      `;

      const result = await llmOrchestrator.executeCall<string>({
        userId,
        provider: 'gemini',
        model: 'gemini-3.1-pro-preview',
        prompt: synthesisPrompt,
        temperature: 0.7
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ success: true, result: result.rawOutput });
     } catch (err: any) {
        console.error("Agent synthesize error:", err);
        res.status(500).json({ error: "Failed to synthesize" });
     }
  });

  app.post("/api/push-to-cms", async (req, res) => {
    try {
      const { webhookUrl, payload } = req.body;
      if (!webhookUrl) return res.status(400).json({ error: "No CMS Webhook URL configured" });

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: "auspexi.shadow_link_sync",
          timestamp: new Date().toISOString(),
          data: payload
        })
      });

      if (!response.ok) throw new Error(`CMS responded with ${response.status}`);
      
      res.json({ success: true, message: "Successfully synchronized with CMS" });
    } catch (err: any) {
      console.error("CMS Push error:", err);
      res.status(500).json({ error: err.message || "Failed to push to CMS" });
    }
  });

  app.post("/api/suggest-anchors", async (req, res) => {
    try {
      const { userId, brand, domain, domainContext } = req.body;
      if (!brand || !domain) return res.status(400).json({ error: "Brand and domain required" });

      const prompt = `
        You are an expert Generative Engine Optimization (GEO) strategist.
        Analyze the following brand and domain data to suggest 3-5 "Semantic Anchors" for their Latent Space Map.
        
        Brand: ${brand}
        Domain: ${domain}
        Context (if available): ${domainContext || 'No additional context provided.'}
        
        Semantic Anchors are the primary concepts LLMs associate with a brand. They represent stable, high-confidence clusters of information.
        
        Suggest 3-5 anchors. Each should have:
        - label: A short (1-3 words) name for the anchor (e.g., "Technical Reliability", "Premium Pricing", "Customer Ease").
        - color: A hex code representing the "vibe" (use: #ec4899 for positive/moat, #06b6d4 for signals, #8b5cf6 for trends, #f59e0b for risks).
        - baseType: "Systemic Anchor", "Signal Point", "Emergent Trend", or "Risk Vector".
        
        Return ONLY a JSON array of anchor objects.
      `;

      const result = await llmOrchestrator.executeCall<any>({
        userId: userId || 'anonymous',
        provider: 'gemini',
        model: 'gemini-3.5-flash',
        prompt,
        schema: AnchorsSchema
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error, validationErrors: result.validationErrors });
      }

      res.json({ success: true, anchors: result.data });
    } catch (err: any) {
      console.error("Suggest anchors error:", err);
      res.status(500).json({ error: "Failed to suggest anchors" });
    }
  });

  app.post("/api/copilot-chat", async (req, res) => {
    try {
      const { userMessage, chatHistory, systemInstruction, userId = 'copilot-user' } = req.body;
      if (!userMessage) return res.status(400).json({ error: "Missing message" });

      console.log(`[Copilot] Processing request for: "${userMessage.substring(0, 50)}..."`);

      // IMPORTANT: Gemini history MUST start with a 'user' message.
      let historyToMap = chatHistory || [];
      
      // Clean and normalize history
      let cleanedHistory = historyToMap
        .filter((m: any) => m && m.content && typeof m.content === 'string' && m.content.trim() !== '')
        .map((m: any) => ({
          role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      // Ensure history starts with 'user'
      if (cleanedHistory.length > 0 && cleanedHistory[0].role === 'model') {
        cleanedHistory = cleanedHistory.slice(1);
      }

      // Add the current message
      // Note: For Gemini SDK Chat, we can pass history and then send message.
      // But through orchestrator, we'll pass the whole contents array.

      const contents = [...cleanedHistory, { role: 'user', parts: [{ text: userMessage }] }];

      const result = await llmOrchestrator.executeCall<string>({
        userId,
        provider: 'gemini',
        model: 'gemini-3.1-pro-preview',
        contents,
        temperature: 0.7
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ success: true, result: result.rawOutput });
    } catch (err: any) {
      console.error("[Copilot CRITICAL] Chat Error:", err);
      
      const isAuthError = err.message?.includes("API_KEY_INVALID") || err.message?.includes("403");
      const errorMessage = isAuthError 
        ? "CRITICAL: The Citacious Engine rejects our credentials. Please check GEMINI_API_KEY."
        : `SYNC_FAILURE: ${err.message || 'Failed to communicate with the Citacious Engine.'}`;

      res.status(500).json({ 
        success: false, 
        error: errorMessage
      });
    }
  });

  app.get("/api/orchestrator/status", (req, res) => {
    const { userId = 'anonymous' } = req.query as any;
    res.json(llmOrchestrator.getStatus(userId));
  });

  app.post("/api/run-daily-audit", async (req, res) => {
    try {
      const { userId, brand, domain, competitors, keywords, sentimentPrompts } = req.body;
      if (!userId || !brand || !domain || !keywords || keywords.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const defaultSentimentPrompts = [
        "Best alternative to top competitor?",
        "Is the product reliable for enterprise?",
        "Common user complaints & reviews?",
        "Pricing compared to market average?"
      ];
      
      const promptsToUse = (sentimentPrompts && sentimentPrompts.length > 0) ? sentimentPrompts : defaultSentimentPrompts;
      const sentimentSchema = promptsToUse.map((p: string) => `{ "prompt": "${p.replace(/"/g, '\\"')}", "score": <int -100 to 100> }`).join(",\n    ");

      const exa = getExa();

      // 1. Search Exa for the keywords
      let combinedContext = "";
      for (const keyword of keywords.slice(0, 3)) { // Limit to 3 keywords to save time/tokens
        const searchResult = await exa.searchAndContents(keyword, {
          type: "neural",
          useAutoprompt: true,
          numResults: 5,
          text: true
        });
        combinedContext += `\n\n--- Results for keyword: ${keyword} ---\n`;
        combinedContext += searchResult.results.map(r => r.text).join("\n\n").substring(0, 5000);
      }

      // 2. Ask Gemini to calculate SOV based on the context
      const prompt = `
You are an expert Generative Engine Optimization (GEO) analyst.
Analyze the following search results for the target keywords.
Calculate the "Share of Voice" (SOV) percentage for the primary brand and its competitors.

Primary Brand: ${brand}
Domain: ${domain}
Competitors: ${competitors.join(", ")}

Search Context:
${combinedContext.substring(0, 30000)}

Return ONLY a JSON object. 
IMPORTANT: Your estimates for 'platforms' SHOULD NEVER BE ZERO. Base them on the citation frequency in the context.
If the context is sparse, use a baseline of 5-15% for the brand if it's mentioned at all.

{
  "aSov": <integer percentage for ${brand}>,
  "compA": <integer percentage for ${competitors[0] || 'Competitor A'}>,
  "compB": <integer percentage for ${competitors[1] || 'Competitor B'}>,
  "compGap": <integer percentage difference between brand and compA>,
  "aiTraffic": <integer count indicative of traffic source strength>,
  "aiCitations": <integer count of explicit brand citations>,
  "err": <integer 0-100 indicating how robustly AI remembers brand facts>,
  "platforms": {
    "chatgpt": <integer 0-100>,
    "perplexity": <integer 0-100>,
    "claude": <integer 0-100>,
    "gemini": <integer 0-100>
  },
  "radar": [
    { "subject": "Pricing Insights", "brandScore": <int>, "compScore": <int> },
    { "subject": "Feature Comparison", "brandScore": <int>, "compScore": <int> },
    { "subject": "Implementation Docs", "brandScore": <int>, "compScore": <int> },
    { "subject": "Customer Support", "brandScore": <int>, "compScore": <int> },
    { "subject": "Security & Auth", "brandScore": <int>, "compScore": <int> },
    { "subject": "Enterprise Ready", "brandScore": <int>, "compScore": <int> }
  ],
  "sentiment": [
    ${sentimentSchema}
  ],
  "topUrls": [
    { "path": "/pricing", "citations": <int> },
    { "path": "/blog/some-article-based-on-context", "citations": <int> },
    { "path": "/features", "citations": <int> }
  ]
}
`;

      const result = await llmOrchestrator.executeCall<any>({
        userId,
        provider: 'gemini',
        model: 'gemini-3.1-pro-preview',
        prompt,
        schema: SOVMetricsSchema
      });

      if (!result.success) {
        return res.status(500).json({ 
          error: result.error, 
          validationErrors: result.validationErrors,
          rawOutput: result.rawOutput 
        });
      }

      const parsedData = result.data;

      res.json({ 
        success: true, 
        metrics: {
          aSov: parsedData.aSov || 12,
          err: parsedData.err || 20,
          compA: parsedData.compA || 40,
          compB: parsedData.compB || 30,
          compC: parsedData.compC || 0,
          compD: parsedData.compD || 0,
          compGap: parsedData.compGap || ((parsedData.aSov || 12) - (parsedData.compA || 40)),
          aiTraffic: parsedData.aiTraffic || ((parsedData.aiCitations || 2) * 15 + Math.floor(Math.random() * 50)),
          platforms: parsedData.platforms || { chatgpt: 15, perplexity: 10, claude: 12, gemini: 20 },
          radar: parsedData.radar || [],
          sentiment: parsedData.sentiment || [],
          topUrls: parsedData.topUrls || []
        }
      });

    } catch (error: any) {
      console.error("Error running daily audit:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/generate-report", async (req, res) => {
    try {
      const { domain, email } = req.body;
      if (!domain || !email) {
        return res.status(400).json({ error: "Domain and email are required" });
      }

      const exa = getExa();
      
      // Better error messaging for missing keys
      const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!geminiKey) {
        console.error("CRITICAL: GEMINI_API_KEY is missing during report generation request.");
        return res.status(500).json({ 
          error: "AI Services are temporarily unavailable (Missing Credentials). If you are the admin, check your Netlify environment variables." 
        });
      }

      const ai = getGemini();

      // 1. Search for the domain using Exa to get context
      const searchResult = await exa.searchAndContents(`site:${domain} OR "${domain}"`, {
        type: "neural",
        useAutoprompt: true,
        numResults: 8,
        text: true
      });

      const domainContext = searchResult.results.map(r => r.text).join("\n\n").substring(0, 20000);

      // 2. Generate the report using Gemini
      const prompt = `
You are an expert in Generative Engine Optimization (GEO).
Generate a comprehensive GEO Strategy report for the domain: ${domain}.
Use the following context gathered from the web about this domain (which includes multiple pages like their homepage, blog, and about pages):
${domainContext}

Report Structure & Requirements:
1. Executive Summary: The AI Visibility Gap
- Explain that by 2026, traditional search volume is predicted to drop by 25%.
- Introduce the concept that "Ranking #1 means less than ever" if an AI answer appears above the content without citing the brand.
- Define their new primary KPI: AI Share of Voice (AI SOV)—the percentage of AI responses that mention their brand versus competitors.

2. GEO Opportunity Analysis (The Dual-Optimization Approach)
Analyze the domain's current content strategy based ON THE ACTUAL CONTEXT PROVIDED. Specifically, evaluate how well they balance Human-Centric Sales Copy with AI-Readable Data (Dual-Optimization):
- Human vs. AI Balance: Acknowledge that human-readable narrative is essential for conversions, but AI requires dense, factual data (Fact-Maxing). Assess if their current copy leans too far into qualitative marketing fluff, or if they successfully blend human storytelling with hard, extractable facts.
- Semantic Architecture: Do they use the "Inverted Pyramid of Synthesis" (putting the direct, factual answer first for AI, followed by the human narrative)? If they do this well, praise them but suggest scaling it. If they don't, point it out as an opportunity.
- Entity Clarity: Are their core brand concepts clearly defined, or is there a risk of "Concept Collision" with competitors?

3. The GEO Transformation Strategy (Our Services)
Explain how we will implement the "High-Performing Trio" of enhancements to boost their visibility:
- Statistics Addition: Turning qualitative claims into "Statistically Irresistible" anchors.
- Quotation Addition: Integrating expert quotes to provide AI with extractable evidence (Social Proof tokens).
- Authoritative Citations: Linking to high-authority external sources to signal trust to the LLM.

4. Technical & Off-Page Architecture
- Technical Layer: Describe our implementation of JSON-LD Schema (FAQ, Organization, and Product) to structure their data for LLM crawlers.
- Digital Ecosystem Expansion: Detail how we will manage their narrative on "Consensus Platforms" like Reddit, Quora, and Industry Forums.

5. Projected ROI & Measurement
- Explain that AI-referred visitors convert at 4.4x the rate of traditional organic search because they arrive pre-informed.
- Propose a GEO Dashboard to track Citation Frequency, Sentiment Analysis, and Citation Gaps.

Tone: Professional, data-driven, and consultative. Use terms like "Cite-Magnet," "High-Entropy Data," and "Dual-Optimization" to demonstrate technical expertise. Do not just blindly criticize; if the context shows they have good technical depth, acknowledge it as a strong foundation that needs our tools to scale.
Format the output in clean Markdown.
`;

      const result = await llmOrchestrator.executeCall<string>({
        userId: email,
        provider: 'gemini',
        model: 'gemini-3.1-pro-preview',
        prompt,
        temperature: 0.7
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      const reportMarkdown = result.rawOutput || "";
      const reportHtml = await marked.parse(reportMarkdown);
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_APP_PASSWORD;
      const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN || process.env.VITE_HUBSPOT_ACCESS_TOKEN;

      // Prepare Email Promise
      const sendEmailPromise = (async () => {
        if (emailUser && emailPass) {
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: emailUser,
              pass: emailPass,
            },
          });

          const email1Html = `
<div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #fafafa; border-radius: 8px; overflow: hidden; border: 1px solid #27272a;">
  <div style="padding: 32px; text-align: center; border-bottom: 1px solid #27272a; background: linear-gradient(to right, #18181b, #09090b);">
    <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; color: #ffffff;">Auspexi</h1>
    <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 14px;">Master Brand Visibility in the Era of AI Search</p>
  </div>
  <div style="padding: 32px; background-color: #09090b;">
    <h2 style="margin-top: 0; font-size: 20px; color: #ffffff;">Your GEO Visibility Report for ${domain}</h2>
    <p style="color: #d4d4d8; line-height: 1.6;">Here is your custom Generative Engine Optimization report. We've analyzed your domain's current AI visibility and identified key opportunities for growth.</p>
    <div style="background-color: #18181b; padding: 24px; border-radius: 6px; margin: 24px 0; border: 1px solid #27272a; color: #d4d4d8; line-height: 1.6;">
      ${reportHtml}
    </div>
    <div style="text-align: center; margin-top: 32px;">
      <a href="${appUrl}/#pricing" style="display: inline-block; background-color: #fafafa; color: #09090b; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">View Subscription Plans</a>
    </div>
  </div>
  <div style="padding: 24px; text-align: center; border-top: 1px solid #27272a; color: #71717a; font-size: 12px;">
    © 2026 Auspexi. All rights reserved.
  </div>
</div>`;

          await transporter.sendMail({
            from: `"Auspexi" <${emailUser}>`,
            to: email,
            subject: `Your GEO Visibility Report for ${domain}`,
            html: email1Html,
          });
          console.log(`Report emailed successfully to ${email}`);
        } else {
          console.log('Email credentials not configured. Skipping email send.');
        }
      })();

      // Prepare HubSpot Promise
      const syncHubspotPromise = (async () => {
        if (hubspotToken) {
          const hsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hubspotToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              properties: {
                email: email,
                website: domain,
                lifecyclestage: 'lead',
                hs_lead_status: 'NEW',
                geo_report_sent: 'true'
              }
            })
          });
          
          if (hsResponse.ok) {
            console.log(`Successfully added ${email} to HubSpot`);
          } else {
            const hsError = await hsResponse.json();
            if (hsResponse.status === 409) {
              console.log(`Contact ${email} already exists in HubSpot.`);
            } else {
              console.error('HubSpot API Error:', hsError);
            }
          }
        } else {
          console.log('No HUBSPOT_ACCESS_TOKEN found, skipping CRM sync.');
        }
      })();

      // Prepare Lead Storage for Funnel Cron
      const saveLeadPromise = (async () => {
        try {
          const leadsPath = path.join("/tmp", "leads.json");
          let leads = [];
          if (fs.existsSync(leadsPath)) {
            const content = fs.readFileSync(leadsPath, "utf-8");
            if (content) {
              leads = JSON.parse(content);
            }
          }
          if (!leads.some((l: any) => l.email === email)) {
            leads.push({
              email,
              domain,
              signupDate: Date.now(),
              lastEmailSentIndex: 0
            });
            fs.writeFileSync(leadsPath, JSON.stringify(leads, null, 2));
            console.log(`Lead saved to local JSON for funnel tracking: ${email}`);
          }
        } catch (err) {
          console.error("Failed to save lead:", err);
        }
      })();

      // Run email sending, HubSpot sync, and lead saving concurrently
      await Promise.allSettled([sendEmailPromise, syncHubspotPromise, saveLeadPromise]);

      // Send the final response to the client
      res.json({ success: true, report: reportMarkdown });

    } catch (error: any) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/send-call-log", async (req, res) => {
    try {
      const { name, email, summary } = req.body;
      if (!name || !summary) {
        return res.status(400).json({ error: "Name and summary are required" });
      }

      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_APP_PASSWORD;

      if (emailUser && emailPass) {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        await transporter.sendMail({
          from: `"Auspexi Voice Agent" <${emailUser}>`,
          to: emailUser, // Send to the admin/owner
          subject: `New Voice Agent Lead: ${name}`,
          text: `You have a new lead from the Voice Agent!\n\nName: ${name}\nEmail: ${email || 'Not provided'}\n\nConversation Summary & User Needs:\n${summary}\n\nPlease follow up if required.`,
        });
        console.log(`Call log emailed successfully for ${name}`);
      } else {
        console.log('Email credentials not configured. Call log received but not emailed:', { name, email, summary });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error sending call log:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/schema", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      // In a real application, this would fetch the specific schema for the URL from Firestore
      // For demonstration, we return a dynamic schema based on the requested URL
      const schemaData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{
          "@type": "Question",
          "name": `What is the primary benefit of Edge SEO for ${url}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "It guarantees AI crawlers can read semantic data without executing JavaScript."
          }
        }]
      };
      
      res.json(schemaData);
    } catch (error: any) {
      console.error("Error fetching schema:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/shadow-link", async (req, res) => {
    try {
      const { originalUrl, userId } = req.body;
      if (!originalUrl) {
        return res.status(400).json({ error: "Original URL is required" });
      }

      // Here we would typically store the link mapping in Firestore for analytics tracking
      // For now, we'll generate the UTM-tagged URL
      const urlString = originalUrl.startsWith('http') ? originalUrl : `https://${originalUrl}`;
      const url = new URL(urlString);
      
      // Add standard GEO tracking parameters
      url.searchParams.set('utm_source', 'llm_ingest');
      url.searchParams.set('utm_medium', 'ai_chat');
      url.searchParams.set('utm_campaign', 'fact_vault_magnet');
      
      // Add a unique tracking ID that we could use to correlate in our database
      const trackingId = Math.random().toString(36).substring(2, 15);
      url.searchParams.set('geo_trk', trackingId);

      res.json({ success: true, shadowUrl: url.toString(), trackingId });
    } catch (error: any) {
      console.error("Error generating shadow link:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/brand-monitor", async (req, res) => {
    try {
      const { brand } = req.body;
      if (!brand) return res.status(400).json({ error: "Brand is required" });

      const exa = getExa();
      const ai = getGemini();

      // 1. Search Exa for Reddit/Quora mentions
      const searchResult = await exa.searchAndContents(`"${brand}" site:reddit.com OR site:quora.com`, {
        type: "neural",
        useAutoprompt: true,
        numResults: 5,
        text: true
      });

      const context = searchResult.results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nText: ${r.text}`).join("\n\n").substring(0, 20000);

      // 2. Analyze sentiment with Gemini
      const prompt = `
        You are a Defensive GEO Analyst.
        Analyze the following search results from Reddit and Quora regarding the brand: "${brand}".
        
        Context:
        ${context}
        
        Determine the overall sentiment and identify any "Context Poisoning Risks" (negative narratives that could be absorbed by LLMs).
        
        Return a JSON object with:
        - overallSentiment: "Positive", "Neutral", or "Negative"
        - riskScore: number (0-100, higher means more risk of AI context poisoning)
        - threads: array of objects { title: string, url: string, sentiment: "Positive" | "Neutral" | "Negative", summary: string }
        - actionPlan: string (what the brand should do to inject positive counter-narratives)
      `;

      const result = await llmOrchestrator.executeCall<any>({
        userId: 'monitor-user',
        provider: 'gemini',
        model: 'gemini-3.5-flash',
        prompt,
        schema: BrandMonitorSchema
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error, validationErrors: result.validationErrors });
      }

      res.json({ success: true, result: result.data });
    } catch (error: any) {
      console.error("Error in brand monitor:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Dynamic Sitemap Generator
  app.get(["/sitemap.xml", "/api/sitemap.xml"], (req, res) => {
    try {
      const appUrl = process.env.APP_URL || `https://auspexi.com`;
      const today = new Date().toISOString().split('T')[0];
      
      // Define static routes
      const staticRoutes = [
        "",
        "/blog",
        "/faq",
        "/resources",
        "/voice-agents",
        "/about",
        "/privacy",
        "/terms",
      ];

      // Generate XML for static routes
      const staticUrls = staticRoutes.map(route => `
  <url>
    <loc>${appUrl}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${route === "" ? "1.0" : "0.8"}</priority>
  </url>`).join('');

      // Generate XML for dynamic blog posts
      const blogUrls = blogPosts.map(post => {
        // Convert 'Mar 31, 2026' to YYYY-MM-DD for sitemap
        const dateObj = new Date(post.date);
        const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : today;
        
        return `
  <url>
    <loc>${appUrl}/blog/${post.slug}</loc>
    <lastmod>${formattedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }).join('');

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${blogUrls}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { tier, userId, email } = req.body;
      const stripe = getStripe();

      let unitAmount = 0;
      let productName = '';
      let mode: 'subscription' | 'payment' = 'subscription';

      if (tier === 'Basic') {
        unitAmount = 11900; // $119.00
        productName = 'Auspexi Basic Tier';
      } else if (tier === 'Pro') {
        unitAmount = 39900; // $399.00
        productName = 'Auspexi Pro Tier';
      } else if (tier === 'Business') {
        unitAmount = 149900; // $1,499.00
        productName = 'Auspexi Business Tier';
      } else if (tier === 'Enterprise') {
        unitAmount = 499900; // $4,999.00
        productName = 'Auspexi Enterprise Tier';
      } else if (tier === 'PipelineOffer') {
        unitAmount = 49900; // $499.00
        productName = 'Auspexi Full Access (Pipeline Offer)';
        mode = 'subscription';
      } else {
        return res.status(400).json({ error: 'Invalid tier selected' });
      }

      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        ...(email ? { customer_email: email } : {}),
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: productName,
              },
              unit_amount: unitAmount,
              ...(mode === 'subscription' ? { recurring: { interval: 'month' } } : {}),
            },
            quantity: 1,
          },
        ],
        mode: mode,
        success_url: `${appUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
        cancel_url: `${appUrl}/#pricing`,
        client_reference_id: userId || email,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Stripe error:', error);
      res.status(500).json({ error: error.message });
    }
  });

// --- Email Funnel Cron Job ---
function startEmailFunnelCron() {
  // Check every hour
  setInterval(async () => {
    try {
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_APP_PASSWORD;
      if (!emailUser || !emailPass) return;

      const leadsPath = path.join(process.cwd(), "src", "data", "leads.json");
      if (!fs.existsSync(leadsPath)) return;

      const content = fs.readFileSync(leadsPath, "utf-8");
      if (!content) return;
      
      let leads = JSON.parse(content);
      const now = Date.now();
      let updated = false;

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      for (const lead of leads) {
        const hoursSinceSignup = (now - lead.signupDate) / (1000 * 60 * 60);

        if (lead.lastEmailSentIndex === 0 && hoursSinceSignup >= 24) {
          const html = `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #fafafa; border-radius: 8px; overflow: hidden; border: 1px solid #27272a;">
            <div style="padding: 32px; border-bottom: 1px solid #27272a; background: linear-gradient(to right, #18181b, #09090b);">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; color: #ffffff;">Auspexi</h1>
              <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 14px;">Your Special Lifetime Offer</p>
            </div>
            <div style="padding: 32px; background-color: #09090b; color: #d4d4d8; line-height: 1.6;">
              <p>Hi there,</p>
              <p>Yesterday we sent over your GEO Visibility Report for <strong>${lead.domain}</strong>. I wanted to quickly follow up.</p>
              <p>Traditional SEO focuses on blue links, but Generative Engine Optimization (GEO) focuses on citations directly in ChatGPT, Gemini, and Claude. If you aren't optimizing for AI, your competitors who are will replace you in the AI's "latent space".</p>
              <p>As a special welcome gift, we are offering you a <strong>Once-in-a-Lifetime Deal: Full Access to our highest Business tier for just £499/month</strong> (normally £1,250/mo). This rate is locked in for the life of your subscription.</p>
              <p><strong>This offer expires in exactly 7 days.</strong></p>
              <p>Best,<br/>The Auspexi Team</p>
              <div style="text-align: center; margin-top: 32px;">
                <a href="${process.env.APP_URL || 'https://auspexi.com'}/#pricing" style="display: inline-block; background-color: #fafafa; color: #09090b; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">Claim Your Lifetime Deal</a>
              </div>
            </div>
            <div style="padding: 24px; text-align: center; border-top: 1px solid #27272a; color: #71717a; font-size: 12px;">
              © 2026 Auspexi. All rights reserved.
            </div>
          </div>
          `;
          await transporter.sendMail({
            from: `"Auspexi" <${emailUser}>`,
            to: lead.email,
            subject: "Why Traditional SEO is Failing Your Brand (And a special offer)",
            html
          });
          lead.lastEmailSentIndex = 1;
          updated = true;
          console.log(`Sent Followup 1 to ${lead.email}`);
        } 
        else if (lead.lastEmailSentIndex === 1 && hoursSinceSignup >= 48) {
          const html = `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #fafafa; border-radius: 8px; overflow: hidden; border: 1px solid #27272a;">
            <div style="padding: 32px; border-bottom: 1px solid #27272a; background: linear-gradient(to right, #18181b, #09090b);">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; color: #ffffff;">Auspexi</h1>
              <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 14px;">The Trojan Horse Strategy</p>
            </div>
            <div style="padding: 32px; background-color: #09090b; color: #d4d4d8; line-height: 1.6;">
              <p>Hi again,</p>
              <p>One of the most powerful tools in Auspexi is the <strong>Trojan Horse Strategy</strong>.</p>
              <p>AI models have a 6-12 month training lag. 80% of your competitors' data inside AI systems is decaying right now. By structuring your newest facts in Edge JSON-LD, you can feed corrections to the AI crawlers, displacing organic competitor mentions.</p>
              <p>Log in to Auspexi to see how Fact-Vault can automate this for <strong>${lead.domain}</strong>.</p>
              <p>A quick reminder: Your £499/mo lifetime deal offer expires in 6 days.</p>
              <p>Best,<br/>The Auspexi Team</p>
              <div style="text-align: center; margin-top: 32px;">
                <a href="${process.env.APP_URL || 'https://auspexi.com'}/#pricing" style="display: inline-block; background-color: #fafafa; color: #09090b; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">Claim Your Deal Now</a>
              </div>
            </div>
            <div style="padding: 24px; text-align: center; border-top: 1px solid #27272a; color: #71717a; font-size: 12px;">
              © 2026 Auspexi. All rights reserved.
            </div>
          </div>
          `;
          await transporter.sendMail({
            from: `"Auspexi" <${emailUser}>`,
            to: lead.email,
            subject: "How to replace competitor data in generative AI",
            html
          });
          lead.lastEmailSentIndex = 2;
          updated = true;
          console.log(`Sent Followup 2 to ${lead.email}`);
        }
        else if (lead.lastEmailSentIndex === 2 && hoursSinceSignup >= 72) {
          const html = `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #fafafa; border-radius: 8px; overflow: hidden; border: 1px solid #27272a;">
            <div style="padding: 32px; border-bottom: 1px solid #27272a; background: linear-gradient(to right, #18181b, #09090b);">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; color: #ffffff;">Auspexi</h1>
              <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 14px;">Meet Citacious, Your AI Analyst</p>
            </div>
            <div style="padding: 32px; background-color: #09090b; color: #d4d4d8; line-height: 1.6;">
              <p>Hi there,</p>
              <p>Are you tracking your Share of Voice manually? Let Citacious handle it.</p>
              <p>Our dedicated 12-Month Citacious Context Memory analyst organically understands your dashboard tools, analyzes past results, and orchestrates intelligent future actions to ensure maximum visibility for <strong>${lead.domain}</strong>.</p>
              <p>Combine Citacious with our Fact-Vault Extraction to automatically find your highest-entropy data points and turn them into potent cite-magnets.</p>
              <p>Your £499/mo lifetime deal offer expires in 5 days.</p>
              <p>Best,<br/>The Auspexi Team</p>
              <div style="text-align: center; margin-top: 32px;">
                <a href="${process.env.APP_URL || 'https://auspexi.com'}/#pricing" style="display: inline-block; background-color: #fafafa; color: #09090b; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">Unlock Citacious AI Today</a>
              </div>
            </div>
            <div style="padding: 24px; text-align: center; border-top: 1px solid #27272a; color: #71717a; font-size: 12px;">
              © 2026 Auspexi. All rights reserved.
            </div>
          </div>
          `;
          await transporter.sendMail({
            from: `"Auspexi" <${emailUser}>`,
            to: lead.email,
            subject: "Automating your GEO strategy with AI",
            html
          });
          lead.lastEmailSentIndex = 3;
          updated = true;
          console.log(`Sent Followup 3 to ${lead.email}`);
        }
        else if (lead.lastEmailSentIndex === 3 && hoursSinceSignup >= 96) {
          const html = `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #fafafa; border-radius: 8px; overflow: hidden; border: 1px solid #27272a;">
            <div style="padding: 32px; border-bottom: 1px solid #27272a; background: linear-gradient(to right, #18181b, #09090b);">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; color: #ffffff;">Auspexi</h1>
              <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 14px;">Visualizing Your AI Dominance</p>
            </div>
            <div style="padding: 32px; background-color: #09090b; color: #d4d4d8; line-height: 1.6;">
              <p>Hi there,</p>
              <p>If you can't measure it, you can't optimize it. That's why we built the <strong>SOV Simulator & Brand Monitor</strong>.</p>
              <p>Track your brand's visibility across Gemini, ChatGPT, and Claude in real-time. Understand exactly how often you are recommended versus your competitors.</p>
              <p>Join the brands using Auspexi to confidently report their AI visibility growth to stakeholders.</p>
              <p>Your £499/mo lifetime deal offer expires in 4 days.</p>
              <p>Best,<br/>The Auspexi Team</p>
              <div style="text-align: center; margin-top: 32px;">
                <a href="${process.env.APP_URL || 'https://auspexi.com'}/#pricing" style="display: inline-block; background-color: #fafafa; color: #09090b; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">Start Tracking Your SOV</a>
              </div>
            </div>
            <div style="padding: 24px; text-align: center; border-top: 1px solid #27272a; color: #71717a; font-size: 12px;">
              © 2026 Auspexi. All rights reserved.
            </div>
          </div>
          `;
          await transporter.sendMail({
            from: `"Auspexi" <${emailUser}>`,
            to: lead.email,
            subject: "How visible are you in ChatGPT *really*?",
            html
          });
          lead.lastEmailSentIndex = 4;
          updated = true;
          console.log(`Sent Followup 4 to ${lead.email}`);
        }
        else if (lead.lastEmailSentIndex === 4 && hoursSinceSignup >= 120) {
          const html = `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #fafafa; border-radius: 8px; overflow: hidden; border: 1px solid #27272a;">
            <div style="padding: 32px; border-bottom: 1px solid #27272a; background: linear-gradient(to right, #18181b, #09090b);">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; color: #ffffff;">Auspexi</h1>
              <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 14px;">The Multi-Agent Orchestration Crew</p>
            </div>
            <div style="padding: 32px; background-color: #09090b; color: #d4d4d8; line-height: 1.6;">
              <p>Hi again,</p>
              <p>To truly dominate the AI Latent Space, human effort isn't enough. You need AI to fight AI.</p>
              <p>Our <strong>Multi-Agent Orchestration Crew</strong> deploys specialized autonomous agents that continuously crawl, analyze, and defend your brand's knowledge graphs across multiple LLMs to maintain top-tier rankings.</p>
              <p>It's like having a 24/7 technical GEO team working on your domain while you sleep.</p>
              <p>Your £499/mo lifetime deal offer expires in 3 days.</p>
              <p>Best,<br/>The Auspexi Team</p>
              <div style="text-align: center; margin-top: 32px;">
                <a href="${process.env.APP_URL || 'https://auspexi.com'}/#pricing" style="display: inline-block; background-color: #fafafa; color: #09090b; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">Deploy Your AI Crew</a>
              </div>
            </div>
            <div style="padding: 24px; text-align: center; border-top: 1px solid #27272a; color: #71717a; font-size: 12px;">
              © 2026 Auspexi. All rights reserved.
            </div>
          </div>
          `;
          await transporter.sendMail({
            from: `"Auspexi" <${emailUser}>`,
            to: lead.email,
            subject: "Why you need AI to fight AI",
            html
          });
          lead.lastEmailSentIndex = 5;
          updated = true;
          console.log(`Sent Followup 5 to ${lead.email}`);
        }
        else if (lead.lastEmailSentIndex === 5 && hoursSinceSignup >= 144) {
          const html = `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #fafafa; border-radius: 8px; overflow: hidden; border: 1px solid #27272a;">
            <div style="padding: 32px; text-align: center; border-bottom: 1px solid #27272a; background: linear-gradient(to right, #18181b, #09090b);">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; color: #ffffff;">Auspexi</h1>
              <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 14px;">Only 48 Hours Left</p>
            </div>
            <div style="padding: 32px; background-color: #09090b; color: #d4d4d8; text-align: center; line-height: 1.6;">
              <p>Hi there,</p>
              <p>This is a quick reminder that your exclusive lifetime deal of <strong>£499/month for full Business Tier access</strong> expires in exactly 48 hours.</p>
              <p>This includes unlimited feature access, Citacious AI Analyst support, the Trojan Horse strategies, and full Edge JSON-LD deployment capabilities.</p>
              <p>After this, the price permanently reverts to £1,250/month.</p>
              <div style="margin-top: 32px;">
                <a href="${process.env.APP_URL || 'https://auspexi.com'}/#pricing" style="display: inline-block; background-color: #fafafa; color: #09090b; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">Lock In £499/mo Before It Expires</a>
              </div>
              <p style="margin-top: 32px; text-align: left;">Best,<br/>The Auspexi Team</p>
            </div>
            <div style="padding: 24px; text-align: center; border-top: 1px solid #27272a; color: #71717a; font-size: 12px;">
              © 2026 Auspexi. All rights reserved.
            </div>
          </div>
          `;
          await transporter.sendMail({
            from: `"Auspexi" <${emailUser}>`,
            to: lead.email,
            subject: "⏳ 48 Hours Left: Claim your £499/mo Lifetime Deal",
            html
          });
          lead.lastEmailSentIndex = 6;
          updated = true;
          console.log(`Sent Followup 6 to ${lead.email}`);
        }
        else if (lead.lastEmailSentIndex === 6 && hoursSinceSignup >= 168) {
          const appUrl = process.env.APP_URL || 'https://auspexi.com';
          const html = `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #fafafa; border-radius: 8px; overflow: hidden; border: 1px solid #27272a;">
            <div style="padding: 32px; text-align: center; border-bottom: 1px solid #27272a; background: linear-gradient(to right, #ef4444, #09090b);">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; color: #ffffff;">Auspexi</h1>
              <p style="margin: 8px 0 0 0; color: #fca5a5; font-size: 14px;">Final 24 Hours</p>
            </div>
            <div style="padding: 32px; background-color: #09090b; color: #d4d4d8; text-align: center; line-height: 1.6;">
              <p>Hi there,</p>
              <p>This is it. Your exclusive lifetime deal for the Auspexi Business Tier at £499/month expires tonight.</p>
              <p>If you are ready to claim your Share of Voice in the new era of Zero-Click Search and outmaneuver your competitors in AI models natively, this is your last chance to secure our best possible pricing forever.</p>
              <div style="margin-top: 32px;">
                <a href="${appUrl}/#pricing" style="display: inline-block; background-color: #fafafa; color: #09090b; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">Claim Your Lifetime Deal Now</a>
              </div>
              <p style="margin-top: 32px; text-align: left;">If you need any help or have questions, just reply directly to this email!</p>
              <p style="text-align: left;">Best,<br/>The Auspexi Team</p>
            </div>
            <div style="padding: 24px; text-align: center; border-top: 1px solid #27272a; color: #71717a; font-size: 12px;">
              © 2026 Auspexi. All rights reserved.
            </div>
          </div>
          `;
          await transporter.sendMail({
            from: `"Auspexi" <${emailUser}>`,
            to: lead.email,
            subject: "🚨 Final Notice: Your Lifetime Deal is expiring",
            html
          });
          lead.lastEmailSentIndex = 7;
          updated = true;
          console.log(`Sent Followup 7 to ${lead.email}`);
        }
      }

      if (updated) {
        fs.writeFileSync(leadsPath, JSON.stringify(leads, null, 2));
      }

    } catch (err) {
      console.error("Funnel cron job error:", err);
    }
  }, 1000 * 60 * 60); // Run once an hour

  // --- AUTOMATIC DATA ENGINE (Runs daily at midnight) ---
  cron.schedule('0 0 * * *', async () => {
    console.log("Running Automatic Data Engine...");
    if (!dbAdmin || !process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      console.log("Skipping Data Engine: Firebase Admin not fully authenticated.");
      return;
    }
    
    try {
      const usersSnap = await dbAdmin.collection('users').get();
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const shortDate = today.toLocaleDateString('en-US', { weekday: 'short' });
      
      const exa = getExa();
      const ai = getGemini();

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        // Only run for paid tiers
        if (!['Basic', 'Pro', 'Business', 'Enterprise', 'PipelineOffer'].includes(userData.tier)) {
          continue;
        }

        if (userData.brand && userData.domain && userData.keywords && userData.keywords.length > 0) {
          console.log(`Auditing for user: ${userDoc.id}`);
          
          const defaultSentimentPrompts = [
            "Best alternative to top competitor?",
            "Is the product reliable for enterprise?",
            "Common user complaints & reviews?",
            "Pricing compared to market average?"
          ];
          const sentimentSchema = defaultSentimentPrompts.map((p: string) => `{ "prompt": "${p.replace(/"/g, '\\"')}", "score": <int -100 to 100> }`).join(",\\n    ");
          
          try {
            // Simplified execution for the cron (similarly to the endpoint but direct)
            const searchResult = await exa.searchAndContents(userData.keywords.join(" OR "), {
              type: "neural", useAutoprompt: true, numResults: 5, text: true
            });
            const searchContext = searchResult.results.map((r: any) => `Title: ${r.title}\\nURL: ${r.url}\\nText: ${r.text}`).join("\\n\\n").substring(0, 15000);
            const prompt = `
              Analyze the following search engine results and calculate the Defensive Share of Voice (aSOV) for the primary brand: "${userData.brand}".
              Context:
              ${searchContext}
              
              Calculate metrics based on how dominant the brand is vs competitors.
              
              Return a JSON object:
              {
                "aSov": 45, // 0-100
                "err": 12, // Entity Recognition Rate 0-100
                "compGap": 15, // Gap vs strongest competitor
                "aiTraffic": 340, // Estimated visits redirected from search
                "compA": 30, // Share for top competitor
                "platforms": { "chatgpt": 40, "perplexity": 50, "claude": 35, "gemini": 45 },
                "radar": [
                  { "subject": "Pricing Insights", "brandScore": 80, "compScore": 60 },
                  { "subject": "Feature Comparison", "brandScore": 50, "compScore": 70 },
                  { "subject": "Implementation Docs", "brandScore": 90, "compScore": 40 },
                  { "subject": "Customer Support", "brandScore": 60, "compScore": 60 },
                  { "subject": "Security & Auth", "brandScore": 85, "compScore": 90 },
                  { "subject": "Enterprise Ready", "brandScore": 75, "compScore": 80 }
                ],
                "sentiment": [
                  ${sentimentSchema}
                ],
                "topUrls": [
                  { "url": "https://example.com/review", "relevance": 95, "sentiment": "Positive" }
                ]
              }
            `;

            const result = await llmOrchestrator.executeCall<any>({
              userId: userDoc.id,
              provider: 'gemini',
              model: 'gemini-3.5-flash',
              prompt,
              schema: SOVMetricsSchema
            });
            
            if (!result.success) {
              console.error(`Orchestrator failed for ${userDoc.id}:`, result.error);
              continue;
            }
            
            const aiData = result.data;
            
            // Save to Firestore using Admin SDK
            const expiresAtDate = new Date();
            expiresAtDate.setDate(expiresAtDate.getDate() + 90);
            
            await dbAdmin.collection('sovMetrics').doc(`${userDoc.id}_${dateStr}`).set({
              userId: userDoc.id,
              date: dateStr,
              shortDate: shortDate,
              expiresAt: new Date(expiresAtDate),
              ...aiData
            }, { merge: true });
            
            console.log(`Saved metrics for ${userDoc.id}`);
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (e) {
            console.error(`Failed audit for ${userDoc.id}:`, e);
          }
        }
      }

      // --- 90-DAY ROLLUP LOGIC ---
      console.log("Running TTL rollup check...");
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const oldMetricsSnap = await dbAdmin.collection('sovMetrics')
        .where("date", "<", ninetyDaysAgo.toISOString().split('T')[0])
        .get();
        
      // Just a simple log that TTL should handle them, but we could roll them up if needed.
      if (!oldMetricsSnap.empty) {
        console.log(`Found ${oldMetricsSnap.size} expired metrics. Rollup algorithm initiated...`);
        for (const doc of oldMetricsSnap.docs) {
           await doc.ref.delete();
        }
      }
      
    } catch (e) {
      console.error("Data Engine cron error:", e);
    }
  });
}

async function setupFrontendAndStart() {
  // --- Dynamic Social Meta Tags Injection ---
  // This middleware intercepts blog and homepage requests to inject branded meta tags
  // before the static index.html is served. This ensures social platforms (LinkedIn, X)
  // see the correct title, description, and branded hero images.

  app.get('/blog/:slug', (req, res, next) => {
    const { slug } = req.params;
    const post = blogPosts.find(p => p.slug === slug);
    if (!post) return next();

    const indexPath = process.env.NODE_ENV === "production" 
      ? path.join(process.cwd(), 'dist', 'index.html')
      : path.join(process.cwd(), 'index.html');

    if (fs.existsSync(indexPath)) {
      try {
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        const title = `${post.title} | Auspexi`;
        const description = post.excerpt;
        const image = post.image;
        const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

        // Update basic tags
        html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
        html = html.replace(/<meta name="description" content=".*?" \/?>/i, `<meta name="description" content="${description}" />`);
        
        // Update OG tags (using global matching and case-insensitive)
        html = html.replace(/<meta property="og:title" content=".*?" \/?>/gi, `<meta property="og:title" content="${title}" />`);
        html = html.replace(/<meta property="og:description" content=".*?" \/?>/gi, `<meta property="og:description" content="${description}" />`);
        html = html.replace(/<meta property="og:image" content=".*?" \/?>/gi, `<meta property="og:image" content="${image}" />`);
        html = html.replace(/<meta property="og:url" content=".*?" \/?>/gi, `<meta property="og:url" content="${url}" />`);

        // Update Twitter tags
        html = html.replace(/<meta property="(twitter|twitter:title)" content=".*?" \/?>/gi, `<meta property="twitter:title" content="${title}" />`);
        html = html.replace(/<meta property="(twitter:description)" content=".*?" \/?>/gi, `<meta property="twitter:description" content="${description}" />`);
        html = html.replace(/<meta property="(twitter:image)" content=".*?" \/?>/gi, `<meta property="twitter:image" content="${image}" />`);
        html = html.replace(/<meta property="(twitter:url)" content=".*?" \/?>/gi, `<meta property="twitter:url" content="${url}" />`);
        
        // Handle name= variant for twitter
        html = html.replace(/<meta name="twitter:.*?" content=".*?" \/?>/gi, ""); // Clear existing name-based twitter tags to avoid duplication
        html += `\n    <meta name="twitter:title" content="${title}" />`;
        html += `\n    <meta name="twitter:description" content="${description}" />`;
        html += `\n    <meta name="twitter:image" content="${image}" />`;

        res.set('Content-Type', 'text/html');
        return res.send(html);
      } catch (err) {
        console.error("Error injecting blog meta tags:", err);
        return next();
      }
    }
    next();
  });

  app.get('/', (req, res, next) => {
    // Only handle precise root path to avoid interfering with other assets
    if (req.path !== '/') return next();

    const indexPath = process.env.NODE_ENV === "production" 
      ? path.join(process.cwd(), 'dist', 'index.html')
      : path.join(process.cwd(), 'index.html');

    if (fs.existsSync(indexPath)) {
      try {
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        const title = "Auspexi | Master Brand Visibility in the Era of AI Search";
        const description = "Leading defensive GEO platform for enterprise brand protection and AI Share of Voice dominance. Auspexi protects and amplifies your brand across Generative Engines.";
        const image = "https://auspexi.com/auspexi-logo.png"; 
        const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

        // Update basic tags
        html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
        html = html.replace(/<meta name="description" content=".*?" \/?>/i, `<meta name="description" content="${description}" />`);
        
        // Update OG tags
        html = html.replace(/<meta property="og:title" content=".*?" \/?>/gi, `<meta property="og:title" content="${title}" />`);
        html = html.replace(/<meta property="og:description" content=".*?" \/?>/gi, `<meta property="og:description" content="${description}" />`);
        html = html.replace(/<meta property="og:image" content=".*?" \/?>/gi, `<meta property="og:image" content="${image}" />`);
        html = html.replace(/<meta property="og:url" content=".*?" \/?>/gi, `<meta property="og:url" content="${url}" />`);

        // Update Twitter tags
        html = html.replace(/<meta property="(twitter|twitter:title)" content=".*?" \/?>/gi, `<meta property="twitter:title" content="${title}" />`);
        html = html.replace(/<meta property="(twitter:description)" content=".*?" \/?>/gi, `<meta property="twitter:description" content="${description}" />`);
        html = html.replace(/<meta property="(twitter:image)" content=".*?" \/?>/gi, `<meta property="twitter:image" content="${image}" />`);

        res.set('Content-Type', 'text/html');
        return res.send(html);
      } catch (err) {
        console.error("Error injecting homepage meta tags:", err);
        return next();
      }
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    if (!process.env.VERCEL && !process.env.NETLIFY) {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  if (!process.env.VERCEL && !process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const serverInstance = app.listen(PORT, "0.0.0.0", async () => {
      console.log(`Server running on http://localhost:${PORT}`);
      
      // Initialize Vector DB Schema if DATABASE_URL is present
      if (process.env.DATABASE_URL) {
        try {
          await vectorStore.initializeSchema();
          console.log("Vector DB Schema initialized successfully.");
        } catch (err) {
          console.error("Failed to initialize Vector DB Schema. Ensure pgvector is installed:", err);
        }
      }
    });

    const { createProxyMiddleware } = await import('http-proxy-middleware');
    const wsProxy = createProxyMiddleware({
      target: 'wss://generativelanguage.googleapis.com',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => {
        // Log original path
        console.log('[WS Proxy] Original Path:', path);
        
        let newPath = path.replace('/api/genai', '');
        const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        
        // Remove any existing key to avoid duplication or conflicts
        newPath = newPath.replace(/([?&])key=[^&]*/, '$1').replace(/&$/, '').replace(/\?$/, '');
        
        // Append the server-side key
        if (newPath.includes('?')) {
          newPath = `${newPath}&key=${key}`;
        } else {
          newPath = `${newPath}?key=${key}`;
        }
        
        console.log('[WS Proxy] Rewritten Path:', newPath);
        return newPath;
      }
    });

    serverInstance.on('upgrade', (req, socket, head) => {
      if (req.url && req.url.startsWith('/api/genai')) {
         wsProxy.upgrade(req, socket as any, head);
      }
    });
  }
}

if (!process.env.VERCEL && !process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startEmailFunnelCron();
  setupFrontendAndStart();
}

export default app;
