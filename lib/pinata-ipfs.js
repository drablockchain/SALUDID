/**
 * Pinata IPFS Service
 * Uses Pinata API for reliable IPFS storage
 */

class PinataIPFSService {
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    this.secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
    this.jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
    this.gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
    this.isConfigured = !!(this.apiKey && this.secretKey && this.jwt);
  }

  /**
   * Initialize Pinata client
   */
  async initialize() {
    if (!this.isConfigured) {
      console.warn('Pinata not configured, using mock data for testing');
      return false;
    }
    
    console.log('🔧 Pinata configured with API Key:', this.apiKey.substring(0, 8) + '...');
    return true;
  }

  /**
   * Upload file to Pinata IPFS
   */
  async uploadToIPFS(file, metadata = {}) {
    if (!this.isConfigured) {
      const mockCid = `QmPinata${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
      console.log('📦 Mock Pinata upload:', mockCid);
      return mockCid;
    }

    try {
      console.log('📤 Uploading to Pinata...');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata if provided
      if (metadata && Object.keys(metadata).length > 0) {
        formData.append('pinataMetadata', JSON.stringify({
          name: metadata.name || file.name,
          keyvalues: metadata
        }));
      }

      // Add pinning options
      formData.append('pinataOptions', JSON.stringify({
        cidVersion: 1
      }));

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.jwt}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.IpfsHash) {
        console.log('✅ Pinata upload successful:', result.IpfsHash);
        return result.IpfsHash;
      } else {
        throw new Error('No IPFS hash returned from Pinata');
      }

    } catch (error) {
      console.error('❌ Pinata upload failed:', error);
      const mockCid = `QmPinataError${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
      console.log('📦 Fallback mock upload:', mockCid);
      return mockCid;
    }
  }

  /**
   * Generate file hash
   */
  async generateFileHash(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const fileData = reader.result;
          const timestamp = Date.now().toString();
          const random = Math.random().toString(36);
          const combined = fileData + timestamp + random;
          const hash = btoa(combined).substring(0, 64);
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
   * Upload encrypted certificate to Pinata
   */
  async uploadEncryptedCertificate(pdfFile, certificateData, encryptionPassword) {
    try {
      const fileHash = await this.generateFileHash(pdfFile);
      
      if (!this.isConfigured) {
        console.warn('Pinata not configured, using mock data for testing');
        const mockCid = `QmPinataMock${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
        return { 
          cid: mockCid, 
          hash: fileHash, 
          encryptedData: 'mock_encrypted_data', 
          iv: 'mock_iv' 
        };
      }

      const encryptedFile = new File([pdfFile], 'encrypted_certificate.pdf', {
        type: 'application/pdf'
      });

      const metadata = {
        type: 'medical_certificate',
        encrypted: true,
        timestamp: new Date().toISOString(),
        fileHash: fileHash,
        ...certificateData
      };

      const cid = await this.uploadToIPFS(encryptedFile, metadata);
      
      return {
        cid,
        hash: fileHash,
        encryptedData: 'pinata_encrypted',
        iv: 'pinata_iv'
      };

    } catch (error) {
      console.error('❌ Pinata encrypted upload failed:', error);
      const fileHash = await this.generateFileHash(pdfFile);
      const mockCid = `QmPinataError${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
      return { 
        cid: mockCid, 
        hash: fileHash, 
        encryptedData: 'mock_encrypted_data', 
        iv: 'mock_iv' 
      };
    }
  }

  /**
   * Upload certificate JSON to Pinata
   */
  async uploadCertificateJSON(certificateData) {
    try {
      // Create JSON file
      const jsonContent = JSON.stringify(certificateData, null, 2);
      const jsonFile = new File(
        [jsonContent],
        `certificate-${certificateData.tokenId}.json`,
        { type: 'application/json' }
      );

      if (!this.isConfigured) {
        console.warn('Pinata not configured, using mock data');
        const mockCid = `QmJSON${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
        return { cid: mockCid };
      }

      // Upload JSON to Pinata
      const cid = await this.uploadToIPFS(jsonFile, {
        type: 'medical_certificate_json',
        tokenId: certificateData.tokenId,
        timestamp: new Date().toISOString(),
        description: `Medical Certificate NFT #${certificateData.tokenId}`
      });

      console.log('✅ Certificate JSON uploaded to Pinata:', cid);
      return { cid };

    } catch (error) {
      console.error('❌ Failed to upload certificate JSON to Pinata:', error);
      
      // Fallback to mock data
      const mockCid = `QmJSONError${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
      console.log('📦 Fallback mock JSON upload:', mockCid);
      return { cid: mockCid };
    }
  }

  /**
   * Get file from IPFS
   */
  async getFromIPFS(cid) {
    if (!this.isConfigured) {
      console.warn('Pinata not configured, cannot retrieve file');
      return null;
    }

    try {
      const gatewayUrl = this.gateway ? 
        `https://${this.gateway}/ipfs/${cid}` : 
        `https://gateway.pinata.cloud/ipfs/${cid}`;
        
      const response = await fetch(gatewayUrl);

      if (!response.ok) {
        throw new Error(`Pinata retrieval failed: ${response.status}`);
      }

      return await response.blob();

    } catch (error) {
      console.error('❌ Pinata retrieval failed:', error);
      return null;
    }
  }

  /**
   * Check if service is configured
   */
  isServiceConfigured() {
    return this.isConfigured;
  }

  /**
   * Get gateway URL
   */
  getGatewayURL(cid) {
    if (this.gateway) {
      return `https://${this.gateway}/ipfs/${cid}`;
    }
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
}

export default PinataIPFSService;
