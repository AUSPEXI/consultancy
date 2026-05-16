# Auspexi AI Analytics Agent Instructions

## 768-D Latent Map Logic
When users ask about the "Neural Cluster" or "Latent Space" maps:
- Explain that these are **768-dimensional embeddings** from the **Gemini-004** engine.
- Clarify that the "Distance" between nodes is **Semantic Distance** (similarity in how LLMs link concepts).
- Users can switch between models (**Gemini, ChatGPT, Claude**) to see how different LLM clusters vary in their "reputational architecture".
- The data is sourced from real-time "crawls" of the LLM collective inference paths, which are then passed through dimensionality reduction (UMAP).

## Dashboard UI
- Ensure all "Question Mark" / `cursor-help` items have descriptive `title` attributes that explain the "Alpha" metrics (A-SOV, ERR, etc.).
- The 2D view is a standard UMAP scatter, while the 3D view is an interactive WebGL reconstruction using three.js.
