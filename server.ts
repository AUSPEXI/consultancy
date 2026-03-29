import express from "express";
import path from "path";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";
import Exa from "exa-js";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";

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
    const key = process.env.EXA_API_KEY;
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
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    geminiClient = new GoogleGenAI({ apiKey: key });
  }
  return geminiClient;
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Auspexi Backend is running" });
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
Generate a comprehensive sales funnel report for the domain: ${domain}.
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const reportMarkdown = response.text;

      // Send email via Google Workspace
      try {
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
            from: `"Auspexi" <${emailUser}>`,
            to: email,
            subject: `Your GEO Visibility Report for ${domain}`,
            text: `Here is your Generative Engine Optimization report for ${domain}:\n\n${reportMarkdown}`,
          });
          console.log(`Report emailed successfully to ${email}`);
        } else {
          console.log('Email credentials not configured. Skipping email send.');
        }
      } catch (emailErr) {
        console.error('Failed to send email:', emailErr);
        // Don't fail the whole request if email fails
      }

      res.json({ success: true, report: reportMarkdown });
    } catch (error: any) {
      console.error("Error generating report:", error);
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
  setupFrontendAndStart();
}

export default app;
