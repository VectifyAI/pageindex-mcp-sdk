export interface ApiConfig {
  anthropicApiKey: string;
  pageindexApiUrl: string;
  pageindexApiKey: string;
  folderScope?: string;
}

export function getConfigFromRequest(req: Request): ApiConfig {
  return {
    anthropicApiKey:
      req.headers.get('x-anthropic-api-key') || process.env.ANTHROPIC_API_KEY || '',
    pageindexApiUrl:
      req.headers.get('x-pageindex-api-url') || process.env.PAGEINDEX_API_URL || '',
    pageindexApiKey:
      req.headers.get('x-pageindex-api-key') || process.env.PAGEINDEX_API_KEY || '',
    folderScope: req.headers.get('x-folder-scope') || undefined,
  };
}

export function validateConfig(config: ApiConfig): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!config.anthropicApiKey) missing.push('Anthropic API Key');
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
