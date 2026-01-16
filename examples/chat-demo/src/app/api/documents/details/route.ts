import { PageIndexClient, PageIndexError, type GetDocumentResult } from '@pageindex/sdk';
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
  });
}

export async function POST(req: Request) {
  try {
    const { docNames } = (await req.json()) as { docNames: string[] };

    if (!docNames || !Array.isArray(docNames) || docNames.length === 0) {
      return NextResponse.json({ error: 'docNames array is required' }, { status: 400 });
    }

    if (docNames.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 documents allowed' }, { status: 400 });
    }

    const client = getClient(req);
    await client.connect();

    const results = await Promise.allSettled(
      docNames.map(async (docName) => {
        const doc = await client.tools.getDocument({ docName });
        return { docName, detail: doc };
      }),
    );

    const documents: GetDocumentResult[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        documents.push(result.value.detail);
      } else {
        errors.push(docNames[index]);
      }
    });

    if (documents.length === 0) {
      return NextResponse.json(
        { error: `Failed to fetch documents: ${errors.join(', ')}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ documents, errors });
  } catch (error) {
    console.error('Failed to fetch document details:', error);
    if (error instanceof PageIndexError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch document details' }, { status: 500 });
  }
}
