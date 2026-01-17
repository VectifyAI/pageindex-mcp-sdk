# @pageindex/mcp-sdk

TypeScript SDK for PageIndex document processing via [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). Designed for building AI Agent applications with document management capabilities.

## Features

- **MCP Native**: Built on Model Context Protocol, naturally fits AI Agent tool calling
- **Complete Document Toolchain**: Upload, process, structure extraction, content retrieval, deletion
- **Folder Management**: Create folders, list hierarchy, scope-based filtering
- **TypeScript First**: Full type definitions, ESM/CJS dual module format
- **AI-Friendly Responses**: All tools return `next_steps` field to guide LLM's subsequent actions

## Installation

```bash
# pnpm
pnpm add @pageindex/mcp-sdk

# npm
npm install @pageindex/mcp-sdk

# yarn
yarn add @pageindex/mcp-sdk
```

**Requirements**: Node.js >= 18.0.0

## Quick Start

```typescript
import { PageIndexClient } from "@pageindex/mcp-sdk";

// Create client instance
const client = new PageIndexClient({
  apiUrl: "https://chat.pageindex.ai",
  apiKey: "your-api-key",
  folderScope: "optional-folder-id", // Optional: limit document query scope
});

// Connect to service
await client.connect();

// Use tools
const recentDocs = await client.tools.recentDocuments();
console.log(recentDocs);

// Close connection when done
await client.close();
```

## API Reference

### PageIndexClient

Main client class that manages connection to PageIndex service.

```typescript
interface PageIndexClientConfig {
  apiUrl: string;        // PageIndex API URL
  apiKey: string;        // API key
  folderScope?: string;  // Optional folder scope
}

const client = new PageIndexClient(config);

// Connection management
await client.connect();      // Establish connection
client.isConnected();        // Check connection status
await client.close();        // Close connection

// Folder scope
await client.setFolderScope("folder-id");  // Set folder filter dynamically
await client.setFolderScope(undefined);    // Clear folder filter

// Access tools
client.tools;  // PageIndexTools instance
```

### Tool Methods

All tool methods are accessed via `client.tools`.

#### processDocument

Upload and process a document from URL.

```typescript
const result = await client.tools.processDocument({
  url: "https://example.com/document.pdf",
});

// Return type
interface ProcessDocumentResult {
  doc_name: string;
  status: "processing";
  submitted_at: string;
  estimated_completion: string;
  document_info: {
    pages: number;
    size_bytes: number;
  };
  next_steps: NextSteps;
}
```

#### recentDocuments

Get list of recently uploaded documents.

```typescript
const result = await client.tools.recentDocuments();

// Return type
interface RecentDocumentsResult {
  documents: RecentDocumentItem[];
  next_steps: NextSteps;
}

interface RecentDocumentItem {
  name: string;
  description: string;
  status: "ready" | "processing" | "failed";
  created_at: string;
  page_num?: number;
}
```

#### findRelevantDocuments

Search documents by name or description.

```typescript
const result = await client.tools.findRelevantDocuments({
  nameOrDescriptionFilter: "annual report", // Optional
  folderId: "folder-id",                    // Optional
  cursor: "pagination-cursor",              // Optional
  limit: 10,                                // Optional, default 10
});

// Return type
interface FindRelevantDocumentsResult {
  documents: SearchDocumentItem[];
  total_count: number;
  next_cursor?: string;
  next_steps: NextSteps;
}
```

#### getDocument

Get detailed information about a specific document.

```typescript
const result = await client.tools.getDocument({
  docName: "document-name",
  waitForCompletion: true, // Optional, wait for processing to complete
});

// Return type
interface GetDocumentResult {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  pageNum?: number;
  wait_info?: {
    waited: boolean;
    elapsed_seconds?: number;
    final_status?: string;
  };
  next_steps: NextSteps;
}
```

#### getDocumentStructure

Extract hierarchical structure outline of a document.

```typescript
const result = await client.tools.getDocumentStructure({
  docName: "document-name",
  part: 1,                  // Optional, pagination part
  waitForCompletion: true,  // Optional
});

// Return type
interface GetDocumentStructureResult {
  doc_name: string;
  total_parts: number;
  current_part: number;
  structure: string; // JSON formatted structure data
  next_steps: NextSteps;
}
```

#### getPageContent

Extract content from specific pages of a document.

