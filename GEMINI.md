# 768-D Latent Space Visualization

## Data Source
The "Neural Cluster Distribution" (Latent Map) is a visualization of the **Reputational Twin** generated during a brand's **Deep Semantic Audit**. 
1. **Extraction:** During an Audit, we execute a "Semantic Crawl" – a series of approx. 1,000+ targeted prompts across major LLMs (Gemini, GPT-4, Claude) to extract qualitative citations.
2. **Embedding:** Each extracted citation is passed through the **Gemini-004** 768-dimensional embedding model.
3. **Dimensionality Reduction:** We use **UMAP** to project these embeddings into the 3D space shown in the dashboard.
4. **Efficiency:** To manage costs and latency, the dashboard visualizes the **Cached Latent State** from the most recent Audit, rather than re-crawling the LLMs on every page load. A full crawl consumes roughly 250k - 750k tokens depending on brand complexity.

## Model Specificity
The map can be filtered by **Model (Gemini, ChatGPT, Claude)**. 
- **All:** Shows the collective latent space of the major LLM providers.
- **Model-Specific:** Shows how *that specific model* structures its internal representation of the brand. This is useful for identifying model-specific biases or "reputational blind spots".

## Anchor Nodes
The large, solid monoliths in the 3D map are **Semantic Anchors**. These represent stable, high-confidence clusters of information that the LLMs use as reference points for your brand.
- **Positive Anchors:** Strengths, technical moats, and high-veracity citations.
- **Risk Anchors:** Negative associations, hallucinations, or competitive overlaps.
