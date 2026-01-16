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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get('fileName');
  const fileType = searchParams.get('fileType');

  if (!fileName || !fileType) {
    return NextResponse.json(
      { error: 'fileName and fileType are required' },
      { status: 400 }
    );
  }

  try {
    const client = getClient();
    await client.connect();

    const result = await client.tools.getSignedUploadUrl({
      fileName,
      fileType,
    });

    return NextResponse.json({
      uploadUrl: result.upload_url,
      fileName: result.file_name,
      originalName: result.original_name,
    });
  } catch (error) {
    console.error('Failed to get signed upload URL:', error);
    return handleError(error, 'Failed to get upload URL');
  }
}

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      );
    }

    const client = getClient();
    await client.connect();

    const result = await client.tools.submitDocument({ fileName });

    return NextResponse.json({
      docName: result.doc_name,
      status: result.status,
      submittedAt: result.submitted_at,
      estimatedCompletion: result.estimated_completion,
    });
  } catch (error) {
    console.error('Failed to submit document:', error);
    return handleError(error, 'Failed to submit document');
  }
}