```typescript
const result = await client.tools.getPageContent({
  docName: "document-name",
  pages: "1-5,10,15-20",    // Page specification
  waitForCompletion: true,  // Optional
});

// Return type
interface GetPageContentResult {
  doc_name: string;
  total_pages: number;
  requested_pages: string;
  returned_pages: string;
  content: PageContentItem[];
  next_steps: NextSteps;
}

interface PageContentItem {
  page: number;
  text: string;
  block_id?: string;
  image_count?: number;
  image_annotations?: string[];
}
```

Page specification supports multiple formats:
- Single page: `"5"`
- Multiple pages: `"3,7,10"`
- Page range: `"5-10"`
- Mixed format: `"1-3,7,9-12"`

#### getSignedUploadUrl

Get pre-signed URL for file upload.

```typescript
const result = await client.tools.getSignedUploadUrl({
  fileName: "document.pdf",
  fileType: "application/pdf",
});

// Return type
interface GetSignedUploadUrlResult {
  upload_url: string;
  file_key: string;
  expires_at: string;
  next_steps: NextSteps;
}
```

#### submitDocument

Submit an uploaded file for processing.

```typescript
const result = await client.tools.submitDocument({
  fileName: "file-key-from-upload",
});

// Return type
interface SubmitDocumentResult {
  doc_name: string;
  status: "processing";
  submitted_at: string;
  next_steps: NextSteps;
}
```

#### removeDocument

Batch delete documents.

```typescript
const result = await client.tools.removeDocument({
  docNames: ["doc-1", "doc-2"],
});

// Return type
interface RemoveDocumentResult {
  results: Array<{
    doc_name: string;
    success: boolean;
    error?: string;
  }>;
  next_steps: NextSteps;
}
```

#### createFolder

Create a folder.

```typescript
const result = await client.tools.createFolder({
  name: "My Folder",
  description: "Folder description", // Optional
  parentFolderId: "parent-id",       // Optional
});

// Return type
interface CreateFolderResult {
  folder: FolderItem;
  next_steps: NextSteps;
}

interface FolderItem {
  id: string;
  name: string;
  description?: string;
  parent_folder_id?: string;
  created_at: string;
}
```

#### listFolders

List folders.

```typescript
const result = await client.tools.listFolders({
  parentFolderId: "parent-id", // Optional, omit to list root level
});

// Return type
interface ListFoldersResult {
  folders: FolderItem[];
  next_steps: NextSteps;
}
```

### Error Handling

The SDK uses `PageIndexError` class with typed error codes:

```typescript
import { PageIndexError } from "@pageindex/mcp-sdk";

try {
  await client.tools.getDocument({ docName: "non-existent" });
} catch (error) {
  if (error instanceof PageIndexError) {
    console.log(error.code);    // 'NOT_FOUND' | 'USAGE_LIMIT_REACHED' | 'INVALID_INPUT' | 'INTERNAL_ERROR'
    console.log(error.message);
    console.log(error.details); // Optional details
  }
}
```

Error codes:

| Code | Description |
|------|-------------|
| `USAGE_LIMIT_REACHED` | Usage quota exceeded |
| `INVALID_INPUT` | Invalid parameters |
| `NOT_FOUND` | Document or resource not found |
| `INTERNAL_ERROR` | Server internal error |

### NextSteps

All tool responses include a `next_steps` field with suggested follow-up actions:

```typescript
interface NextSteps {
  summary: string;    // Action summary
  options: string[];  // Suggested next actions
  auto_retry?: {      // Optional retry indication
    should_retry: boolean;
    delay_seconds: number;
  };
}
```

## Examples

### Chat Demo

`examples/chat-demo` is a complete Next.js application demonstrating SDK integration with AI chat:

**Features**:
- Claude AI-powered document Q&A
- Document upload and management
- Folder scope filtering
- AI tool call visualization
- Runtime configuration settings

**Running the example**:

```bash
# Enter example directory
cd examples/chat-demo

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:3000`. First-time setup requires configuring in settings:
- Anthropic API Key
- PageIndex API URL
- PageIndex API Key

**Tech Stack**:
- Next.js 16 + React 19
- Vercel AI SDK + Anthropic Claude
- Radix UI components
- Tailwind CSS

**Integration Example**:

```typescript
// lib/tools.ts - Build AI-usable tools
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

```typescript
// api/chat/route.ts - Streaming AI response
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

## License

MIT
