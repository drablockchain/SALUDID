import { ethers } from 'ethers';

/**
 * Blockchain Service for Medical Certificate NFT interactions
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    this.networkId = process.env.NEXT_PUBLIC_NETWORK_ID || '314159'; // Filecoin Calibration por defecto
  }

  /**
   * Initialize provider and signer
   */
  async initialize() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      // Contract will be initialized after network check
    } else {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }
  }

  /**
   * Initialize contract instance
   */
  async initializeContract() {
    if (!this.contractAddress) {
      throw new Error('Contract address not configured');
    }

    // Ensure contract exists on current network to avoid ambiguous call exceptions
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    let code;
    try {
      code = await this.provider.getCode(this.contractAddress);
    } catch (e) {
      throw new Error('RPC not reachable for current network. If using localhost (1337), start `npx hardhat node`.');
    }
    if (!code || code === '0x') {
      throw new Error('Contract not found at address on current network. Check NEXT_PUBLIC_CONTRACT_ADDRESS and NEXT_PUBLIC_NETWORK_ID.');
    }

    const contractABI = [
      // ERC-721 functions
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function ownerOf(uint256 tokenId) view returns (address)",
      "function tokenURI(uint256 tokenId) view returns (string)",
      "function balanceOf(address owner) view returns (uint256)",
      
      // Medical Certificate specific functions
      "function mintCertificate(address to, string memory ipfsCid, string memory documentHash, string memory patientNameHash, string memory diagnosis) external returns (uint256)",
      "function verifyCertificate(uint256 tokenId) view returns (bool isValid, string memory ipfsCid, string memory documentHash, address doctorAddress, uint256 issueDate)",
      "function getCertificateData(uint256 tokenId) view returns (tuple(string patientNameHash, uint256 issueDate, string ipfsCid, string documentHash, address doctorAddress, string diagnosis, bool isActive))",
      "function authorizeDoctor(address doctor, bool authorized) external",
      "function authorizedDoctors(address doctor) view returns (bool)",
      "function isDocumentHashUsed(string memory documentHash) view returns (bool)",
      "function totalCertificates() view returns (uint256)",
      "function revokeCertificate(uint256 tokenId) external",
      
      // Events
      "event CertificateIssued(uint256 indexed tokenId, address indexed patient, address indexed doctor, string ipfsCid, string documentHash)",
      "event DoctorAuthorized(address indexed doctor, bool authorized)",
      "event CertificateVerified(uint256 indexed tokenId, bool isValid)"
    ];

    this.contract = new ethers.Contract(
      this.contractAddress,
      contractABI,
      this.signer
    );
  }

  /**
   * Check if MetaMask is connected to the correct network
   */
  async checkNetwork() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const network = await this.provider.getNetwork();
    const expectedChainId = parseInt(this.networkId);

    if (network.chainId !== BigInt(expectedChainId)) {
      throw new Error(`Please switch to the correct network. Expected chain ID: ${expectedChainId}, Current: ${network.chainId}`);
    }

    return true;
  }

  /**
   * Request account access
   */
  async requestAccountAccess() {
    if (typeof window !== 'undefined' && window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } else {
      throw new Error('MetaMask not detected');
    }
  }

  /**
   * Get current account address
   */
  async getCurrentAccount() {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    return await this.signer.getAddress();
  }

  /**
   * Check if current account is authorized doctor
   */
  async isAuthorizedDoctor(address = null) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const doctorAddress = address || await this.getCurrentAccount();
    return await this.contract.authorizedDoctors(doctorAddress);
  }

  /**
   * Mint a new medical certificate
   */
  async mintCertificate(certificateData) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const {
        patientAddress,
        ipfsCid,
        documentHash,
        patientNameHash,
        diagnosis
      } = certificateData;

      // Check if doctor is authorized
      const isAuthorized = await this.isAuthorizedDoctor();
      if (!isAuthorized) {
        throw new Error('You are not an authorized doctor');
      }

      // Check if document hash is already used
      const isHashUsed = await this.contract.isDocumentHashUsed(documentHash);
      if (isHashUsed) {
        throw new Error('This document has already been used');
      }

      // Mint the certificate
      console.log('🔨 Minting certificate with data:', {
        patientAddress,
        ipfsCid,
        documentHash,
        patientNameHash,
        diagnosis
      });
      
      const tx = await this.contract.mintCertificate(
        patientAddress,
        ipfsCid,
        documentHash,
        patientNameHash,
        diagnosis
      );
      
      console.log('📝 Transaction hash:', tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Extract token ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'CertificateIssued';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        return {
          tokenId: parsed.args.tokenId.toString(),
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber
        };
      }

      throw new Error('Certificate minted but token ID not found in events');
    } catch (error) {
      console.error('Error minting certificate:', error);
      throw error;
    }
  }

  /**
   * Verify a certificate
   */
  async verifyCertificate(tokenId) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.verifyCertificate(tokenId);
      return {
        isValid: result.isValid,
        ipfsCid: result.ipfsCid,
        documentHash: result.documentHash,
        doctorAddress: result.doctorAddress,
        issueDate: new Date(Number(result.issueDate) * 1000)
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
  }

  /**
   * Get certificate data
   */
  async getCertificateData(tokenId) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const data = await this.contract.getCertificateData(tokenId);
      return {
        patientNameHash: data.patientNameHash,
        issueDate: new Date(Number(data.issueDate) * 1000),
        ipfsCid: data.ipfsCid,
        documentHash: data.documentHash,
        doctorAddress: data.doctorAddress,
        diagnosis: data.diagnosis,
        isActive: data.isActive
      };
    } catch (error) {
      console.error('Error getting certificate data:', error);
      throw error;
    }
  }

  /**
   * Get total number of certificates
   */
  async getTotalCertificates() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const total = await this.contract.totalCertificates();
      return total.toString();
    } catch (error) {
      console.error('Error getting total certificates:', error);
      throw error;
    }
  }

  /**
   * Check if document hash is used
   */
  async isDocumentHashUsed(documentHash) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.isDocumentHashUsed(documentHash);
    } catch (error) {
      console.error('Error checking document hash:', error);
      throw error;
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const network = await this.provider.getNetwork();
    return {
      chainId: network.chainId.toString(),
      name: network.name
    };
  }

  /**
   * Format network name for display
   */
  getNetworkDisplayName(chainId) {
    const networks = {
      '314': 'Filecoin Mainnet',
      '314159': 'Filecoin Calibration Testnet'
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;
