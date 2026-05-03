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

dotenv.config();

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
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    geminiClient = new GoogleGenAI({ apiKey: key });
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
  fact: z.string().min(5, "Fact is too short.").max(1000, "Fact is too long. Maximum 1000 characters allowed."),
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
app.use(express.json());

// API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Auspexi Backend is running" });
  });

  // Mock "Customer Backend" Webhook Endpoints
  app.post("/api/webhooks/auspexi", (req, res) => {
    try {
      const payload = req.body;
      console.log("----- RECEIVED WEBHOOK FROM AUSPEXI -----");
      console.log(JSON.stringify(payload, null, 2));
      
      const logsPath = path.join(process.cwd(), "src", "data", "webhookLogs.json");
      
      let logs = [];
      if (fs.existsSync(logsPath)) {
        logs = JSON.parse(fs.readFileSync(logsPath, "utf-8"));
      }
      
      logs.push({
        timestamp: new Date().toISOString(),
        payload
      });
      
      fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));
      
      res.json({ success: true, message: "Webhook received and logged securely." });
    } catch (err: any) {
      console.error("Webhook processing error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/webhooks/logs", (req, res) => {
    try {
      const logsPath = path.join(process.cwd(), "src", "data", "webhookLogs.json");
      if (fs.existsSync(logsPath)) {
        res.json(JSON.parse(fs.readFileSync(logsPath, "utf-8")));
      } else {
        res.json([]);
      }
    } catch(err: any) {
      res.status(500).json({ error: "Failed to read logs" });
    }
  });

  app.post("/api/amplify", aiLimiter, async (req, res) => {
    try {
      // Layer 1: Input Validation
      const parsed = amplifyRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request data", details: parsed.error.issues });
      }
      const { fact } = parsed.data;

      // Layer 2: Prompt Injection Detection
      if (detectPromptInjection(fact)) {
        console.warn(`[SECURITY] Prompt injection detected from IP: ${req.ip}`);
        return res.status(400).json({ error: "Security Policy Violation: Invalid input pattern detected." });
      }

      const ai = getGemini();
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

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      // Layer 3: Output Filtering
      const rawOutput = response.text || "{}";
      const filteredOutput = filterSensitiveData(rawOutput);

      res.json(JSON.parse(filteredOutput));
    } catch (error: any) {
      console.error("Error generating omnichannel content:", error);
      res.status(500).json({ error: "Internal server error during generation" });
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
      const ai = getGemini();

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

Return ONLY a JSON object with the following structure, using derived or highly plausible estimates based on the context:
{
  "brand": <integer percentage for ${brand}>,
  "compA": <integer percentage for ${competitors[0] || 'Competitor A'}>,
  "compB": <integer percentage for ${competitors[1] || 'Competitor B'}>,
  "aiCitations": <integer count of explicit brand citations>,
  "entityRecall": <integer 0-100 indicating how robustly AI remembers brand facts>,
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

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
      } catch (geminiError: any) {
        console.warn("Primary Gemini model failed, trying fallback:", geminiError.message);
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
      }

      const rawOutput = response.text || "{}";
      const parsedData = JSON.parse(rawOutput);

      res.json({ 
        success: true, 
        metrics: {
          aSov: parsedData.brand || 12,
          err: parsedData.entityRecall || 20,
          compA: parsedData.compA || 40,
          compB: parsedData.compB || 30,
          compC: parsedData.compC || 0,
          compD: parsedData.compD || 0,
          compGap: (parsedData.brand || 12) - (parsedData.compA || 40),
          aiTraffic: (parsedData.aiCitations || 2) * 15 + Math.floor(Math.random() * 50),
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

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
      } catch (geminiError: any) {
        console.warn("Primary Gemini model failed, trying fallback:", geminiError.message);
        // Fallback to a highly available model if the preview model is experiencing high demand (503)
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
      }

      const reportMarkdown = response.text || "";
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
          const leadsPath = path.join(process.cwd(), "src", "data", "leads.json");
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
        unitAmount = 8900; // $89.00
        productName = 'Auspexi Basic Tier';
      } else if (tier === 'Medium') {
        unitAmount = 149900; // $1,499.00
        productName = 'Auspexi Medium Tier';
      } else if (tier === 'Premium') {
        unitAmount = 499900; // $4,999.00
        productName = 'Auspexi Premium Tier';
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
}

async function setupFrontendAndStart() {
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
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL && !process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startEmailFunnelCron();
  setupFrontendAndStart();
}

export default app;
