import { PageIndexTools } from "./tools/index.js";
import { McpTransport } from "./transport.js";

export interface PageIndexClientConfig {
  apiUrl: string;
  apiKey: string;
  localUpload?: boolean;
}

export class PageIndexClient {
  private transport: McpTransport;
  private _tools: PageIndexTools | null = null;

  constructor(config: PageIndexClientConfig) {
    this.transport = new McpTransport({
      apiUrl: config.apiUrl.replace(/\/$/, ""),
      apiKey: config.apiKey,
      localUpload: config.localUpload,
    });
  }

  get tools(): PageIndexTools {
    if (!this._tools) {
      this._tools = new PageIndexTools(this.transport);
    }
    return this._tools;
  }

  connect = () => this.transport.connect();
  isConnected = () => this.transport.isConnected();
  close = () => this.transport.close();
}
