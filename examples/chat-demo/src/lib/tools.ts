import { tool } from 'ai';
import { z } from 'zod';
import { PageIndexClient } from '@pageindex/sdk';

// Tool schemas - using camelCase to match SDK types
const recentDocumentsSchema = z.object({});

const findRelevantDocumentsSchema = z.object({
  nameOrDescriptionFilter: z
    .string()
    .optional()
    .describe('Filter documents by their name or description (metadata only, NOT content).'),
  limit: z.number().min(1).max(20).default(10).optional().describe('Number of documents to return'),
});

const getDocumentSchema = z.object({
  docName: z.string().min(1).describe('Document name from recent_documents()'),
});

const getDocumentStructureSchema = z.object({
  docName: z.string().min(1).describe('Document name from recent_documents()'),
  part: z.number().int().min(1).default(1).optional().describe('Part number for pagination'),
});

const getPageContentSchema = z.object({
  docName: z.string().min(1).describe('Document name from recent_documents()'),
  pages: z
    .string()
    .min(1)
    .describe('Page specification: "5", "3,7,10", "5-10", or "1-3,7,9-12"'),
});

// Tool descriptions
const TOOL_DESCRIPTIONS = {
  recent_documents:
    'List your recent document uploads with processing status. Returns up to 5 most recent documents. Use this to check which documents are ready for analysis.',
  find_relevant_documents:
    'Find documents in your collection by filtering on document NAMES and DESCRIPTIONS (metadata only). Use when user asks about their documents.',
  get_document:
    'Get detailed information about a specific document by name. Use to check document status before accessing content.',
  get_document_structure:
    'Extract the hierarchical structure of a completed document. Returns structured outline with headers, sections, and page references. Use for documents over 20 pages.',
  get_page_content:
    'Extract specific page content from processed documents. Best practice: Use get_document_structure() first to identify relevant sections.',
};

export function buildPageIndexTools(client: PageIndexClient) {
  return {
    pageindex_recent_documents: tool({
      description: TOOL_DESCRIPTIONS.recent_documents,
      inputSchema: recentDocumentsSchema,
      execute: async () => client.tools.recentDocuments(),
    }),
    pageindex_find_relevant_documents: tool({
      description: TOOL_DESCRIPTIONS.find_relevant_documents,
      inputSchema: findRelevantDocumentsSchema,
      execute: async (params) => client.tools.findRelevantDocuments(params),
    }),
    pageindex_get_document: tool({
      description: TOOL_DESCRIPTIONS.get_document,
      inputSchema: getDocumentSchema,
      execute: async (params) => client.tools.getDocument(params),
    }),
    pageindex_get_document_structure: tool({
      description: TOOL_DESCRIPTIONS.get_document_structure,
      inputSchema: getDocumentStructureSchema,
      execute: async (params) => client.tools.getDocumentStructure(params),
    }),
    pageindex_get_page_content: tool({
      description: TOOL_DESCRIPTIONS.get_page_content,
      inputSchema: getPageContentSchema,
      execute: async (params) => client.tools.getPageContent(params),
    }),
  };
}
