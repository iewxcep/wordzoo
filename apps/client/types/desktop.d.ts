export interface DesktopBridge {
  getVersion(): Promise<string>;
  openExternal(url: string): Promise<{ ok: boolean }>;
}

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}

export {};
