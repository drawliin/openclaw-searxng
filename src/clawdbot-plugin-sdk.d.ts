declare module 'clawdbot/plugin-sdk' {
  export interface OpenClawTool {
    label: string;
    name: string;
    description: string;
    parameters: unknown;
    execute(
      toolCallId: string,
      args: unknown,
    ): Promise<{ content: Array<{ type: 'text'; text: string }>; details: unknown }>;
  }

  export interface OpenClawLogger {
    info(message: string): void;
    warn?(message: string): void;
    error?(message: string): void;
  }

  export interface OpenClawPluginApi {
    logger: OpenClawLogger;
    pluginConfig?: unknown;
    registerTool(tool: OpenClawTool, options?: { optional?: boolean }): void;
  }
}
