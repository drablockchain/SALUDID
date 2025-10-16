import { Web3Storage } from 'web3.storage';
import CryptoJS from 'crypto-js';
import { CURRENT_PROVIDER, IPFS_PROVIDERS, getProviderStatus } from './ipfs-config.js';
import StorachaIPFSService from './storacha-ipfs.js';
import PinataIPFSService from './pinata-ipfs.js';

/**
 * IPFS Storage Service - Supports multiple providers
 */
class IPFSService {
  constructor() {
    this.client = null;
    this.provider = CURRENT_PROVIDER;
    this.initializeClient();
  }

  /**
   * Initialize IPFS client based on current provider
   */
  initializeClient() {
    console.log(`🔧 Using IPFS Provider: ${this.provider}`);
    console.log(`📊 Status: ${getProviderStatus()}`);
    
    if (this.provider === IPFS_PROVIDERS.WEB3_STORAGE) {
      this.initializeWeb3Storage();
    } else if (this.provider === IPFS_PROVIDERS.LIGHTHOUSE) {
      // Lighthouse will be handled by lighthouse-ipfs.js
      console.log('📡 Lighthouse provider will be used via lighthouse-ipfs.js');
           } else if (this.provider === IPFS_PROVIDERS.STORACHA) {
             this.initializeStoracha();
           } else if (this.provider === IPFS_PROVIDERS.PINATA) {
             this.initializePinata();
           }
  }

  /**
   * Initialize Web3.Storage client
   */
  initializeWeb3Storage() {
    const token = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN;
    if (!token) {
      console.warn('Web3.Storage token not found. Please set NEXT_PUBLIC_WEB3_STORAGE_TOKEN');
      return;
    }
    this.client = new Web3Storage({ token });
  }

  /**
   * Initialize Storacha client
   */
  initializeStoracha() {
    this.storachaService = new StorachaIPFSService();
    this.storachaService.initialize();
    console.log('✅ Storacha.network client initialized');
  }

  initializePinata() {
    this.pinataService = new PinataIPFSService();
    this.pinataService.initialize();
    console.log('✅ Pinata client initialized');
  }

  /**
   * Encrypt file content using AES encryption
   * @param {File} file - File to encrypt
   * @param {string} password - Encryption password
   * @returns {Promise<{encryptedData: string, iv: string}>}
   */
  async encryptFile(file, password) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const fileData = reader.result;
          const iv = CryptoJS.lib.WordArray.random(16);
          const encrypted = CryptoJS.AES.encrypt(
            CryptoJS.lib.WordArray.create(fileData),
            password,
            { iv: iv }
          );
          
