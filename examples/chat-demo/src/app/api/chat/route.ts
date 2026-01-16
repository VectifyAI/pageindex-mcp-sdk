import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';

export const maxDuration = 30;

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
      part.url.startsWith('data:application/json;base64,')
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
      fileTextContents.push(`<document name="${filename}">\n[Unable to decode file content]\n</document>`);
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
  const { messages }: { messages: UIMessage[] } = await req.json();

  const normalizedMessages = messages.map(normalizeMessageFileParts);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages: await convertToModelMessages(normalizedMessages),
  });

  return result.toUIMessageStreamResponse();
}
