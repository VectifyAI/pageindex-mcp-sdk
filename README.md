# @pageindex/mcp-sdk

TypeScript SDK for PageIndex document processing via [MCP](https://modelcontextprotocol.io/). Built for AI Agent applications.

## When to Use

- **Programmatic access** to PageIndex in TypeScript/JavaScript
- **Wrapping as tools** for AI frameworks without Remote MCP Server support

> For environments with Remote MCP Server support (Claude Desktop, Cursor), use [Direct Connection](https://github.com/VectifyAI/pageindex-mcp) instead.

## Installation

```bash
pnpm add @pageindex/mcp-sdk
```

Requires Node.js >= 18.0.0

## Quick Start

```typescript
import { PageIndexClient } from '@pageindex/mcp-sdk';

const client = new PageIndexClient({
  apiUrl: 'https://chat.pageindex.ai',
  apiKey: 'your-api-key',
});

await client.connect();
const docs = await client.tools.recentDocuments();
await client.close();
```

## API

### Client

```typescript
const client = new PageIndexClient({ apiUrl, apiKey, folderScope? });

await client.connect();
await client.close();
await client.setFolderScope(folderId);
```

### Tools

All methods via `client.tools`:

| Method | Description |
|--------|-------------|
| `processDocument({ url })` | Upload and process document from URL |
| `recentDocuments()` | List recent uploads |
| `findRelevantDocuments({ nameOrDescriptionFilter?, folderId?, limit? })` | Search documents |
| `getDocument({ docName, waitForCompletion? })` | Get document details |
| `getDocumentStructure({ docName, part?, waitForCompletion? })` | Extract document outline |
| `getPageContent({ docName, pages, waitForCompletion? })` | Extract page content |
| `getSignedUploadUrl({ fileName, fileType })` | Get upload URL |
| `submitDocument({ fileName })` | Submit uploaded file |
| `removeDocument({ docNames })` | Delete documents |
| `createFolder({ name, description?, parentFolderId? })` | Create folder |
| `listFolders({ parentFolderId? })` | List folders |

Page specification formats: `"5"`, `"3,7,10"`, `"5-10"`, `"1-3,7,9-12"`

### Error Handling

```typescript
import { PageIndexError } from '@pageindex/mcp-sdk';

try {
  await client.tools.getDocument({ docName: 'xxx' });
} catch (e) {
  if (e instanceof PageIndexError) {
    // e.code: 'NOT_FOUND' | 'USAGE_LIMIT_REACHED' | 'INVALID_INPUT' | 'INTERNAL_ERROR'
  }
}
```

## Examples

See [examples/chat-demo](./examples/chat-demo) for Next.js + AI SDK integration.

## License

MIT