          resolve({
            encryptedData: encrypted.toString(),
            iv: iv.toString()
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Decrypt file content
   * @param {string} encryptedData - Encrypted data
   * @param {string} password - Decryption password
   * @param {string} iv - Initialization vector
   * @returns {string} Decrypted data
   */
  decryptFile(encryptedData, password, iv) {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, password, {
      iv: CryptoJS.enc.Hex.parse(iv)
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Generate hash for file content
   * @param {File} file - File to hash
   * @returns {Promise<string>} SHA-256 hash
   */
  async generateFileHash(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const fileData = reader.result;
          const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(fileData)).toString();
          resolve(hash);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Hash patient name for privacy
   * @param {string} patientName - Patient name
   * @returns {string} Hashed name
   */
  hashPatientName(patientName) {
    return CryptoJS.SHA256(patientName).toString();
  }

  /**
   * Upload file to IPFS via Web3.Storage
   * @param {File} file - File to upload
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} IPFS CID
   */
  async uploadToIPFS(file, metadata = {}) {
    if (this.provider === IPFS_PROVIDERS.STORACHA) {
      return await this.storachaService.uploadToIPFS(file, metadata);
    } else if (this.provider === IPFS_PROVIDERS.PINATA) {
      return await this.pinataService.uploadToIPFS(file, metadata);
    }
    
    if (!this.client) {
      throw new Error('Web3.Storage client not initialized. Please check your token.');
    }

    try {
      // Create metadata file
      const metadataFile = new File(
        [JSON.stringify(metadata, null, 2)],
        'metadata.json',
        { type: 'application/json' }
      );

      // Upload both files
      const cid = await this.client.put([file, metadataFile], {
        name: `medical-certificate-${Date.now()}`,
        maxRetries: 3
      });

      return cid;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
  }

  /**
   * Upload encrypted medical certificate
   * @param {File} pdfFile - PDF file to upload
   * @param {Object} certificateData - Certificate metadata
   * @param {string} encryptionPassword - Password for encryption
   * @returns {Promise<{cid: string, hash: string, encryptedData: string, iv: string}>}
   */
  async uploadEncryptedCertificate(pdfFile, certificateData, encryptionPassword) {
    try {
      // Use Storacha if configured
      if (this.provider === IPFS_PROVIDERS.STORACHA) {
        return await this.storachaService.uploadEncryptedCertificate(pdfFile, certificateData, encryptionPassword);
      } else if (this.provider === IPFS_PROVIDERS.PINATA) {
        return await this.pinataService.uploadEncryptedCertificate(pdfFile, certificateData, encryptionPassword);
      }
      
      // Generate file hash for other providers
      const fileHash = await this.generateFileHash(pdfFile);
      
      // Encrypt the file
      const { encryptedData, iv } = await this.encryptFile(pdfFile, encryptionPassword);
      
      // If Web3.Storage is not configured, use mock data for testing
      if (!this.client) {
        console.warn('Web3.Storage not configured, using mock data for testing');
        const mockCid = `QmMock${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
        
        return {
          cid: mockCid,
          hash: fileHash,
          encryptedData,
          iv
        };
      }
      
      // Create encrypted file object
      const encryptedFile = new File(
        [encryptedData],
        pdfFile.name + '.encrypted',
        { type: 'text/plain' }
      );

      // Prepare metadata
      const metadata = {
        ...certificateData,
        originalFileName: pdfFile.name,
        fileSize: pdfFile.size,
        uploadDate: new Date().toISOString(),
        encryption: {
          algorithm: 'AES-256-CBC',
          iv: iv
        }
      };

      // Upload to IPFS
      const cid = await this.uploadToIPFS(encryptedFile, metadata);

      return {
        cid,
        hash: fileHash,
        encryptedData,
        iv
      };
    } catch (error) {
      console.error('Error uploading encrypted certificate:', error);
      throw error;
    }
  }

  /**
   * Retrieve file from IPFS
   * @param {string} cid - IPFS CID
   * @returns {Promise<File>} Retrieved file
   */
  async retrieveFromIPFS(cid) {
    if (!this.client) {
      throw new Error('Web3.Storage client not initialized');
    }

    try {
      const res = await this.client.get(cid);
      if (!res.ok) {
        throw new Error(`Failed to retrieve from IPFS: ${res.status}`);
      }

      const files = await res.files();
      return files[0]; // Return the first file
    } catch (error) {
      console.error('Error retrieving from IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload certificate JSON to IPFS
   * @param {Object} certificateData - Complete certificate data
   * @returns {Promise<{cid: string}>} IPFS CID
   */
  async uploadCertificateJSON(certificateData) {
    if (this.provider === IPFS_PROVIDERS.STORACHA) {
      return await this.storachaService.uploadCertificateJSON(certificateData);
    } else if (this.provider === IPFS_PROVIDERS.PINATA) {
      return await this.pinataService.uploadCertificateJSON(certificateData);
    }
    
    if (!this.client) {
      console.warn('IPFS client not configured, using mock data');
      const mockCid = `QmJSON${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
      return { cid: mockCid };
    }

    try {
      // Create JSON file
      const jsonContent = JSON.stringify(certificateData, null, 2);
      const jsonFile = new File(
        [jsonContent],
        `certificate-${certificateData.tokenId}.json`,
        { type: 'application/json' }
      );

      // Upload to IPFS
      const cid = await this.uploadToIPFS(jsonFile, {
        type: 'medical_certificate_json',
        tokenId: certificateData.tokenId,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Certificate JSON uploaded to IPFS:', cid);
      return { cid };

    } catch (error) {
      console.error('❌ Failed to upload certificate JSON:', error);
      throw error;
    }
  }

  /**
   * Get IPFS gateway URL
   * @param {string} cid - IPFS CID
   * @returns {string} Gateway URL
   */
  getGatewayURL(cid) {
    return `https://${cid}.ipfs.w3s.link/`;
  }
}

// Create singleton instance
const ipfsService = new IPFSService();

export default ipfsService;
