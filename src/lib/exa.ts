import Exa from 'exa-js';

let exaClient: Exa | null = null;

export function getExa(): Exa {
  if (!exaClient) {
    const key = process.env.EXA_API_KEY || process.env.VITE_EXA_API_KEY;
    if (!key) {
      throw new Error('EXA_API_KEY environment variable is required');
    }
    exaClient = new Exa(key);
  }
  return exaClient;
}
