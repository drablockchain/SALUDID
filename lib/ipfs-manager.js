import { CURRENT_PROVIDER, IPFS_PROVIDERS } from './ipfs-config.js';

/**
 * IPFS Manager - Handles multiple IPFS providers
 */
class IPFSManager {
  constructor() {
    this.provider = CURRENT_PROVIDER;
    this.service = null;
    this.initializeService();
  }

  /**
   * Initialize the appropriate IPFS service
   */
  async initializeService() {
    try {
      if (this.provider === IPFS_PROVIDERS.WEB3_STORAGE) {
        const { default: Web3StorageService } = await import('./ipfs.js');
        this.service = Web3StorageService;
      } else if (this.provider === IPFS_PROVIDERS.LIGHTHOUSE) {
        const { default: LighthouseService } = await import('./lighthouse-ipfs.js');
        this.service = LighthouseService;
      } else {
        throw new Error(`Unsupported IPFS provider: ${this.provider}`);
      }
      
      console.log(`✅ IPFS Service initialized with ${this.provider}`);
    } catch (error) {
      console.error('❌ Failed to initialize IPFS service:', error);
      // Fallback to Web3.Storage
      const { default: Web3StorageService } = await import('./ipfs.js');
      this.service = Web3StorageService;
    }
  }

  /**
   * Get the current IPFS service
   */
  getService() {
    return this.service;
  }

  /**
   * Get current provider name
   */
  getProviderName() {
    return this.provider;
  }

  /**
   * Switch provider (for testing)
   */
  async switchProvider(newProvider) {
    if (newProvider === this.provider) {
      return;
    }
    
    this.provider = newProvider;
    await this.initializeService();
  }
}

// Create singleton instance
const ipfsManager = new IPFSManager();

export default ipfsManager;
