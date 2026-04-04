import express from "express";
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const reportMarkdown = response.text || "";
      const reportHtml = await marked.parse(reportMarkdown);
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

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

          // Email 1: The Report
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

          // Email 2: Countdown Reminder (Simulated delay of 1 minute for demo purposes)
          // In a production environment, this would be handled by a cron job or a service like Resend/SendGrid drip campaigns.
          setTimeout(async () => {
            const email2Html = `
<div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #fafafa; border-radius: 8px; overflow: hidden; border: 1px solid #27272a;">
  <div style="padding: 32px; text-align: center; border-bottom: 1px solid #27272a; background: linear-gradient(to right, #18181b, #09090b);">
    <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; color: #ffffff;">Auspexi</h1>
  </div>
  <div style="padding: 32px; background-color: #09090b;">
    <h2 style="margin-top: 0; font-size: 20px; color: #fbbf24;">⏳ 48 Hours Left: Lock in your Lifetime Discount</h2>
    <p style="color: #d4d4d8; line-height: 1.6;">Hi there,</p>
    <p style="color: #d4d4d8; line-height: 1.6;">We hope you found the GEO report for <strong>${domain}</strong> valuable. The AI search landscape is shifting rapidly, and early adopters are capturing the lion's share of AI Share of Voice (SOV).</p>
    <p style="color: #d4d4d8; line-height: 1.6;">As a thank you for trying our free report, we're offering you a <strong>frozen lifetime discount</strong> on our Premium tier. This offer expires in 48 hours.</p>
    
    <div style="background-color: #18181b; padding: 24px; border-radius: 6px; margin: 24px 0; border: 1px solid #27272a; text-align: center;">
      <h3 style="margin-top: 0; color: #fafafa;">The Pipeline Offer</h3>
      <p style="color: #a1a1aa; margin-bottom: 24px;">Full access to all Auspexi tools, forever.</p>
      <a href="${appUrl}/#pricing" style="display: inline-block; background-color: #fbbf24; color: #09090b; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Claim Your Lifetime Deal</a>
    </div>
  </div>
  <div style="padding: 24px; text-align: center; border-top: 1px solid #27272a; color: #71717a; font-size: 12px;">
    © 2026 Auspexi. All rights reserved.
  </div>
</div>`;
            try {
              await transporter.sendMail({
                from: `"Auspexi" <${emailUser}>`,
                to: email,
                subject: `⏳ 48 Hours Left: Lock in your Lifetime Discount`,
                html: email2Html,
              });
              console.log(`Email 2 (Countdown) sent to ${email}`);
            } catch (e) {
              console.error("Failed to send Email 2:", e);
            }
          }, 60 * 1000); // 1 minute delay

          // Email 3: Final Attempt + Bonus (Simulated delay of 2 minutes for demo purposes)
          setTimeout(async () => {
            const email3Html = `
<div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #fafafa; border-radius: 8px; overflow: hidden; border: 1px solid #27272a;">
  <div style="padding: 32px; text-align: center; border-bottom: 1px solid #27272a; background: linear-gradient(to right, #18181b, #09090b);">
    <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em; color: #ffffff;">Auspexi</h1>
  </div>
  <div style="padding: 32px; background-color: #09090b;">
    <h2 style="margin-top: 0; font-size: 20px; color: #ef4444;">Final Notice + Exclusive Bonus 🎁</h2>
    <p style="color: #d4d4d8; line-height: 1.6;">Hi there,</p>
    <p style="color: #d4d4d8; line-height: 1.6;">This is your last chance to grab the Auspexi lifetime deal for <strong>${domain}</strong>. After today, the price goes back to normal.</p>
    <p style="color: #d4d4d8; line-height: 1.6;">To make this an absolute no-brainer, if you sign up today, we're including a <strong>Free Custom Voice Agent Setup</strong> (a $999 value).</p>
    
    <ul style="color: #d4d4d8; line-height: 1.6; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Lifetime frozen pricing</li>
      <li style="margin-bottom: 8px;">Full access to Cite-Magnet Injections & Fact-Vault</li>
      <li style="margin-bottom: 8px;"><strong>BONUS:</strong> Custom AI Voice Agent trained on your domain</li>
    </ul>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${appUrl}/#pricing" style="display: inline-block; background-color: #fafafa; color: #09090b; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">Secure Your Deal & Bonus</a>
    </div>
  </div>
  <div style="padding: 24px; text-align: center; border-top: 1px solid #27272a; color: #71717a; font-size: 12px;">
    © 2026 Auspexi. All rights reserved.
  </div>
</div>`;
            try {
              await transporter.sendMail({
                from: `"Auspexi" <${emailUser}>`,
                to: email,
                subject: `Final Notice + Bonus: Free Voice Agent Setup`,
                html: email3Html,
              });
              console.log(`Email 3 (Final Offer) sent to ${email}`);
            } catch (e) {
              console.error("Failed to send Email 3:", e);
            }
          }, 2 * 60 * 1000); // 2 minutes delay

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
  app.get("/sitemap.xml", (req, res) => {
    try {
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      const today = new Date().toISOString().split('T')[0];
      
      // Define static routes
      const staticRoutes = [
        "",
        "/blog",
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
