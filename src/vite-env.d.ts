/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  aistudio?: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}
