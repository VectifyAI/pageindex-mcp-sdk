# Chat Demo

A complete Next.js application demonstrating `@pageindex/mcp-sdk` integration with AI chat.

## Features

- Claude AI-powered document Q&A
- Document upload and management
- Folder scope filtering
- AI tool call visualization
- Runtime configuration settings

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:3000`. First-time setup requires configuring in settings:
- Anthropic API Key
- PageIndex API URL
- PageIndex API Key

## Tech Stack

- Next.js 16 + React 19
- Vercel AI SDK + Anthropic Claude
- Radix UI components
- Tailwind CSS

## Integration Example

### Building AI-usable tools

```typescript
// lib/tools.ts
import { tool } from "ai";
import { z } from "zod";
import { PageIndexClient } from "@pageindex/mcp-sdk";

export function buildPageIndexTools(client: PageIndexClient) {
  return {
    pageindex_get_document: tool({
      description: "Get document details by name",
      inputSchema: z.object({
        docName: z.string().describe("Document name"),
      }),
      execute: async (params) => client.tools.getDocument(params),
    }),
    // ... other tools
  };
}
```

### Streaming AI response with tool calling

```typescript
// api/chat/route.ts
import { streamText, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { PageIndexClient } from "@pageindex/mcp-sdk";
import { buildPageIndexTools } from "@/lib/tools";

export async function POST(request: Request) {
  const client = new PageIndexClient({
    apiUrl: "https://chat.pageindex.ai",
    apiKey: "your-key",
  });

  await client.connect();

  const tools = buildPageIndexTools(client);

  const result = await streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    messages: convertToModelMessages(messages),
    tools,
    maxSteps: 10,
  });

  return result.toDataStreamResponse();
}
```
