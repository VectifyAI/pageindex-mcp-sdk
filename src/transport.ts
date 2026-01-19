import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import pkg from "../package.json" assert { type: "json" };
import { PageIndexError, type PageIndexErrorCode } from "./errors.js";

export class McpTransport {
  private client = new Client(
    { name: pkg.name, version: pkg.version },
    { capabilities: {} },
  );
  private transport: StreamableHTTPClientTransport | null = null;
  private connected = false;
  private folderScope: string | undefined;

  constructor(
    private config: { apiUrl: string; apiKey: string; folderScope?: string },
  ) {
    this.folderScope = config.folderScope;
  }

  async setFolderScope(scope: string | undefined): Promise<void> {
    if (this.folderScope === scope) return;
    this.folderScope = scope;
    if (this.connected) {
      await this.close();
      await this.connect();
    }
  }

  isConnected = () => this.connected;

  async connect(): Promise<void> {
    if (this.connected) return;
    const url = new URL("/mcp", this.config.apiUrl);
    url.searchParams.set("local_upload", "1");
    url.searchParams.set("folder", "1");
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
    };
    if (this.folderScope) {
      headers["X-Folder-Scope"] = this.folderScope;
    }
    this.transport = new StreamableHTTPClientTransport(url, {
      requestInit: { headers },
    });
    await this.client.connect(this.transport);
    this.connected = true;
  }

  async callTool<T = unknown>(
    name: string,
    args: Record<string, unknown>,
  ): Promise<T> {
    if (!this.connected) await this.connect();

    const r = (await this.client.callTool({
      name,
      arguments: args,
    })) as CallToolResult;

    const textContent = r.content.find((c) => c.type === "text");
    const text = textContent?.type === "text" ? textContent.text : undefined;

    if (!text) {
      throw new PageIndexError("Empty response from server", "INTERNAL_ERROR");
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      // Response is not JSON - treat it as a plain text error
      throw new PageIndexError(text, "INTERNAL_ERROR");
    }

    if (r.isError) {
      const { error, errorCode, ...details } = data as {
        error: string;
        errorCode?: PageIndexErrorCode;
        [key: string]: unknown;
      };
      throw new PageIndexError(error, errorCode, details);
    }

    return data as T;
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.client.close().catch(() => {});
      this.transport = null;
      this.connected = false;
    }
  }
}
