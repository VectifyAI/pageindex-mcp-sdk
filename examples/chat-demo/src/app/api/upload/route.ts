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
    const details = error.details as { phase?: string; serverFileName?: string } | undefined;
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        phase: details?.phase,
        serverFileName: details?.serverFileName,
      },
      { status: 500 },
    );
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: defaultMessage }, { status: 500 });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const client = getClient(req);
    await client.connect();

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const result = await client.tools.uploadDocument({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileContent: fileBuffer,
    });

    return NextResponse.json({
      serverFileName: result.serverFileName,
      originalName: result.originalName,
      docName: result.docName,
      status: result.status,
      submittedAt: result.submittedAt,
      estimatedCompletion: result.estimatedCompletion,
    });
  } catch (error) {
    console.error('Failed to upload document:', error);
    return handleError(error, 'Failed to upload document');
  }
}
