import Exa from 'exa-js';

export function getExa(): Exa {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error('EXA_API_KEY is not set');
  return new Exa(apiKey);
}
