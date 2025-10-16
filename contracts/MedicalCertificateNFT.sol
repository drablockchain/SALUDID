// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MedicalCertificateNFT
 * @dev ERC-721 contract for medical certificates with Filecoin FVM compatibility
 * @author SaludID4 Team
 */
contract MedicalCertificateNFT is ERC721, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;
    
    // Optional Unlock Protocol integration (membership gating)
    // When set, only addresses with a valid key can mint via authorized doctors
    address public unlockLockAddress;
    
    // Struct to store certificate metadata
    struct CertificateData {
        string patientNameHash; // Hashed patient name for privacy
        uint256 issueDate;
        string ipfsCid;
        string documentHash;
        address doctorAddress;
        string diagnosis;
        bool isActive;
    }
    
    // Mapping from token ID to certificate data
    mapping(uint256 => CertificateData) public certificates;
    
    // Mapping to track authorized doctors
    mapping(address => bool) public authorizedDoctors;
    
    // Mapping to prevent duplicate document hashes
    mapping(string => bool) public usedDocumentHashes;
    
    // Events
    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed patient,
        address indexed doctor,
        string ipfsCid,
        string documentHash
    );
    
    event DoctorAuthorized(address indexed doctor, bool authorized);
    event CertificateVerified(uint256 indexed tokenId, bool isValid);
    event UnlockLockAddressUpdated(address indexed oldAddress, address indexed newAddress);
    
    // Modifiers
    modifier onlyAuthorizedDoctor() {
        require(authorizedDoctors[msg.sender], "Not an authorized doctor");
        _;
    }
    
    modifier validTokenId(uint256 tokenId) {
        require(tokenId < _tokenIdCounter, "Token does not exist");
        _;
    }
    
    constructor() ERC721("Medical Certificate", "MEDCERT") Ownable(msg.sender) {
        // Authorize the contract owner as the first doctor
        authorizedDoctors[msg.sender] = true;
        emit DoctorAuthorized(msg.sender, true);
    }
    
    /**
     * @dev Set the Unlock Protocol Lock address used for membership gating.
     * Setting to address(0) disables Unlock gating.
     */
    function setUnlockLockAddress(address lock) external onlyOwner {
        emit UnlockLockAddressUpdated(unlockLockAddress, lock);
        unlockLockAddress = lock;
    }
    
    /**
     * @dev Authorize or deauthorize a doctor
     * @param doctor Address of the doctor
     * @param authorized Whether to authorize or deauthorize
     */
    function authorizeDoctor(address doctor, bool authorized) external onlyOwner {
        authorizedDoctors[doctor] = authorized;
        emit DoctorAuthorized(doctor, authorized);
    }
    
    /**
     * @dev Mint a new medical certificate NFT
     * @param to Address of the patient
     * @param ipfsCid IPFS CID of the stored document
     * @param documentHash Hash of the original document
     * @param patientNameHash Hashed patient name for privacy
     * @param diagnosis Medical diagnosis
     */
    function mintCertificate(
        address to,
        string memory ipfsCid,
        string memory documentHash,
        string memory patientNameHash,
        string memory diagnosis
    ) external onlyAuthorizedDoctor nonReentrant returns (uint256) {
        // Validate inputs
        require(to != address(0), "Invalid patient address");
        require(bytes(ipfsCid).length > 0, "IPFS CID cannot be empty");
        require(bytes(documentHash).length > 0, "Document hash cannot be empty");
        require(!usedDocumentHashes[documentHash], "Document hash already used");
        
        // If Unlock gating is enabled, require the patient to have a valid key
        if (unlockLockAddress != address(0)) {
            require(_hasUnlockAccess(to), "Unlock membership required");
        }
        
        // Mark document hash as used
        usedDocumentHashes[documentHash] = true;
        
        // Get next token ID
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Create certificate data
        CertificateData memory certData = CertificateData({
            patientNameHash: patientNameHash,
            issueDate: block.timestamp,
            ipfsCid: ipfsCid,
            documentHash: documentHash,
            doctorAddress: msg.sender,
            diagnosis: diagnosis,
            isActive: true
        });
        
        // Store certificate data
        certificates[tokenId] = certData;
        
        // Mint NFT to patient
        _safeMint(to, tokenId);
        
        // Emit event
        emit CertificateIssued(tokenId, to, msg.sender, ipfsCid, documentHash);
        
        return tokenId;
    }

    /**
     * @dev Returns whether the given user has access according to Unlock Protocol.
     * This calls the standard Unlock Lock interface "getHasValidKey" if available.
     */
    function _hasUnlockAccess(address user) internal view returns (bool) {
        if (unlockLockAddress == address(0)) {
            return true;
        }
        (bool success, bytes memory data) = unlockLockAddress.staticcall(
            abi.encodeWithSignature("getHasValidKey(address)", user)
        );
        if (!success || data.length == 0) {
            return false;
        }
        return abi.decode(data, (bool));
    }
    
    /**
     * @dev Verify a certificate by token ID
     * @param tokenId Token ID of the certificate
     * @return isValid Whether the certificate is valid
     * @return ipfsCid IPFS CID of the document
     * @return documentHash Hash of the original document
     * @return doctorAddress Address of the issuing doctor
     * @return issueDate Timestamp when the certificate was issued
     */
    function verifyCertificate(uint256 tokenId) 
        external 
        view 
        validTokenId(tokenId)
        returns (
            bool isValid,
            string memory ipfsCid,
            string memory documentHash,
            address doctorAddress,
            uint256 issueDate
        ) 
    {
        CertificateData memory cert = certificates[tokenId];
        
        isValid = cert.isActive && 
                 bytes(cert.ipfsCid).length > 0;
        
        ipfsCid = cert.ipfsCid;
        documentHash = cert.documentHash;
        doctorAddress = cert.doctorAddress;
        issueDate = cert.issueDate;
    }
    
    /**
     * @dev Get full certificate data
     * @param tokenId Token ID of the certificate
     * @return certData Complete certificate data
     */
    function getCertificateData(uint256 tokenId) 
        external 
        view 
        validTokenId(tokenId)
        returns (CertificateData memory certData) 
    {
        return certificates[tokenId];
    }
    
    /**
     * @dev Revoke a certificate (only by the issuing doctor or owner)
     * @param tokenId Token ID of the certificate to revoke
     */
    function revokeCertificate(uint256 tokenId) 
        external 
        validTokenId(tokenId) 
    {
        CertificateData storage cert = certificates[tokenId];
        require(
            msg.sender == cert.doctorAddress || msg.sender == owner(),
            "Not authorized to revoke this certificate"
        );
        
        cert.isActive = false;
        emit CertificateVerified(tokenId, false);
    }
    
    /**
     * @dev Check if a document hash has been used
     * @param documentHash Hash to check
     * @return used Whether the hash has been used
     */
    function isDocumentHashUsed(string memory documentHash) 
        external 
        view 
        returns (bool used) 
    {
        return usedDocumentHashes[documentHash];
    }
    
    /**
     * @dev Get total number of certificates minted
     * @return count Total count
     */
    function totalCertificates() external view returns (uint256 count) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Override tokenURI to return IPFS metadata
     * @param tokenId Token ID
     * @return Token URI
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override 
        validTokenId(tokenId) 
        returns (string memory) 
    {
        CertificateData memory cert = certificates[tokenId];
        return string(abi.encodePacked("ipfs://", cert.ipfsCid));
    }
    
    /**
     * @dev Override supportsInterface for ERC-721 compatibility
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}
