import { McpTransport } from "./transport.js";
import type { PageIndexClientConfig } from "./types.js";

export class PageIndexClient {
  private transport: McpTransport;

  constructor(config: PageIndexClientConfig) {
    this.transport = new McpTransport({
      apiUrl: config.apiUrl.replace(/\/$/, ""),
      apiKey: config.apiKey,
      localUpload: config.localUpload,
    });
  }

  connect = () => this.transport.connect();
  isConnected = () => this.transport.isConnected();
  close = () => this.transport.close();
}
