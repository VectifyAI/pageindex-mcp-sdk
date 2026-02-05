export type Provider = 'anthropic' | 'openrouter';

export interface ApiConfig {
  pageindexApiUrl: string;
  pageindexApiKey: string;
  folderScope?: string;

  provider: Provider;

  // Anthropic config
  anthropicApiKey: string;
  anthropicModel: string;

  // OpenRouter config
  openrouterApiKey: string;
  openrouterModel: string;
}

export function getConfigFromRequest(req: Request): ApiConfig {
  const provider = (req.headers.get('x-provider') || 'anthropic') as Provider;

  return {
    pageindexApiUrl:
      req.headers.get('x-pageindex-api-url') || process.env.PAGEINDEX_API_URL || '',
    pageindexApiKey:
      req.headers.get('x-pageindex-api-key') || process.env.PAGEINDEX_API_KEY || '',
    folderScope: req.headers.get('x-folder-scope') || undefined,

    provider,

    anthropicApiKey:
      req.headers.get('x-anthropic-api-key') || process.env.ANTHROPIC_API_KEY || '',
    anthropicModel:
      req.headers.get('x-anthropic-model') || 'claude-sonnet-4-5-20250929',

    openrouterApiKey:
      req.headers.get('x-openrouter-api-key') || process.env.OPENROUTER_API_KEY || '',
    openrouterModel:
      req.headers.get('x-openrouter-model') || 'anthropic/claude-opus-4.5',
  };
}

export function validateConfig(config: ApiConfig): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (config.provider === 'anthropic') {
    if (!config.anthropicApiKey) missing.push('Anthropic API Key');
  } else {
    if (!config.openrouterApiKey) missing.push('OpenRouter API Key');
  }

  if (!config.pageindexApiUrl) missing.push('PageIndex API URL');
  if (!config.pageindexApiKey) missing.push('PageIndex API Key');
  return { valid: missing.length === 0, missing };
}

export function validatePageIndexConfig(config: ApiConfig): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!config.pageindexApiUrl) missing.push('PageIndex API URL');
  if (!config.pageindexApiKey) missing.push('PageIndex API Key');
  return { valid: missing.length === 0, missing };
}
