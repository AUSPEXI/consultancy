export type ProviderMode = 'heuristic' | 'local' | 'remote';

export interface ProviderConfig {
  mode: ProviderMode;
  // Local provider options (e.g., Ollama)
  localBaseUrl?: string; // e.g., http://localhost:11434
  localModel?: string;
  // Remote provider options (disabled by default)
  remoteBaseUrl?: string;
  remoteApiKey?: string;
  remoteModel?: string;
}

export const defaultProviderConfig: ProviderConfig = {
  mode: 'heuristic',
};


