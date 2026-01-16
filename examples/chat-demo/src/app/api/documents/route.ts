import { PageIndexClient, PageIndexError } from '@pageindex/sdk';
import { NextResponse } from 'next/server';

function getClient() {
  const apiUrl = process.env.PAGEINDEX_API_URL;
  const apiKey = process.env.PAGEINDEX_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('PAGEINDEX_API_URL and PAGEINDEX_API_KEY must be set');
  }

  return new PageIndexClient({ apiUrl, apiKey });
}

function handleError(error: unknown, defaultMessage: string) {
  if (error instanceof PageIndexError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 500 }
    );
  }
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json(
    { error: defaultMessage },
    { status: 500 }
  );
}

export async function GET() {
  try {
    const client = getClient();
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
