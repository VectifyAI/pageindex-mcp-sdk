import { PageIndexClient, PageIndexError } from '@pageindex/mcp-sdk';
import { NextResponse } from 'next/server';
import { getConfigFromRequest, validatePageIndexConfig } from '@/lib/config';

function getClient(req: Request) {
  const config = getConfigFromRequest(req);
  const { valid, missing } = validatePageIndexConfig(config);

  if (!valid) {
    throw new Error(`Missing configuration: ${missing.join(', ')}`);
  }

  return new PageIndexClient({
    apiUrl: config.pageindexApiUrl,
    apiKey: config.pageindexApiKey,
    folderScope: config.folderScope,
  });
}

function handleError(error: unknown, defaultMessage: string) {
  if (error instanceof PageIndexError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: defaultMessage }, { status: 500 });
}

export async function GET(req: Request) {
  try {
    const client = getClient(req);
    await client.connect();

    const result = await client.tools.recentDocuments();

    return NextResponse.json({
      docs: result.docs,
      totalShown: result.total_shown,
      processingCount: result.processing_count,
      readyCount: result.ready_count,
      failedCount: result.failed_count,
    });
  } catch (error) {
    console.error('Failed to fetch recent documents:', error);
    return handleError(error, 'Failed to fetch documents');
  }
}
