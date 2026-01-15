import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import pkg from "../package.json" assert { type: "json" };

export class McpTransport {
  private client = new Client(
    { name: pkg.name, version: pkg.version },
    { capabilities: {} },
  );
  private transport: StreamableHTTPClientTransport | null = null;
  private connected = false;

  constructor(
    private config: { apiUrl: string; apiKey: string; localUpload?: boolean },
  ) { }

  isConnected = () => this.connected;

  async connect(): Promise<void> {
    if (this.connected) return;
    const url = new URL("/mcp", this.config.apiUrl);
    if (this.config.localUpload) url.searchParams.set("local_upload", "1");
    this.transport = new StreamableHTTPClientTransport(url, {
      requestInit: {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      },
    });
    await this.client.connect(this.transport);
    this.connected = true;
  }

  async callTool(name: string, args: Record<string, unknown>) {
    if (!this.connected) await this.connect();
    const r = (await this.client.callTool({
      name,
      arguments: args,
    })) as CallToolResult;
    return {
      content: r.content.map((c) => ({
        type: c.type,
        text: c.type === "text" ? c.text : undefined,
      })),
    };
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.client.close().catch(() => { });
      this.transport = null;
      this.connected = false;
    }
  }
}
