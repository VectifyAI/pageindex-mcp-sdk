import { PageIndexTools } from "./tools/index.js";
import { McpTransport } from "./transport.js";

export interface PageIndexClientConfig {
  apiUrl: string;
  apiKey: string;
  folderScope?: string;
}

export class PageIndexClient {
  private transport: McpTransport;
  private _tools: PageIndexTools | null = null;

  constructor(config: PageIndexClientConfig) {
    this.transport = new McpTransport({
      apiUrl: config.apiUrl.replace(/\/$/, ""),
      apiKey: config.apiKey,
      folderScope: config.folderScope,
    });
  }

  setFolderScope(scope: string | undefined): Promise<void> {
    return this.transport.setFolderScope(scope);
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
