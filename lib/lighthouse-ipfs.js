import { lighthouse } from '@lighthouse-web3/sdk';
import CryptoJS from 'crypto-js';

/**
 * IPFS Storage Service using Lighthouse
 */
class LighthouseIPFSService {
  constructor() {
    this.apiKey = null;
    this.initializeClient();
  }

  /**
   * Initialize Lighthouse client
   */
  initializeClient() {
    const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;
    if (!apiKey) {
      console.warn('Lighthouse API key not found. Please set NEXT_PUBLIC_LIGHTHOUSE_API_KEY');
      return;
    }
    this.apiKey = apiKey;
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
   * Upload file to IPFS via Lighthouse
   * @param {File} file - File to upload
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} IPFS CID
   */
  async uploadToIPFS(file, metadata = {}) {
    if (!this.apiKey) {
      throw new Error('Lighthouse API key not initialized. Please check your API key.');
    }

    try {
      // Create metadata file
      const metadataFile = new File(
        [JSON.stringify(metadata, null, 2)],
        'metadata.json',
        { type: 'application/json' }
      );

      // Upload both files using Lighthouse
      const response = await lighthouse.upload([file, metadataFile], this.apiKey);
      
      if (response.data && response.data.Hash) {
        return response.data.Hash;
      } else {
        throw new Error('Invalid response from Lighthouse');
      }
    } catch (error) {
      console.error('Error uploading to IPFS via Lighthouse:', error);
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
      // Generate file hash
      const fileHash = await this.generateFileHash(pdfFile);
      
      // Encrypt the file
      const { encryptedData, iv } = await this.encryptFile(pdfFile, encryptionPassword);
      
      // If Lighthouse is not configured, use mock data for testing
      if (!this.apiKey) {
        console.warn('Lighthouse not configured, using mock data for testing');
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
    if (!this.apiKey) {
      throw new Error('Lighthouse API key not initialized');
    }

    try {
      const response = await lighthouse.download(cid, this.apiKey);
      return response;
    } catch (error) {
      console.error('Error retrieving from IPFS:', error);
      throw error;
    }
  }

  /**
   * Get IPFS gateway URL
   * @param {string} cid - IPFS CID
   * @returns {string} Gateway URL
   */
  getGatewayURL(cid) {
    return `https://gateway.lighthouse.storage/ipfs/${cid}`;
  }
}

// Create singleton instance
const lighthouseIPFSService = new LighthouseIPFSService();

export default lighthouseIPFSService;
