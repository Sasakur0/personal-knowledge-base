export {};

declare global {
  interface Window {
    desktopAPI?: {
      selectFiles: () => Promise<string[]>;
    };
  }
}
