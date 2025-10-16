/**
 * IPFS Configuration - Choose your storage provider
 */

// Available IPFS providers
export const IPFS_PROVIDERS = {
  WEB3_STORAGE: 'web3.storage',
  LIGHTHOUSE: 'lighthouse',
  STORACHA: 'storacha',
  PINATA: 'pinata'
};

// Current provider (change this to switch providers)
export const CURRENT_PROVIDER = IPFS_PROVIDERS.PINATA; // Using Pinata for reliable IPFS

// Provider configuration
export const PROVIDER_CONFIG = {
  [IPFS_PROVIDERS.WEB3_STORAGE]: {
    name: 'Web3.Storage',
    tokenEnvVar: 'NEXT_PUBLIC_WEB3_STORAGE_TOKEN',
    serviceFile: './ipfs.js'
  },
  [IPFS_PROVIDERS.LIGHTHOUSE]: {
    name: 'Lighthouse',
    tokenEnvVar: 'NEXT_PUBLIC_LIGHTHOUSE_API_KEY',
    serviceFile: './lighthouse-ipfs.js'
  },
  [IPFS_PROVIDERS.STORACHA]: {
    name: 'Storacha.network',
    tokenEnvVar: 'NEXT_PUBLIC_STORACHA_DID',
    serviceFile: './storacha-ipfs.js'
  },
  [IPFS_PROVIDERS.PINATA]: {
    name: 'Pinata',
    tokenEnvVar: 'NEXT_PUBLIC_PINATA_JWT',
    serviceFile: './pinata-ipfs.js'
  }
};

// Get current provider config
export function getCurrentProviderConfig() {
  return PROVIDER_CONFIG[CURRENT_PROVIDER];
}

// Check if current provider is configured
export function isProviderConfigured() {
  const config = getCurrentProviderConfig();
  const token = process.env[config.tokenEnvVar];
  return !!token;
}

// Get provider status message
export function getProviderStatus() {
  const config = getCurrentProviderConfig();
  const isConfigured = isProviderConfigured();
  
  if (isConfigured) {
    return `✅ ${config.name} configured`;
  } else {
    return `⚠️ ${config.name} not configured. Please set ${config.tokenEnvVar}`;
  }
}
