export interface FAQItem {
  question: string;
  answer: string;
  link?: { text: string; href: string };
}

export interface FAQCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  items: FAQItem[];
}

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'fundamentals',
    title: 'GEO Fundamentals',
    description: 'What Generative Engine Optimization is, why it matters now, and how it differs from traditional SEO.',
    icon: 'Zap',
    items: [
      {
        question: 'What is Generative Engine Optimization (GEO)?',
        answer: 'Generative Engine Optimization (GEO) is the discipline of engineering your brand\'s knowledge presence so that AI language models (ChatGPT, Gemini, Claude, and Perplexity) cite your brand as an authoritative source when answering relevant queries. Unlike traditional SEO, which ranks blue links, GEO ensures your facts, data, and brand narrative are embedded in the knowledge layer that AI models retrieve from. L8EntSpace was built specifically to measure, improve, and automate this process at scale.',
        link: { text: 'Read the CEO\'s GEO guide', href: '/blog/ceo-guide-to-geo-growth-lever' },
      },
      {
        question: 'What is Answer Engine Optimization (AEO)?',
        answer: 'Answer Engine Optimization (AEO) is the practice of structuring content so that answer engines (Google AI Overviews, ChatGPT, Perplexity, featured snippets, and voice assistants) select your content as the definitive answer to a question. AEO grew out of featured-snippet optimisation and overlaps heavily with GEO: AEO focuses on being the answer to a specific question, while GEO focuses on being cited as the authoritative source inside generated responses. L8EntSpace\'s platform covers both: citation probes measure GEO outcomes, while the Content Scorer and FAQ schema tooling optimise the answer-shaped structure AEO requires.',
      },
      {
        question: 'How do GEO, AEO, and SEO relate to each other?',
        answer: 'SEO, AEO, and GEO are three layers of the same visibility problem. SEO earns ranking positions in traditional link-based results. AEO earns selection as the direct answer (featured snippets, AI Overviews, voice responses). GEO earns citation inside generative AI responses across ChatGPT, Gemini, Claude, and Perplexity. They share foundations (crawlability, structured data, authority) but optimise different selection mechanisms: SEO targets ranking algorithms, AEO targets answer extraction, GEO targets the knowledge layer LLMs synthesise from. A complete strategy runs all three; L8EntSpace instruments the GEO and AEO layers with live measurement.',
      },
      {
        question: 'How is GEO different from traditional SEO?',
        answer: 'Traditional SEO optimises for ranking algorithms (keywords, backlinks, and technical site structure) to place a link on a search engine results page. GEO optimises for generative models, which synthesise information from across the web and deliver a direct answer without requiring a click. The target in SEO is a top-10 ranking; the target in GEO is a citation inside the AI\'s response itself. Brands optimised only for SEO will rank well in traditional search but remain invisible in AI-generated responses without GEO.',
      },
      {
        question: 'Why has search changed so fundamentally?',
        answer: 'A fast-growing share of search journeys now begins with an AI engine rather than a traditional search page. Users increasingly ask ChatGPT, Gemini, or Perplexity for answers and act on those answers directly, bypassing ranked links entirely. This shift from keyword matching to knowledge synthesis has made the underlying content quality (not the technical SEO wrapper) the decisive visibility factor.',
        link: { text: 'Why the blue link is dying', href: '/blog/death-of-blue-link' },
      },
      {
        question: 'What is a "zero-click search" and why does it matter for brands?',
        answer: 'A zero-click search is a query resolved entirely within the AI interface, with no click-through to an external website. When AI answers a question using your brand\'s data, the user gains awareness of your brand without ever visiting your site. Brands not optimised for citation in AI responses are invisible in zero-click searches, which now represent the majority of informational queries across Google\'s AI Overviews, ChatGPT, and Perplexity.',
      },
      {
        question: 'What is AI Share of Voice (A-SoV)?',
        answer: 'AI Share of Voice (A-SoV) is the percentage of relevant AI-generated responses that mention or recommend your brand. L8EntSpace measures this by running a set of industry-specific probe queries across up to seven AI engines (ChatGPT, Gemini, Claude, Perplexity, Grok, DeepSeek, and Google AI Overviews), recording how often your brand appears, in what context, and with what sentiment. An A-SoV of 40% means your brand appears in 4 out of 10 relevant AI responses: a live, measured metric, not a modelled estimate.',
      },
      {
        question: 'How long does GEO take to produce results?',
        answer: 'For AI engines using real-time retrieval (RAG), primarily Perplexity and ChatGPT browsing mode, fresh, authoritative content can begin influencing citations within 1–2 weeks of publication. For training-based knowledge embedded in model weights, structural improvements typically show within 6–12 weeks. Changes in your Citation Probe rate across a sustained content campaign are typically detectable within 2–4 weeks.',
      },
      {
        question: 'Can GEO and SEO work together?',
        answer: 'Yes. GEO and SEO are complementary. Strong SEO authority (backlinks, domain rating, technical health) signals to AI models that your content is trustworthy and indexable. However, SEO authority alone does not determine AI citation: content specificity, entity density, and structural clarity matter more. A well-executed strategy runs both in parallel: SEO builds domain authority and crawlability, GEO builds the knowledge layer AI models cite from.',
      },
      {
        question: 'What is the "knowledge layer" that AI models draw from?',
        answer: 'AI models retrieve information from two sources: training data (facts embedded during model training) and real-time retrieval (RAG, or Retrieval-Augmented Generation). The knowledge layer is the intersection of both: the body of high-quality, authoritative content that consistently surfaces whether an AI is drawing on training memory or live web retrieval. L8EntSpace engineers your brand\'s presence in both layers simultaneously through structured content, schema markup, and omnichannel seeding.',
      },
      {
        question: 'What types of businesses benefit most from GEO?',
        answer: 'GEO has the highest ROI for businesses where AI recommendations directly drive purchase decisions: SaaS platforms, professional services, financial products, health and wellness brands, and B2B software. Any category where a user might ask an AI "what\'s the best [product/service/tool] for [need]?" is a GEO opportunity. Early movers in each vertical are capturing citation authority that will compound for years as AI-first search becomes the default.',
      },
      {
        question: 'What is the window of opportunity for GEO right now?',
        answer: 'Fewer than 3% of brands currently have any structured GEO presence. The brands that establish AI citation authority in the next 12–18 months will be the default answers for their category queries, a position that is self-reinforcing, since AI models cite authoritative sources more often, increasing their perceived authority further. Late movers will pay to displace established citations rather than claim them. The window is open now.',
        link: { text: 'See L8EntSpace\'s roadmap', href: '/roadmap' },
      },
      {
        question: 'Is GEO only relevant for large brands?',
        answer: 'No. GEO is actually more immediately impactful for emerging brands and SMBs than for large enterprises. Large brands are often already cited due to mass web presence and training data volume. Smaller brands with a precisely defined niche can engineer category authority for specific queries at far lower cost than competing for broad SEO rankings. GEO rewards specificity and content quality over raw scale.',
      },
      {
        question: 'What is deterministic inference vs probabilistic SEO?',
        answer: 'Traditional SEO is probabilistic: rankings fluctuate based on algorithm updates, competitor activity, and link velocity in ways that are difficult to predict or control. GEO aims for deterministic inference: engineering your brand facts so precisely that when an AI model is asked a relevant question, your brand is the logically consistent, most authoritative answer. L8EntSpace\'s approach shifts brand visibility from "hoping to rank" to "engineering to be cited."',
      },
    ],
  },
  {
    id: 'ai-engines',
    title: 'AI Engines',
    description: 'How ChatGPT, Gemini, Claude, and Perplexity handle brand citations, and what each engine\'s behaviour means for your strategy.',
    icon: 'Brain',
    items: [
      {
        question: 'Which AI engines does L8EntSpace track?',
        answer: 'L8EntSpace tracks your brand\'s AI Share of Voice across up to seven generative AI engines: ChatGPT (OpenAI), Gemini (Google), Claude (Anthropic), Perplexity AI, Grok (xAI), DeepSeek, and Google AI Overviews. Each engine uses different training data, retrieval architectures, and citation heuristics, which means your brand may perform very differently across them. L8EntSpace provides per-engine SoV scores and a blended overall score so you can identify where to focus your GEO efforts.',
      },
      {
        question: 'How does ChatGPT decide what to cite?',
        answer: 'ChatGPT uses a combination of training-time knowledge and, in its search-enabled mode, real-time Bing retrieval. For factual brand queries, it prioritises sources with high domain authority, clear entity schema, and consistent omnichannel presence. Brands that appear frequently across authoritative third-party sites (Reddit, LinkedIn, industry publications) in consistent, specific, high-entropy terms are significantly more likely to be cited.',
      },
      {
        question: 'How does Google Gemini handle brand citations?',
        answer: 'Google Gemini draws on Google\'s own web index as well as its training corpus. Gemini tends to favour structured content: pages with clear schema markup, defined entities, and strong domain authority in Google Search. A high traditional SEO ranking correlates with, but does not guarantee, Gemini citation. L8EntSpace\'s schema and entity engineering targets the specific signals Gemini\'s retrieval layer prioritises.',
      },
      {
        question: 'How does Claude (Anthropic) approach factual brand responses?',
        answer: 'Claude is trained to be precise and conservative about brand claims. It is less likely to cite a brand without multiple high-authority corroborating sources, and it actively avoids repetitive marketing language. Claude responds well to content that uses clear declarative sentences, avoids promotional tone, and presents data in a structured, verifiable format. L8EntSpace\'s Fact-Vault format (short, specific, authority-attributed statements) is calibrated for Claude\'s citation pattern.',
      },
      {
        question: 'How does Perplexity AI differ from other AI search engines?',
        answer: 'Perplexity is the most transparent of the four engines: it actively retrieves real-time web content and shows source citations with hyperlinks. This means Perplexity citations are won by having current, crawlable, high-quality content in its real-time index. Unlike ChatGPT or Claude which draw heavily on training data, Perplexity behaves more like an AI-native search engine, making fresh content and strong crawlability particularly valuable for Perplexity SoV.',
      },
      {
        question: 'Do different AI engines have different biases?',
        answer: 'Yes, significantly. Gemini tends to favour content that aligns with Google\'s E-E-A-T quality standards (Experience, Expertise, Authoritativeness, Trustworthiness). ChatGPT has been trained on a broader corpus and can cite niche sources. Perplexity weights recency heavily. Claude weights precision and source authority. Because each engine behaves differently, L8EntSpace tracks them individually. A brand with high SoV on Perplexity may have very different performance on Claude.',
      },
      {
        question: 'How often are AI models updated, and how does this affect my citations?',
        answer: 'Major foundation model retraining happens every few months for most providers, but retrieval layers (RAG) update continuously. This means your citation profile can change without any action on your part: new model weights may deprioritise your brand, or a competitor\'s content campaign may displace you in the training data. L8EntSpace\'s continuous monitoring detects these shifts as Z-score drift events so you can respond before the impact compounds.',
      },
      {
        question: 'What is "generative noise"?',
        answer: 'Generative noise is when an AI model generates incorrect or misleading claims about your brand, not because of a deliberate attack, but because the model is confusing you with a similar brand, extrapolating from outdated data, or hallucinating from incomplete training. L8EntSpace detects generative noise by comparing AI-generated statements about your brand against your verified Fact-Vault, flagging discrepancies so you can publish corrections before the false narrative embeds further.',
      },
      {
        question: 'Can AI engines be influenced to cite my brand more often?',
        answer: 'Yes, through systematic content engineering rather than any form of manipulation. Publishing high-entropy, authoritative content and distributing consistent facts across third-party platforms (Reddit, LinkedIn, industry publications, structured schema) increases the probability that both training data and real-time retrieval surface your brand in relevant responses. This is the entire basis of GEO, and L8EntSpace\'s platform systematises this process end-to-end.',
      },
      {
        question: 'Which AI engine drives the most referral traffic?',
        answer: 'Perplexity drives the highest direct referral traffic because it always displays and links to its sources. ChatGPT\'s browsing mode and Gemini\'s AI Overviews also drive referrals, though at lower click-through rates. Claude typically does not provide hyperlinks in most configurations. Despite lower referral traffic, Claude and ChatGPT citations carry significant brand authority because they represent AI endorsement seen by millions of users who may then search for your brand directly.',
      },
      {
        question: 'How does AI handle contradictory brand information?',
        answer: 'When AI models encounter contradictory information about a brand across different sources, they either average the positions (producing vague, hedged statements) or defer to the highest-authority source. This is why consistent omnichannel presence is critical: brand facts that appear identically across your website, LinkedIn, industry publications, and structured schema override contradictory claims from lower-authority sources. L8EntSpace measures this consistency gap and flags it as a remediation priority.',
      },
      {
        question: 'What is a RAG citation vs a training citation?',
        answer: 'A training citation is embedded in an AI model\'s weights during the training process, recalled from memory without referencing external sources. A RAG (Retrieval-Augmented Generation) citation occurs when an AI actively retrieves live web content to answer a query. L8EntSpace\'s strategy targets both: structured, authoritative content for real-time RAG retrieval, and high-entropy facts seeded across multiple platforms to influence future training cycles as models are periodically retrained.',
      },
    ],
  },
  {
    id: 'measurement',
    title: 'Measurement & Metrics',
    description: 'How AI Share of Voice is calculated, what the numbers mean, and how to interpret trends and drift signals.',
    icon: 'LineChart',
    items: [
      {
        question: 'How is L8EntSpace\'s A-SoV measurement different from estimated metrics?',
        answer: 'L8EntSpace measures AI Share of Voice by running live probe queries across up to seven AI engines and recording brand appearances in real time. Unlike estimated or modelled SoV metrics, every data point represents an actual AI engine response, not a projection from web traffic data or keyword rankings. This makes L8EntSpace\'s SoV measurement deterministic: what you see is exactly what the AI is saying about your brand category right now.',
      },
      {
        question: 'What is a good A-SoV score?',
        answer: 'A-SoV benchmarks vary by industry and competitive density. For emerging GEO categories, 40–60% A-SoV is achievable with a focused campaign. For highly competitive categories (e.g., CRM tools, project management software), even 15–25% A-SoV represents category leadership. The more strategically meaningful metric is relative SoV (whether you are higher than your closest competitor) rather than an absolute percentage target.',
      },
      {
        question: 'What is "sentiment drift" in AI brand tracking?',
        answer: 'Sentiment drift is a statistically significant shift in the emotional tone or association of AI-generated statements about your brand over time, distinct from normal model variance. L8EntSpace detects sentiment drift using Z-score analysis: if your brand sentiment deviates more than 2 standard deviations from its rolling baseline, this is flagged as a drift event. Gradual drift (AI models slowly associating your brand with outdated or negative concepts) is the harder-to-detect and more damaging form.',
      },
      {
        question: 'What is a Z-Score and why does L8EntSpace use it?',
        answer: 'A Z-score measures how many standard deviations a data point is from a statistical mean. Applied to brand sentiment or citation rate, a Z-score above 2.0 or below -2.0 indicates a change that is statistically unlikely to be random variance: it is a meaningful signal requiring investigation. L8EntSpace uses rolling Z-score analysis so that gradual drift is caught early, not after it has compounded into a structural problem in how AI models represent your brand.',
      },
      {
        question: 'How does L8EntSpace detect citation rate drift?',
        answer: 'L8EntSpace compares every consecutive pair of probe runs per AI engine using a two-proportion z-test on the underlying cited counts. A z-score beyond ±1.96 means the rate change is statistically unlikely to be sampling noise, flagged as a drift event in the Brand Intelligence panel. This separates genuine shifts (a model retrain deprioritising your brand, a competitor campaign displacing you) from the normal run-to-run variance inherent in probing stochastic AI systems.',
      },
      {
        question: 'How do I know if my GEO strategy is working?',
        answer: 'The primary signal is A-SoV increase over time on your target probe queries. Secondary signals include improvement in your Moat Score (semantic proximity to target brand attributes), reduction in generative noise events, and an increase in AI referral traffic sessions. L8EntSpace\'s dashboard tracks all of these with trend lines across weekly data points, so you can distinguish genuine improvement from normal model variance.',
      },
      {
        question: 'How often should I run an AI brand audit?',
        answer: 'L8EntSpace recommends weekly automated audits for enterprise brands and at minimum bi-weekly for growth-stage brands. AI models update their retrieval layers continuously, meaning your citation profile can change at any time. Weekly auditing ensures you detect competitive displacement, negative drift, or generative noise within days of occurrence, giving you time to respond with fresh content before the problem compounds.',
      },
      {
        question: 'What is the difference between citation rate and Share of Voice?',
        answer: 'Citation rate is the raw count of how often your brand appears across a set of AI responses. Share of Voice is citation rate expressed as a percentage relative to your tracked competitors. For example, if your brand appears in 30 out of 100 AI responses and your leading competitor appears in 45, your SoV is 40% and theirs is 60%. SoV is always more actionable for strategic decision-making than an absolute citation count.',
      },
      {
        question: 'What is the L8EntSpace Moat Score?',
        answer: 'The Moat Score measures how closely an AI model\'s latent space associates your brand with the key attributes you want to own, such as "reliable," "innovative," "cost-effective," or "enterprise-grade." It is calculated by computing the vector cosine similarity between your brand\'s embedding and target concept embeddings in 768-dimensional space using Google\'s text-embedding-004 (the designed default, chosen for 40% lower inference cost vs 1536-D alternatives). A Moat Score moving toward 1.0 means AI models are developing stronger associations between your brand and those values.',
      },
      {
        question: 'How does L8EntSpace\'s latent space mapping work?',
        answer: 'L8EntSpace embeds your brand name and core brand facts into a high-dimensional vector space using Google\'s text-embedding-004 (768 dimensions), the designed default chosen for its 40% lower inference cost vs 1536-D alternatives with equivalent brand-domain semantic fidelity, plus a local synonym engine cross-checked against the API embeddings for alignment. The cosine similarity between your brand vector and vectors for target concepts is measured. Changes in these distances over time indicate whether your brand is becoming more or less closely associated with the values you are targeting in AI model memory.',
      },
      {
        question: 'Can I measure the revenue impact of GEO?',
        answer: 'Indirect revenue attribution from GEO is possible through three signals: AI referral traffic (sessions originating from AI engine source links, tracked in L8EntSpace\'s Overview), branded search lift (users searching for your brand after seeing it cited in an AI response), and pipeline influence (deals where prospects first encountered the brand through an AI recommendation). L8EntSpace tracks AI referral sessions and SoV trends, which can be correlated with CRM pipeline data.',
      },
      {
        question: 'What does a declining A-SoV mean?',
        answer: 'A declining A-SoV can indicate several things: a competitor has intensified their GEO content activity, an AI model has been retrained with data that deprioritises your brand, or your content freshness has degraded relative to competitors. L8EntSpace\'s drift detection flags sudden declines as anomalies. For gradual declines, reviewing which specific probe queries show reduced brand appearances identifies the topic clusters where you are losing ground.',
      },
    ],
  },
  {
    id: 'cite-magnets',
    title: 'Cite-Magnets & Facts',
    description: 'What makes content citable by AI, how to structure high-entropy facts, and the Information Cliffhanger technique.',
    icon: 'Sparkles',
    items: [
      {
        question: 'What is a "Cite-Magnet"?',
        answer: 'A Cite-Magnet is a precisely structured brand fact engineered to be cited by AI models. Cite-Magnets contain three elements: a specific, verifiable claim (not generic marketing language), a quantified detail (a number, percentage, named methodology, or timeframe), and a clear subject-object relationship that identifies your brand as the source. "L8EntSpace maps brand-concept associations across 768 semantic dimensions using Gemini text-embedding-004, cutting inference costs 40% vs 1536-D alternatives" is a Cite-Magnet. "We provide AI solutions" is not.',
        link: { text: 'Explore Cite-Magnet strategy', href: '/blog' },
      },
      {
        question: 'What makes a fact "high-entropy" for GEO purposes?',
        answer: 'In information theory, entropy measures the information density of a statement. A high-entropy fact contains specific data that is non-obvious and cannot be inferred from context: numbers, named methodologies, specific mechanisms, or proprietary processes. "Our platform uses machine learning" has near-zero entropy. Any AI company could say this. "L8EntSpace detects AI brand sentiment drift using rolling Z-score analysis across four major LLM engines" is high-entropy. Every word carries information that distinguishes your brand.',
      },
      {
        question: 'How many facts do I need in my Fact-Vault?',
        answer: 'Quality matters more than quantity, but breadth matters for coverage. A well-structured Fact-Vault with 50–100 high-entropy facts covering multiple topic clusters (features, use cases, proof points, methodology, founding story) is sufficient to drive meaningful GEO impact. L8EntSpace\'s Content Scorer grades each fact on entropy, specificity, and semantic relevance, so you know which facts are doing work and which are filler.',
        link: { text: 'Go to Fact-Vault', href: '/dashboard' },
      },
      {
        question: 'What is an "Information Cliffhanger" in GEO strategy?',
        answer: 'An Information Cliffhanger is a GEO technique where you give AI models a complete, citable high-entropy fact (securing the citation) while placing the implementation detail or proprietary "how-to" in gated or linked content on your site. The AI cites the fact freely, creating brand authority. Users who want to know "how" must visit your site. This converts GEO visibility into direct web traffic without reducing citation probability, because the core fact is complete and valuable on its own.',
      },
      {
        question: 'What types of content do AI models prefer to cite?',
        answer: 'AI models cite content that is specific, authoritative, structured, and consistent across multiple sources. Numbered lists of facts, Q&A formats, case studies with specific outcomes, methodology descriptions with named steps, and content published on high-domain-authority sites all perform well. Vague, promotional, or subjective content is rarely cited. AI models effectively prefer the tone of a well-written technical report (precise, declarative, and informative) over a marketing brochure.',
      },
      {
        question: 'What is omnichannel seeding and why does it matter?',
        answer: 'Omnichannel seeding is the strategic distribution of consistent brand facts across multiple high-authority platforms: your own domain, LinkedIn, industry forums, Reddit, partner sites, press coverage, and third-party directories. AI models build higher confidence in a brand fact when it appears identically across many independent sources. A fact corroborated across ten authoritative, independent sources is treated as consensus truth. A single-source fact is treated as a claim.',
      },
      {
        question: 'Should my brand facts include statistics and numbers?',
        answer: 'Yes. Numbers are among the most citable elements in AI responses because they are specific, memorable, and verifiable. Percentages, counts, time frames, and dimensional specifics create high-entropy anchors that AI models repeat precisely. "L8EntSpace reduces time-to-GEO-insight from weeks to hours" is less citable than "L8EntSpace delivers a complete AI Share of Voice report across up to seven AI engines, measuring citation frequency, sentiment, and semantic positioning simultaneously."',
      },
      {
        question: 'What is the difference between a Cite-Magnet and a keyword?',
        answer: 'A keyword is a term chosen to match a search algorithm\'s ranking criteria, typically 1–5 words targeted for placement in metadata and headers. A Cite-Magnet is a complete, structured factual statement chosen to match an AI model\'s preference for high-information-density content, typically 1–3 sentences with a clear subject, specific predicate, and named claim. SEO targets keywords. GEO embeds Cite-Magnets into content body, schema, and omnichannel distribution.',
      },
      {
        question: 'How do AI models decide which source to cite when multiple sources agree?',
        answer: 'When multiple sources agree on a fact, AI models typically cite the source with the highest perceived authority in that domain, measured by domain rating, backlink profile, content depth, and entity clarity. If authority is roughly equal, recency becomes the tiebreaker. L8EntSpace\'s omnichannel seeding strategy is designed to make your brand\'s owned channels the canonical source of your brand\'s facts, so that when AI models cross-reference multiple sites, your content is traced back to first.',
      },
      {
        question: 'Can video and audio content become citable by AI?',
        answer: 'Yes, increasingly. YouTube video transcripts, podcast show notes, and structured image alt text are indexed and retrievable by AI engines. Distributing your high-entropy brand facts across video descriptions, podcast transcripts, and structured image captions creates additional citation surfaces that text-only competitors miss. For maximum GEO impact, the same Cite-Magnet fact should appear in identical form across all content formats and distribution channels.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Implementation',
    description: 'Schema markup, entity graphs, semantic structure, AI crawlability, and the technology stack behind GEO.',
    icon: 'Code',
    items: [
      {
        question: 'What is JSON-LD schema and why does it matter for GEO?',
        answer: 'JSON-LD (JSON for Linked Data) is a structured data format embedded in web pages that gives AI crawlers an unambiguous, machine-readable description of your content. Schema types like Organization, FAQPage, Article, and SoftwareApplication tell AI crawlers exactly what your brand is, what questions you answer, and what content you publish, reducing interpretive ambiguity. Pages with correct, comprehensive schema markup are significantly more likely to be indexed and retrieved accurately by AI engines.',
        link: { text: 'Check your schema with L8EntSpace', href: '/dashboard' },
      },
      {
        question: 'What is a latent space in AI, and why does it matter for brands?',
        answer: 'A latent space is the mathematical representation of meaning used internally by AI language models. Embedding models map text into high-dimensional numerical vectors (768 dimensions for Google\'s text-embedding-004, the designed default) where semantically similar concepts cluster together. L8EntSpace uses these embedding spaces to measure how closely your brand is associated with target concepts like "reliable," "innovative," or "enterprise-grade," and tracks how these associations change over time as you execute your GEO strategy.',
      },
      {
        question: 'What is entity density in GEO content?',
        answer: 'Entity density is the number of clearly defined named entities (brands, people, products, locations, methodologies) per unit of content. High entity density signals to AI models that content is specific and informative rather than generic. For GEO purposes, content should clearly name your brand, your product names, your methodology names, and the specific problems you solve. Pronouns and implicit references that AI models may attribute to a different entity reduce entity density and citation probability.',
      },
      {
        question: 'What is RAG (Retrieval-Augmented Generation)?',
        answer: 'RAG is a technique where an AI model actively fetches external information at query time before generating a response, rather than relying entirely on its training memory. A RAG-enabled AI queries a search index, retrieves relevant documents, and synthesises a response grounded in that live content. For brands, this means fresh, well-structured, crawlable content can influence AI responses even between major model training updates, making content freshness and crawlability critical GEO levers.',
      },
      {
        question: 'What technical site factors affect AI crawlability?',
        answer: 'The primary factors are: a clean sitemap, no JavaScript-blocking of critical content, structured schema markup, fast page load times (Core Web Vitals), canonical URLs, and a robots.txt that explicitly allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot, and Google-Extended). L8EntSpace\'s Technical Analyzer audits all of these and generates a prioritised remediation list. A site that is technically invisible to AI crawlers cannot be cited regardless of content quality.',
      },
      {
        question: 'What is pgvector and how does L8EntSpace use it?',
        answer: 'pgvector is an open-source PostgreSQL extension for storing and querying vector embeddings at scale. L8EntSpace uses a pgvector backend to store brand embeddings, competitor embeddings, and concept embeddings in the same 768-dimensional space as Gemini\'s embedding model. This enables hybrid search (combining traditional metadata filtering by brand name, date, and category with dense vector similarity) to find exactly which topic clusters your brand is weakest in relative to competitors.',
      },
      {
        question: 'What is ontological interoperability in GEO?',
        answer: 'Different AI models use different internal representations of knowledge. Ontological interoperability means structuring your brand content using universal schema standards (Schema.org ontologies) so that whether Claude, ChatGPT, Gemini, or an edge LLM reads your data, they all arrive at the same consistent conclusion about your brand\'s identity, authority, and relationship to relevant topics. L8EntSpace\'s schema engineering layer implements this across all major schema types for your domain.',
      },
      {
        question: 'How does GPTBot differ from Googlebot?',
        answer: 'Googlebot indexes your site primarily for traditional search ranking signals (PageRank, keywords, technical SEO factors). GPTBot (OpenAI\'s crawler) is interested in content quality, factual density, and authoritativeness, indexing pages that could be useful as retrieval sources for ChatGPT\'s real-time RAG mode. Your robots.txt should explicitly allow GPTBot, ClaudeBot, PerplexityBot, and Google-Extended. Blocking them, even accidentally, eliminates your potential for AI citation regardless of content quality.',
      },
      {
        question: 'Which structured data schema types matter most for GEO?',
        answer: 'The highest-impact schema types for GEO are: Organization (defines your brand entity and its attributes), FAQPage (pre-formats Q&A content in the exact format AI models prefer), Article and BlogPosting (gives AI structured access to your content with metadata), SoftwareApplication (for SaaS products), and HowTo (for procedural content). L8EntSpace\'s Technical Analyzer identifies which schema types are missing or incorrectly implemented on your domain and provides corrected code.',
      },
      {
        question: 'How does AI crawling differ from traditional web crawling?',
        answer: 'Traditional crawlers (Googlebot) read pages primarily to extract keywords, links, and authority signals for ranking. AI crawlers read pages to extract facts, entities, and knowledge: the goal is not to rank your URL but to learn from or retrieve your content when relevant queries arise. This means AI crawlers respond very differently: a page dense with specific, well-attributed facts outperforms a keyword-optimised page with vague, repetitive content in terms of citation probability.',
      },
    ],
  },
  {
    id: 'competitor',
    title: 'Competitor Strategy',
    description: 'The Trojan Horse strategy, competitor data decay, counter-facts, and how to win citation share from competitors.',
    icon: 'Target',
    items: [
      {
        question: 'What is the "Trojan Horse" GEO strategy?',
        answer: 'The Trojan Horse strategy involves identifying where a competitor\'s data is becoming stale or inaccurate within AI models, then publishing fresh, authoritative content that supersedes it. When an AI model encounters your updated, high-authority content on a topic previously owned by a competitor, it progressively shifts its citation preference toward you. The "Trojan" element is that the content earns citation on quality and relevance, not on displacement tactics. It is entirely ethical and directly analogous to winning a top Google ranking.',
        link: { text: 'Read the Trojan Horse deep-dive', href: '/blog' },
      },
      {
        question: 'How does competitor data decay work in AI models?',
        answer: 'AI models are trained on data up to a knowledge cutoff and retrieve real-time data through RAG. Competitor content that was authoritative at training time may become stale if the competitor stops publishing, their claims become outdated by market developments, or better sources emerge. L8EntSpace\'s Competitors module monitors which of your competitors\' topic clusters are showing evidence of data decay, identifying where targeted content can displace their weakening AI presence.',
      },
      {
        question: 'What is a "generative vulnerability" in a competitor\'s AI profile?',
        answer: 'A generative vulnerability is a topic area where a competitor\'s AI presence is weak, either because they lack content, their content is outdated, or AI models are already associating them with negative signals in that area. L8EntSpace identifies these vulnerabilities by running competitor probe queries and analysing response quality, source recency, and sentiment. Your content strategy targets these vulnerabilities specifically, with high-entropy Cite-Magnets positioned to fill the gap.',
      },
      {
        question: 'Is the Trojan Horse strategy ethical?',
        answer: 'Yes, entirely. The Trojan Horse strategy does not involve manipulating AI systems, spreading misinformation, or attacking competitors\' infrastructure. It involves publishing accurate, high-quality content that provides a better, more current answer than existing sources. Winning a citation on content quality is the same mechanism that earns a top Google ranking. L8EntSpace explicitly prohibits generating false or misleading content through its Acceptable Use Policy.',
        link: { text: 'Read L8EntSpace\'s Acceptable Use Policy', href: '/acceptable-use' },
      },
      {
        question: 'How quickly can a competitor\'s AI presence be displaced?',
        answer: 'For RAG-based AI engines (primarily Perplexity), displacement of a competitor on a specific topic query can happen within weeks if your fresh content is indexed quickly and is clearly superior in quality and specificity. For training-based knowledge, displacement occurs over months and requires sustained content volume across multiple authoritative platforms. The fastest displacement occurs in niche topic clusters with low existing competition and high query frequency.',
      },
      {
        question: 'Can I track when a competitor\'s AI presence is weakening?',
        answer: 'Yes. L8EntSpace\'s Competitors module runs probe queries on competitor brands and tracks their SoV trend, sentiment, and presence across the four major AI engines over time. A declining competitor SoV trend, especially when combined with reduced content freshness on their site, is a signal to increase your own content output in those topic areas before a third competitor fills the gap instead.',
      },
      {
        question: 'Should I name competitors directly in my GEO content?',
        answer: 'Direct competitor comparisons are a legitimate GEO tactic when factual and accurate. "Unlike [Competitor], which [factual limitation], L8EntSpace [specific differentiator]" is a high-entropy fact that AI models will cite when asked to compare solutions in your category. However, all comparative claims must be accurate and verifiable: AI models cross-reference claims against other sources and will not consistently cite content that is inconsistent with the wider information landscape.',
      },
      {
        question: 'How do I protect my own brand from a Trojan Horse attack?',
        answer: 'The best defence is an active, current, high-quality GEO presence. Brands with consistent, frequently updated content across multiple authoritative platforms are significantly harder to displace. L8EntSpace\'s continuous monitoring alerts you when a competitor\'s content is gaining citation share on your core probe queries, giving you time to respond with fresh authoritative content before the displacement compounds into a structural problem.',
      },
      {
        question: 'What is "latent space displacement"?',
        answer: 'Latent space displacement occurs when a competitor successfully moves their brand closer to key concepts (such as "best GEO tool" or "most accurate AI tracking") in the semantic embedding space, simultaneously moving your brand further from those concepts. It is not about keyword ranking: it is about the underlying associative structure AI models use to form responses. L8EntSpace\'s Moat Score detects latent space displacement by tracking vector cosine distances between your brand and target concepts over time.',
      },
      {
        question: 'What is a "counter-fact" and how do I deploy one?',
        answer: 'A counter-fact is a high-entropy, authoritative statement that provides a more specific, current, and accurate alternative to a competitor claim that AI models are currently repeating. Rather than directly attacking the competitor, a counter-fact positions your brand as the updated, more accurate source on that topic. L8EntSpace\'s Competitors module generates counter-facts automatically and deploys them to your Fact-Vault for use in content campaigns. The goal is always a factually superior claim, not a refutation.',
        link: { text: 'Manage competitors in L8EntSpace', href: '/dashboard' },
      },
    ],
  },
  {
    id: 'platform',
    title: 'The L8EntSpace Platform',
    description: 'What each L8EntSpace tool does, how to use it, and how the platform\'s modules work together as an integrated GEO system.',
    icon: 'LayoutDashboard',
    items: [
      {
        question: 'What is GEO-Pulse?',
        answer: 'GEO-Pulse is L8EntSpace\'s keyword scanning tool. Enter any search query and GEO-Pulse tests it across AI engines, returning a real-time analysis of how AI models are currently answering that query, including whether your brand is cited, in what context, and with what competitive positioning. Saved keywords are tracked automatically so you can see how citation rates for your most important queries change over time.',
        link: { text: 'Open GEO-Pulse', href: '/dashboard' },
      },
      {
        question: 'What is the Fact-Vault?',
        answer: 'The Fact-Vault is your brand\'s structured knowledge base within L8EntSpace. It stores your high-entropy Cite-Magnet facts and structured claims in a format optimised for AI ingestion. Facts in the Fact-Vault feed into L8EntSpace\'s content generation (Agents module), competitor counter-fact deployment (Competitors module), and the Citacious voice assistant\'s brand knowledge base. A well-populated Fact-Vault is the foundation of every GEO strategy built on the L8EntSpace platform.',
        link: { text: 'Build your Fact-Vault', href: '/dashboard' },
      },
      {
        question: 'What is the Brand Monitor?',
        answer: 'Brand Monitor continuously scans the web for mentions of your brand name, products, and key terms across news sites, forums, social platforms, and industry publications. It surfaces new content that could influence AI citations: positive mentions to amplify through your GEO channels, and misinformation or competitor claims to respond to with authoritative counter-content. Brand Monitor is powered by real-time web search and requires activation in your account settings.',
      },
      {
        question: 'What is the Content Scorer?',
        answer: 'The Content Scorer analyses any piece of your content (blog posts, landing pages, product descriptions) and grades it on GEO readiness. It evaluates entity density, semantic clarity, high-entropy fact count, schema implementation, and overall citation probability. The scorer also suggests specific edits: which sentences to restructure, which facts to add, and where schema markup should be implemented to maximise the probability that AI models cite that piece.',
        link: { text: 'Score your content', href: '/dashboard' },
      },
      {
        question: 'What does the Competitors module show?',
        answer: 'The Competitors module tracks the AI Share of Voice and sentiment profile of up to 20 competitor brands (50 on the Business plan) across your probe query set. It shows which competitors are gaining or losing AI citation share, which topic clusters they dominate, and where their data is becoming stale. The module also surfaces specific counter-fact opportunities: topic areas where a targeted content campaign can displace a competitor\'s weakening AI presence and capture their citation share.',
        link: { text: 'Analyse competitors', href: '/dashboard' },
      },
      {
        question: 'What is Citacious and how do I use it?',
        answer: 'Citacious is L8EntSpace\'s real-time AI voice assistant, powered by Google Gemini Live. It has deep knowledge of GEO strategy, your brand\'s Fact-Vault, and your live platform metrics. Speak naturally: ask about your SoV trends, request strategic recommendations for your next campaign, or have Citacious navigate you to a specific dashboard module. Citacious responds within 500 milliseconds and can control dashboard navigation on your behalf when instructed.',
        link: { text: 'Talk to Citacious', href: '/voice-agents' },
      },
      {
        question: 'What is the Technical Analyzer?',
        answer: 'The Technical Analyzer audits your website\'s AI crawlability, checking robots.txt for AI crawler permissions (GPTBot, ClaudeBot, PerplexityBot, Google-Extended), schema markup implementation, page load performance, canonical URL structure, and sitemap completeness. It generates a prioritised list of technical remediation tasks ranked by estimated impact on AI citation probability. Both technical and non-technical team members can use the report to improve AI discoverability.',
        link: { text: 'Analyse your site', href: '/dashboard' },
      },
      {
        question: 'How does the AI Simulator work?',
        answer: 'The AI Simulator lets you preview how AI engines would respond to queries about your brand or category, using your current Fact-Vault as the knowledge base. It identifies gaps (queries where your brand would not appear) and shows which specific facts, if added to your Fact-Vault or published as content, would most improve your citation likelihood. Think of it as a rehearsal environment for your GEO strategy before you commit to a content campaign.',
        link: { text: 'Run a simulation', href: '/dashboard' },
      },
      {
        question: 'What is the Agents module?',
        answer: 'The Agents module is L8EntSpace\'s automated content pipeline. It uses AI to generate GEO-optimised blog articles, structured fact sets, and schema-ready content based on your Fact-Vault and target keywords. Each piece of content produced by Agents is pre-structured with Cite-Magnets, entity-dense paragraphs, and schema markup, ready to publish and begin accumulating AI citations from day one. Generated articles also automatically extract new facts back into your Fact-Vault.',
        link: { text: 'Generate GEO content', href: '/dashboard' },
      },
      {
        question: 'What data does L8EntSpace use to calculate Share of Voice?',
        answer: 'A-SoV is calculated from live probe queries: a set of industry-specific questions representing how real users query AI engines about your category. L8EntSpace runs these queries across up to seven AI engines (ChatGPT, Gemini, Claude, Perplexity, Grok, DeepSeek, and Google AI Overviews), parses each response for brand mentions (yours and competitors\'), and calculates each brand\'s appearance rate. The result is a per-engine and blended SoV score based on actual AI responses, not modelled estimates from web traffic or keyword data.',
      },
      {
        question: 'How do I add facts to my Fact-Vault?',
        answer: 'Navigate to the Fact-Vault in your L8EntSpace dashboard. You can add facts manually by typing individual Cite-Magnet statements, or use the Content Scorer to extract high-entropy facts from existing content you paste in. Each fact is automatically scored on entropy and semantic relevance. Articles generated through the Agents module also populate the Fact-Vault automatically with extracted facts. Aim for facts that are specific, verifiable, and brand-attributed.',
        link: { text: 'Go to Fact-Vault', href: '/dashboard' },
      },
      {
        question: 'What is the FAQ Architect?',
        answer: 'FAQ Architect generates a complete, deploy-ready FAQ page for your brand. Unlike generic AI FAQ generators that invent questions, it sources questions from your Citation Probe history (the real queries AI engines are asked about your category, prioritising the ones where you are not yet cited) and grounds every answer in your verified Fact-Vault. Output includes visible HTML with per-question anchor links, FAQPage JSON-LD schema, and markdown, following the same AEO structure L8EntSpace uses on its own FAQ page.',
        link: { text: 'Open FAQ Architect', href: '/dashboard/faq-architect' },
      },
      {
        question: 'What is the L8EntSpace GEO Lab?',
        answer: 'The GEO Lab is L8EntSpace\'s public research programme: a series of pre-registered A/B experiments testing which content levers actually change AI citation rates. Each experiment varies exactly one factor (statistical anchors, inverted-pyramid structure, list vs prose, entity density), runs a minimum of 30 trials per variant across multiple AI engines, and is analysed with two-proportion z-tests and Bonferroni-corrected significance thresholds. Findings (including null results) are re-tested every 30 days to detect decay as AI models update, and significant verified findings feed directly into the dashboard as evidence-backed content recommendations.',
      },
      {
        question: 'How do the L8EntSpace modules work together?',
        answer: 'L8EntSpace is designed as an integrated GEO system. Your Fact-Vault is the core knowledge base that feeds every other module: the Content Scorer grades your existing content against it, the Agents module generates new content from it, the Competitors module deploys counter-facts from it, and Citacious uses it to answer brand-specific questions. GEO-Pulse tests how well your Fact-Vault facts are being cited by live AI engines, creating a feedback loop that continuously improves citation rates.',
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing & Plans',
    description: 'Subscription tiers, billing, cancellation, refunds, and enterprise options.',
    icon: 'CreditCard',
    items: [
      {
        question: 'How does L8EntSpace\'s pricing work?',
        answer: 'L8EntSpace offers tiered subscription plans billed monthly or annually. Each tier unlocks a higher volume of probe queries, additional competitor tracking slots, and access to advanced platform features. Annual plans offer a significant discount compared to monthly billing. All plans include the core GEO-Pulse, Fact-Vault, Content Scorer, and Citacious features from day one.',
        link: { text: 'See pricing', href: '/#pricing' },
      },
      {
        question: 'Is there a free way to try L8EntSpace?',
        answer: 'L8EntSpace offers a Starter plan that gives you immediate access to the core platform features with no long-term commitment. For Enterprise plan features (including unlimited queries, custom integrations, and dedicated onboarding) contact our team at sales@l8entspace.com to discuss a tailored evaluation.',
        link: { text: 'View plans', href: '/#pricing' },
      },
      {
        question: 'Can I cancel my subscription at any time?',
        answer: 'Yes. You can cancel your L8EntSpace subscription at any time from your account settings without speaking to anyone. Your access continues until the end of the current billing period. There are no lock-in periods on monthly plans. Annual plan holders who cancel retain access until their annual period expires.',
      },
      {
        question: 'What is L8EntSpace\'s refund policy?',
        answer: 'L8EntSpace is a digital service delivered immediately upon account creation. Under the Consumer Contracts Regulations 2013 (UK), the 14-day cancellation right is waived once you begin using the Service. Refunds are provided where required by the Consumer Rights Act 2015 (e.g., material service fault) or at our discretion. If you believe you are entitled to a refund, contact sales@l8entspace.com and we will review your case.',
      },
      {
        question: 'What happens to my data if I cancel?',
        answer: 'Your Fact-Vault, brand settings, and historical SoV data are retained for 30 days after cancellation, giving you time to export your data. After 30 days, your data is permanently deleted in accordance with our Privacy Policy. Billing records are retained for 7 years as required by HMRC. You can request immediate deletion of your personal data at any time by contacting sales@l8entspace.com.',
        link: { text: 'Read our Privacy Policy', href: '/privacy' },
      },
      {
        question: 'Do you offer a discount for annual billing?',
        answer: 'Yes. Annual plans offer a meaningful discount compared to equivalent monthly billing. The discount is applied automatically when you select annual billing at checkout. Promotional or discounted rates secured at sign-up are locked in for the lifetime of your continuously active subscription.',
      },
      {
        question: 'What happens if I secured a promotional or lifetime deal rate?',
        answer: 'Promotional and discounted rates (including early-adopter pricing) are locked in for as long as your subscription remains continuously active. If you cancel and resubscribe at a later date, the promotional rate is no longer available and standard pricing applies at that time. We recommend contacting us at sales@l8entspace.com before cancelling if you have a promotional rate, as we may be able to help.',
      },
      {
        question: 'Is there an enterprise plan?',
        answer: 'Yes. Enterprise plans include unlimited probe queries, custom AI engine integrations, multi-brand management, dedicated onboarding and strategic support, SLA-backed uptime, and a Data Processing Agreement (DPA) for GDPR compliance. Enterprise pricing is tailored to your requirements. Contact us at sales@l8entspace.com to start a conversation.',
        link: { text: 'Contact us for enterprise pricing', href: 'mailto:sales@l8entspace.com' },
      },
    ],
  },
  {
    id: 'security',
    title: 'Security & Data',
    description: 'GDPR compliance, data storage, encryption, AI data processing disclosures, and what happens to your data.',
    icon: 'Shield',
    items: [
      {
        question: 'Where is my data stored?',
        answer: 'All L8EntSpace platform data is stored in Google Firestore, Google Cloud\'s globally distributed, enterprise-grade database. Data is stored with multi-tenant isolation: your brand data, Fact-Vault, and SoV metrics are accessible only by your authenticated user account and are never shared with or visible to other L8EntSpace customers. Google Cloud operates under ISO 27001, SOC 2, and GDPR-compliant data centre standards.',
      },
      {
        question: 'Is L8EntSpace GDPR compliant?',
        answer: 'Yes. L8EntSpace is operated from the UK and complies with UK GDPR. We maintain a full Privacy Policy disclosing all data processing activities, lawful bases, third-party processors, and data retention periods. All users have the complete set of UK GDPR rights: access, rectification, erasure, restriction, portability, and the right to complain to the Information Commissioner\'s Office (ICO).',
        link: { text: 'Read the Privacy Policy', href: '/privacy' },
      },
      {
        question: 'Does L8EntSpace share my brand data with AI companies to train their models?',
        answer: 'No. Your brand data (keywords, Fact-Vault entries, competitor information) is sent to third-party AI APIs (Google Gemini, OpenAI, Anthropic, Perplexity) only to process your specific platform queries. It is not used for model training by those providers. We include contractual restrictions on training use where API terms make this available. Your brand strategy and proprietary Fact-Vault data are treated as confidential.',
        link: { text: 'See our AI processor disclosures', href: '/privacy' },
      },
      {
        question: 'Who can see my brand data within L8EntSpace?',
        answer: 'Only your authenticated user account can access your brand data in L8EntSpace. Firestore security rules restrict data access to the owning user UID at the database level. L8EntSpace staff do not have routine access to customer Fact-Vaults or brand strategies. Any exceptional staff access requires explicit authorisation and is recorded in our SOC2 audit trail, which logs all data mutations across the platform.',
      },
      {
        question: 'How is my data encrypted?',
        answer: 'All data stored in L8EntSpace is encrypted at rest using AES-256 encryption. All data transmitted between your browser and L8EntSpace\'s servers is encrypted in transit using TLS 1.3. Voice audio processed by Citacious is transmitted directly to Google\'s Gemini Live API over encrypted connections and is not retained by L8EntSpace beyond the duration of the voice session.',
      },
      {
        question: 'Is voice data from Citacious recorded?',
        answer: 'Citacious processes your microphone audio in real time through Google Gemini Live API. L8EntSpace does not record or store your voice audio. Call transcripts may be retained for up to 30 days for service quality and improvement purposes, after which they are permanently deleted. You can end a Citacious session at any time. Audio processing ceases immediately when the session is closed.',
        link: { text: 'Full voice data disclosure', href: '/privacy' },
      },
      {
        question: 'Is L8EntSpace SOC 2 compliant?',
        answer: 'L8EntSpace is pursuing SOC 2 Type II certification as a roadmap milestone for our enterprise offering. Our current security posture (AES-256 encryption, TLS 1.3 in transit, Firestore security rules enforcing user-level data isolation, role-based access control, and a complete audit trail of all data mutations) is designed to meet SOC 2 Trust Service Criteria. Enterprise customers requiring a security questionnaire response or DPA should contact sales@l8entspace.com.',
      },
      {
        question: 'What happens to my data if I delete my account?',
        answer: 'Upon account deletion request, your personal data, brand data, and Fact-Vault entries are deleted within 30 days. Billing records are retained for 7 years as required by UK HMRC legislation. Anonymised, aggregated analytics data that cannot be linked back to your identity may be retained for platform improvement purposes. See our full Privacy Policy for complete data retention schedules and how to submit a deletion request.',
        link: { text: 'Privacy Policy: data retention', href: '/privacy' },
      },
    ],
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'First steps, quick wins, setup priorities, and what to expect in your first 30 days.',
    icon: 'Rocket',
    items: [
      {
        question: 'How do I get started with L8EntSpace?',
        answer: 'Create an account at l8entspace.com, complete your brand profile (brand name, website domain, target industry), and add your first batch of brand facts to your Fact-Vault. Your dashboard immediately shows a baseline GEO analysis. For maximum impact in your first session: run a GEO-Pulse scan on your three most important brand keywords, review your initial AI Share of Voice data, and check your Technical Analyzer report for crawlability issues.',
        link: { text: 'Create your account', href: '/dashboard' },
      },
      {
        question: 'What should I set up first after signing up?',
        answer: 'In order of impact: (1) Complete your brand profile in Settings: name, domain, and key competitors. (2) Add 10–20 high-entropy Cite-Magnet facts to your Fact-Vault. (3) Run GEO-Pulse on your 3 most important target queries. (4) Run the Technical Analyzer on your domain. (5) Launch Citacious for a strategic briefing on your current GEO position. This sequence delivers a complete picture of where you stand within 20 minutes of sign-up.',
      },
      {
        question: 'How long before I see results in AI search?',
        answer: 'For AI engines using real-time retrieval (Perplexity, ChatGPT browsing mode), fresh, high-quality content can begin appearing in AI responses within 1–2 weeks of publication. For training-based citation improvement (embedded in model weights) the typical timeline is 6–12 weeks. L8EntSpace\'s weekly SoV tracking shows you when improvements are occurring, so you can correlate specific content actions with citation rate changes.',
      },
      {
        question: 'What does a successful first 30 days look like?',
        answer: 'By end of day 30, a well-executed GEO strategy should achieve: a Fact-Vault populated with 50+ high-entropy Cite-Magnet facts, a baseline A-SoV measurement across your top 7 probe queries, at least 3 GEO-optimised articles published (generated by Agents and reviewed for accuracy), and a Technical Analyzer report with priority schema fixes implemented. This creates the foundation for measurable SoV growth from week 5 onwards.',
      },
      {
        question: 'Can I use L8EntSpace for multiple brands?',
        answer: 'Enterprise plan users can manage multiple brand profiles within a single L8EntSpace account, each with its own Fact-Vault, SoV tracking, competitor set, and content pipeline. For agency use cases (managing GEO for multiple client brands) contact us at sales@l8entspace.com to discuss multi-client licensing and custom onboarding.',
        link: { text: 'Contact us about multi-brand', href: 'mailto:sales@l8entspace.com' },
      },
      {
        question: 'How do I set up competitor tracking?',
        answer: 'In your L8EntSpace Settings, add up to 20 competitor brand names and domains (50 on the Business plan). L8EntSpace will begin tracking their A-SoV, sentiment, and topic cluster presence alongside yours on every probe query run. For best results, add competitors that appear in the same AI query responses as your brand, as these are the brands directly competing with you for citation authority in your category.',
      },
      {
        question: 'Who in my organisation should own GEO?',
        answer: 'GEO sits at the intersection of marketing, content, and technical SEO. The most effective ownership model places a content or SEO lead as primary owner, with input from the CMO for strategy and the technical team for schema implementation tasks. L8EntSpace is designed to be accessible to non-technical marketing teams for day-to-day use, with a Technical Analyzer that surfaces clearly described implementation tasks for developers when required.',
      },
      {
        question: 'What are the three quickest GEO wins I can implement today?',
        answer: '(1) Add explicit AI crawler permissions to your robots.txt: GPTBot, ClaudeBot, PerplexityBot, and Google-Extended must be allowed or you are invisible to AI citation regardless of content quality. L8EntSpace\'s Technical Analyzer checks this. (2) Add 5–10 specific, numbered Cite-Magnet facts to the body copy of your highest-traffic pages. (3) Publish one comprehensive FAQ page covering the top 10 questions your customers ask, the format AI models most reliably cite.',
        link: { text: 'Run Technical Analyzer', href: '/dashboard' },
      },
    ],
  },
];

// Condensed knowledge base for Citacious system prompt
// Aura knowledge base — full coverage of all 10 FAQ categories, voice-optimised format.
// Concise, conversational answers covering every topic a public visitor might raise.
export const AURA_FAQ_KNOWLEDGE = `
WHAT IS GEO:
Generative Engine Optimization is the practice of engineering your brand knowledge so AI models like ChatGPT, Gemini, Claude, and Perplexity cite your brand as authoritative. Unlike traditional SEO which ranks links, GEO embeds brand facts into the AI knowledge layer so your brand appears in AI-generated answers. L8EntSpace measures, improves, and automates this for you.

WHAT IS AEO:
Answer Engine Optimization (AEO) is structuring content so answer engines (Google AI Overviews, ChatGPT, Perplexity, voice assistants) select your content as the definitive answer. It overlaps with GEO: AEO targets being the answer, GEO targets being cited as the source. L8EntSpace covers both.

WHAT IS AI SHARE OF VOICE (A-SoV):
A-SoV is the percentage of relevant AI responses that mention your brand. If AI mentions you in 4 out of 10 relevant responses, your SoV is 40%. L8EntSpace tracks this live across up to seven engines: ChatGPT, Gemini, Claude, Perplexity, Grok, DeepSeek, and Google AI Overviews. Early-stage brands can realistically achieve 30 to 60 percent SoV in their niche within the first few months.

WHY GEO MATTERS NOW:
Over 50% of consumers now use AI for product and service research before buying. If your brand is not being cited by AI, you are invisible to that audience. GEO is not a future trend. It is happening right now. Brands that establish AI citation authority in 2025 will be very difficult to displace once AI models consolidate their knowledge.

HOW AI ENGINES DIFFER:
ChatGPT and Perplexity use real-time web retrieval, so fresh, high-quality content can appear in their responses within 1 to 2 weeks. Google Gemini and Anthropic Claude primarily rely on their training data, meaning embedding your brand in those models takes 6 to 12 weeks. L8EntSpace tracks your citation rate across each engine separately (including Grok, DeepSeek, and Google AI Overviews) so you can see where you are winning and where you still need to build presence.

WHAT ARE CITE-MAGNETS:
Cite-Magnets are structured brand facts engineered specifically to be cited by AI. A good Cite-Magnet has three parts: a specific verifiable claim, a quantified detail, and clear brand attribution. For example: L8EntSpace maps brand-concept associations across 768 semantic dimensions using Gemini text-embedding-004. This structure makes it easy for AI to extract and cite.

WHAT IS THE L8ENTSPACE PLATFORM:
L8EntSpace is an integrated GEO platform with eight core tools. GEO-Pulse scans your keywords across AI engines in real time. Fact-Vault is your brand knowledge base. Content Scorer grades your content on AI citability. Brand Monitor watches the web for citation opportunities. Competitors tracks rival brands in your GEO space. Agents auto-generates GEO-optimised articles. Technical Analyzer audits your site for AI crawlability. AI Simulator previews how AI engines would respond to queries about your brand today.

WHAT IS CITACIOUS:
Citacious is L8EntSpace's dashboard AI strategist: a real-time voice assistant with deep knowledge of your brand's Fact-Vault, your live SoV metrics, and the full GEO strategy playbook. She lives inside your dashboard and can navigate between tools, analyse your data, suggest next actions, and explain exactly what to do and why. She is powered by Google Gemini Live and responds in under 500 milliseconds.

PRICING AND PLANS:
L8EntSpace offers tiered subscription plans billed monthly or annually. Annual plans include a significant discount. All plans include GEO-Pulse, Fact-Vault, Content Scorer, and Citacious from day one. Higher tiers unlock more probe queries, more competitor slots, and advanced features. You can cancel any time with no lock-in on monthly plans. There is a Starter plan for immediate access, and an Enterprise plan with unlimited queries, multi-brand management, and dedicated support. For enterprise pricing, contact sales@l8entspace.com.

HOW TO GET STARTED:
Create your account at l8entspace.com. Then in order of impact: complete your brand profile in Settings with your brand name, domain, and competitors; add 10 to 20 Cite-Magnet facts to your Fact-Vault; run GEO-Pulse on your three most important target queries; run the Technical Analyzer on your domain; and talk to Citacious for a strategic briefing. This gives you a complete picture of where you stand within 20 minutes.

HOW LONG BEFORE RESULTS:
Retrieval-based engines like Perplexity and ChatGPT browsing mode can pick up fresh content within 1 to 2 weeks. Training-based improvement in Gemini and Claude takes 6 to 12 weeks. A well-executed first 30 days (50 plus facts in the Fact-Vault, 3 GEO articles published, Technical Analyzer fixes implemented) creates the foundation for measurable SoV growth from week 5 onwards.

SECURITY AND GDPR:
All data is encrypted at rest with AES-256 and in transit with TLS 1.3. Your data is stored in Google Firestore with strict user-level isolation, meaning only your account can access your brand data. L8EntSpace is UK GDPR compliant, operated from Hampshire, UK. Voice audio from sessions is not stored by L8EntSpace beyond the live session. Your brand data is never used to train third-party AI models.

COMPETITOR TRACKING:
L8EntSpace tracks competitor brands AI Share of Voice alongside yours, showing which competitors are gaining or losing citation share and where their content is becoming stale. The platform surfaces specific Trojan Horse opportunities: topic areas where you can publish fresh authoritative content that supersedes a competitor's weakening AI presence and captures their citation share.

CONTACT AND SUPPORT:
You can reach L8EntSpace at sales@l8entspace.com for sales, enterprise pricing, or support questions. The platform is operated from Hampshire, UK. For questions about data or privacy, the same email address reaches our data team.
`;

export const CITACIOUS_GEO_KNOWLEDGE = `
GEO KNOWLEDGE BASE (authoritative answers for common queries):

WHAT IS GEO: Generative Engine Optimization (GEO) is engineering brand knowledge so AI models like ChatGPT, Gemini, Claude, and Perplexity cite your brand as authoritative. Unlike SEO (ranking links), GEO embeds brand facts into the AI knowledge layer. L8EntSpace measures, improves, and automates this.

AEO: Answer Engine Optimization is structuring content so answer engines (AI Overviews, ChatGPT, Perplexity, voice assistants) select it as THE answer. Overlaps with GEO: AEO = be the answer, GEO = be the cited source. L8EntSpace instruments both.

AI SHARE OF VOICE (A-SoV): The % of relevant AI responses that mention your brand. Measured live by running probe queries across up to 7 AI engines (ChatGPT, Gemini, Claude, Perplexity, Grok, DeepSeek, Google AI Overviews). 40% SoV = brand appears in 4/10 relevant AI responses. Early-stage brands can realistically achieve 30-60% SoV in their niche.

CITE-MAGNETS: Structured brand facts engineered for AI citation. Must contain: specific verifiable claim + quantified detail + clear brand attribution. Example: "L8EntSpace maps brand-concept associations across 768 semantic dimensions using Gemini text-embedding-004, chosen for 40% lower inference cost vs 1536-D alternatives."

MOAT SCORE: Cosine similarity between brand embedding and target concept embeddings in high-dimensional space (768-D Gemini text-embedding-004, the designed default; OpenAI 1536-D is an optional override). Measures how strongly AI models associate your brand with attributes you want to own.

TROJAN HORSE STRATEGY: Identify where competitor data is stale in AI models, publish fresh authoritative content that supersedes it. Entirely ethical: wins citation on quality, not manipulation.

BRAND INTELLIGENCE PANEL: The dashboard overview panel (visible on the Overview tab) shows real data from the user's probe history, NOT synthetic data. Contains five sub-views:
- Citation Trend: line chart of citation rate over time from consecutive probe runs
- Platforms: per-engine citation rate with delta vs previous probe run
- Competitors: head-to-head competitor data extracted from probe results; includes trojan queries (where the competitor is cited but the user is not)
- Drift Alerts: statistically significant citation rate changes detected via two-proportion z-test (|z| > 1.96). Alerts the user to genuine shifts vs normal run-to-run variance
- Content Scores: content readiness scores if the user has run the Content Scorer
If no probes have been run, the panel shows an honest empty state with a link to run the first probe.

CONTENT GAP CLOSED-LOOP: The Citation Probe page includes a "Closed Gaps" view. After running a probe, the user can see which previously-uncited query topics now have covering facts in the Fact-Vault (gaps closed) vs which remain open. This closes the probe→fact→probe measurement loop so users can confirm that adding a new fact actually reduces their citation gaps.

GEO LAB: A longitudinal testing environment for fact claims. After verifying a fact against AI engines (checking whether AI responses about the user's category include that fact), facts are tagged with a verificationStatus: 'unverified', 'verified', or 'decayed'. 'Decayed' means a previously verified fact is no longer appearing in AI responses, possibly because a model retrain dropped it. The GEO Lab re-tests facts on a schedule so decay is caught early.

LATENT SPACE MAP (UMAP): Visual representation of the user's facts and competitor facts in reduced 2D projection of the 768-D embedding space (Gemini text-embedding-004). Anchor cards show facts that are semantically distant from the user's brand concept centroid: these are the highest-priority gaps to fill. The grid is bright enough to read (zinc-600 lines on zinc-950 background). Camera starts at z=25, fov=55 to show the full point cloud.

DRIFT DETECTION: The Brand Intelligence panel compares consecutive probe pairs using a two-proportion z-test on cited counts per engine. Formula: z = (p2-p1) / sqrt(pPool * (1-pPool) * (1/n1 + 1/n2)). A z-score beyond ±1.96 (α=0.05) is flagged as a drift event. Requires minimum 5 queries per probe run for statistical validity. This distinguishes genuine model-level changes from sampling noise inherent in stochastic AI systems.

L8ENTSPACE MODULES (13 tools, guide users through these in this strategic order):

MEASUREMENT LAYER (understand where you stand):
1. GEO-Pulse: Real-time keyword scanning across ChatGPT, Claude, Gemini, Perplexity. Run on target queries to see who is being cited and with what facts. Start here.
2. Citation Probe: Directly queries up to seven AI engines (ChatGPT, Gemini, Claude, Perplexity, Grok, DeepSeek, Google AI Overviews) with the user's target questions and checks whether the brand appears in each response. Most accurate citation measurement available. Shows exact citation excerpts, per-engine rates, and competitor head-to-head results.
3. AI SOV Overview: Dashboard showing AI Share of Voice trend over time, competitor comparison, platform breakdown, and sentiment radar.
4. Brand Monitor: Web mention scanning that surfaces new content that could influence AI citations, positive signals to amplify, competitor claims to counter.
5. SOV Simulator: A/B test content changes before deploying. Preview impact on citation probability.

KNOWLEDGE LAYER (build what AI will cite):
6. Fact-Vault: The foundation. All brand Cite-Magnets and structured facts live here. Every other module draws from it. A well-populated Fact-Vault is prerequisite for everything else.
7. Content Scorer: Grades content on GEO readiness: entity density, entropy, schema markup, citation probability. Suggests specific edits.
8. Technical Analyzer (Edge & Schema): Audits AI crawlability across robots.txt, schema markup, page performance, and canonical URLs. Generates prioritised fix list.
8b. FAQ Architect (Pro): Generates a deploy-ready FAQ page from the user's probe history (real queries, prioritising uncited/gap queries) and Fact-Vault. All brand claims grounded in verified facts, never invented. Outputs: Preview with source attribution, HTML + embedded FAQPage JSON-LD with per-question anchor IDs (e.g. /faq#what-is-geo), JSON-LD only, and Markdown. Per-question anchor IDs enable AI deep-link citations. Re-run a Citation Probe 1-2 weeks after publishing to measure citation lift on gap queries.

EXECUTION LAYER (actually move the needle):
9. Multi-Agent Crawler (Agents): Automated content pipeline. Crawls the web for topic context, extracts high-entropy facts, generates JSON-LD schema, synthesises a GEO-optimised article. Publishes to Fact-Vault and CMS webhook.
10. GEO Autopilot: The complete probe→generate→publish→re-probe loop in one action. Target a query, Autopilot identifies what's being cited, generates counter-content, publishes it, and measures impact. This is the execution engine, not a dashboard.
11. Competitor Radar: Tracks rival AI Share of Voice, surfaces content decay and Trojan Horse opportunities where competitor data is stale and can be displaced with fresher authoritative content.

ENTITY & INFRASTRUCTURE LAYER (establish permanent brand presence):
12. Entity Hub: Brand entity establishment for Wikidata, Google Knowledge Panel, schema.org, and other knowledge graphs. Generates complete entity profile with Wikidata description, key statements, sameAs links. One-time setup, permanent compounding value.
13. Schema Deploy: One JavaScript snippet on the customer's website. Injects dynamically-generated JSON-LD structured data from the Fact-Vault. Every new fact added appears in schema within minutes. Works on any platform.

TEO FRAMEWORK: L8EntSpace's GEO strategy is structured around three axes:
- Ontological (what the brand IS in AI minds) → Fact-Vault, Entity Hub, Schema Deploy
- Epistemological (what the brand KNOWS and can prove) → Citation Probe, Content Scorer, GEO-Pulse
- Teleological (what the brand is FOR / where it's going) → Agents, Autopilot, Competitor Radar

RECOMMENDED WORKFLOW FOR NEW USERS:
Day 1: Settings (brand profile) → Fact-Vault (10+ facts) → GEO-Pulse (baseline) → Technical Analyzer
Week 1: Content Scorer on key pages → Citation Probe → Entity Hub checklist → Schema Deploy snippet
Week 2+: Agents (first article) → Autopilot loop → Competitor Radar (Trojan Horse opportunities) → repeat

MEASUREMENT HONESTY: GEO-Pulse and Overview SOV metrics are estimated via Exa web search + Gemini interpretation, meaningful as trend indicators. Citation Probe is the most accurate measurement (actual Gemini query). Real SOV improvement for RAG engines: 1-2 weeks. Training-based: 6-12 weeks.

SECURITY: AES-256 at rest, TLS 1.3 in transit, Firestore user-level isolation, complete audit trail. UK GDPR compliant. Voice audio NOT stored beyond session.
`;
