/**
 * Local embedding service — generates dense vectors with ZERO network/API cost.
 *
 * How it works:
 *   1. Tokenize text (lowercase, strip punctuation, drop stopwords).
 *   2. Canonicalize each token to its synonym-group key, so semantically
 *      equivalent words ("fast"/"rapid"/"quick") map to the SAME feature.
 *   3. Feature-hash unigrams + bigrams into a fixed-dimension vector with a
 *      signed hash (the "hashing trick"), TF-weighted.
 *   4. L2-normalize so cosine similarity is just a dot product.
 *
 * This is NOT a neural embedding — it captures lexical + synonym overlap, not
 * deep semantics. But it is deterministic, instant, and free, which makes it
 * ideal for rapidly populating an embedding store, then selectively upgrading
 * high-value items to API embeddings later.
 *
 * IMPORTANT: local vectors live in their OWN space ('local-synonym-v1'). Never
 * compare them with API (Gemini/OpenAI) vectors via cosine — only compare
 * vectors of the same space.
 */

import { canonicalize } from './local-synonyms';

export const LOCAL_EMBEDDING_SPACE = 'local-synonym-v1';
export const LOCAL_EMBEDDING_DIM = 768;

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for',
  'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we',
  'they', 'them', 'his', 'her', 'their', 'our', 'your', 'my', 'me', 'us',
  'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would', 'can', 'could',
  'should', 'may', 'might', 'must', 'shall', 'not', 'no', 'so', 'if', 'then',
  'than', 'too', 'very', 'just', 'about', 'into', 'over', 'up', 'down', 'out',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * FNV-1a 32-bit hash — fast, well-distributed, deterministic. We derive two
 * independent values: the bucket index and the sign.
 */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function signHash(str: string): 1 | -1 {
  // A second, salted hash decides the sign — reduces collisions cancelling signal.
  return (fnv1a('s:' + str) & 1) === 0 ? 1 : -1;
}

export class LocalEmbeddingService {
  readonly dim: number;

  constructor(dim: number = LOCAL_EMBEDDING_DIM) {
    this.dim = dim;
  }

  getActiveEngine() {
    return { name: 'local-synonym', model: LOCAL_EMBEDDING_SPACE, dimensions: this.dim };
  }

  embedOne(text: string): number[] {
    const vec = new Float64Array(this.dim);
    const tokens = tokenize(text).map(canonicalize);
    if (tokens.length === 0) return Array.from(vec);

    const addFeature = (feature: string, weight: number) => {
      const idx = fnv1a(feature) % this.dim;
      vec[idx] += signHash(feature) * weight;
    };

    // Unigrams (full weight)
    for (const tok of tokens) addFeature(tok, 1);

    // Bigrams of canonicalized tokens (half weight) — captures local word order
    for (let i = 0; i < tokens.length - 1; i++) {
      addFeature(`${tokens[i]}_${tokens[i + 1]}`, 0.5);
    }

    // L2 normalize
    let norm = 0;
    for (let i = 0; i < this.dim; i++) norm += vec[i] * vec[i];
    norm = Math.sqrt(norm);
    if (norm === 0) return Array.from(vec);
    const out = new Array<number>(this.dim);
    for (let i = 0; i < this.dim; i++) out[i] = vec[i] / norm;
    return out;
  }

  embedMany(texts: string[]): number[][] {
    return texts.map(t => this.embedOne(t));
  }

  /** Cosine similarity for two same-space local vectors. */
  cosine(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
    return dot; // vectors are already L2-normalized
  }
}

export const localEmbeddingService = new LocalEmbeddingService();
