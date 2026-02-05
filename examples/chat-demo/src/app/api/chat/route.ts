import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
  type LanguageModel,
} from 'ai';
import { PageIndexClient } from '@pageindex/mcp-sdk';
import { buildPageIndexTools } from '@/lib/tools';
import { getConfigFromRequest, validateConfig } from '@/lib/config';

export const maxDuration = 60;

interface FilePart {
  type: 'file';
  url: string;
  filename?: string;
  mediaType?: string;
}

interface TextPart {
  type: 'text';
  text: string;
}

type MessagePart = FilePart | TextPart | { type: string; [key: string]: unknown };

function normalizeMessageFileParts(message: UIMessage): UIMessage {
  if (!message.parts || message.parts.length === 0) {
    return message;
  }

  const parts = message.parts as MessagePart[];
  const normalizedParts = [...parts];

  const fileParts = normalizedParts.filter(
    (part): part is FilePart =>
      part.type === 'file' &&
      'url' in part &&
      typeof part.url === 'string' &&
      part.url.startsWith('data:application/json;base64,'),
  );

  if (fileParts.length === 0) {
    return message;
  }

  const fileTextContents: string[] = [];
  for (const filePart of fileParts) {
    try {
      const base64Payload = filePart.url.replace('data:application/json;base64,', '');
      const jsonString = Buffer.from(base64Payload, 'base64').toString('utf-8');
      const filename = filePart.filename || 'document.json';
      fileTextContents.push(`<document name="${filename}">\n${jsonString}\n</document>`);
    } catch {
      const filename = filePart.filename || 'document.json';
      fileTextContents.push(
        `<document name="${filename}">\n[Unable to decode file content]\n</document>`,
      );
    }
  }

  const filteredParts = normalizedParts.filter((part) => part.type !== 'file');
  const textParts = filteredParts.filter((part): part is TextPart => part.type === 'text');

  if (textParts.length > 0) {
    const separator = textParts[0].text.trim() ? '\n\n' : '';
    textParts[0].text = fileTextContents.join('\n\n') + separator + textParts[0].text;
  } else {
    filteredParts.push({
      type: 'text',
      text: fileTextContents.join('\n\n'),
    });
  }

  return {
    ...message,
    parts: filteredParts as UIMessage['parts'],
  };
}

export async function POST(req: Request) {
  const config = getConfigFromRequest(req);
  const { valid, missing } = validateConfig(config);

  if (!valid) {
    return new Response(JSON.stringify({ error: `Missing configuration: ${missing.join(', ')}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();
  const normalizedMessages = messages.map(normalizeMessageFileParts);

  let model: LanguageModel;
  if (config.provider === 'openrouter') {
    const openrouter = createOpenRouter({ apiKey: config.openrouterApiKey });
    model = openrouter(config.openrouterModel);
  } else {
    const anthropic = createAnthropic({ apiKey: config.anthropicApiKey });
    model = anthropic(config.anthropicModel);
  }

  const pageIndexClient = new PageIndexClient({
    apiUrl: config.pageindexApiUrl,
    apiKey: config.pageindexApiKey,
    folderScope: config.folderScope,
  });

  if (!pageIndexClient.isConnected()) {
    await pageIndexClient.connect();
  }

  const tools = buildPageIndexTools(pageIndexClient);

  const result = streamText({
    model,
    messages: await convertToModelMessages(normalizedMessages),
    tools,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
