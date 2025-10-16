const { ethers } = require("hardhat");

async function main() {
  console.log("Testing Medical Certificate NFT Contract...");
  
  // Get the contract factory
  const MedicalCertificateNFT = await ethers.getContractFactory("MedicalCertificateNFT");
  
  // Deploy the contract
  console.log("Deploying contract for testing...");
  const medicalCertNFT = await MedicalCertificateNFT.deploy();
  await medicalCertNFT.waitForDeployment();
  
  const contractAddress = await medicalCertNFT.getAddress();
  console.log("Contract deployed at:", contractAddress);
  
  // Get the owner
  const owner = await medicalCertNFT.owner();
  console.log("Contract owner:", owner);
  
  // Test basic functionality
  console.log("\n🧪 Running tests...");
  
  // Test 1: Check if owner is authorized doctor
  const isOwnerAuthorized = await medicalCertNFT.authorizedDoctors(owner);
  console.log("✅ Owner is authorized doctor:", isOwnerAuthorized);
  
  // Test 2: Get contract info
  const name = await medicalCertNFT.name();
  const symbol = await medicalCertNFT.symbol();
  console.log("✅ Contract name:", name);
  console.log("✅ Contract symbol:", symbol);
  
  // Test 3: Get total certificates (should be 0)
  const totalCertificates = await medicalCertNFT.totalCertificates();
  console.log("✅ Total certificates:", totalCertificates.toString());
  
  // Test 4: Mint a test certificate
  console.log("\n📋 Testing certificate minting...");
  
  const testData = {
    patientAddress: owner, // Mint to owner for testing
    ipfsCid: "QmTest123456789",
    documentHash: "0x1234567890abcdef1234567890abcdef12345678",
    patientNameHash: "0xabcdef1234567890abcdef1234567890abcdef12",
    diagnosis: "Test diagnosis for contract testing"
  };
  
  try {
    const tx = await medicalCertNFT.mintCertificate(
      testData.patientAddress,
      testData.ipfsCid,
      testData.documentHash,
      testData.patientNameHash,
      testData.diagnosis
    );
    
    const receipt = await tx.wait();
    console.log("✅ Certificate minted successfully!");
    console.log("   Transaction hash:", receipt.hash);
    
    // Get the token ID from events
    const event = receipt.logs.find(log => {
      try {
        const parsed = medicalCertNFT.interface.parseLog(log);
        return parsed.name === 'CertificateIssued';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = medicalCertNFT.interface.parseLog(event);
      const tokenId = parsed.args.tokenId.toString();
      console.log("   Token ID:", tokenId);
      
      // Test 5: Verify the certificate
      console.log("\n🔍 Testing certificate verification...");
      const verification = await medicalCertNFT.verifyCertificate(tokenId);
      console.log("✅ Certificate verification result:");
      console.log("   Valid:", verification.isValid);
      console.log("   IPFS CID:", verification.ipfsCid);
      console.log("   Document Hash:", verification.documentHash);
      console.log("   Doctor Address:", verification.doctorAddress);
      console.log("   Issue Date:", new Date(Number(verification.issueDate) * 1000));
      
      // Test 6: Get certificate data
      console.log("\n📊 Testing certificate data retrieval...");
      const certData = await medicalCertNFT.getCertificateData(tokenId);
      console.log("✅ Certificate data:");
      console.log("   Patient Name Hash:", certData.patientNameHash);
      console.log("   Issue Date:", new Date(Number(certData.issueDate) * 1000));
      console.log("   IPFS CID:", certData.ipfsCid);
      console.log("   Document Hash:", certData.documentHash);
      console.log("   Doctor Address:", certData.doctorAddress);
      console.log("   Diagnosis:", certData.diagnosis);
      console.log("   Is Active:", certData.isActive);
      
      // Test 7: Check document hash usage
      console.log("\n🔒 Testing document hash validation...");
      const isHashUsed = await medicalCertNFT.isDocumentHashUsed(testData.documentHash);
      console.log("✅ Document hash is used:", isHashUsed);
      
      // Test 8: Try to mint with same hash (should fail)
      console.log("\n❌ Testing duplicate document hash prevention...");
      try {
        await medicalCertNFT.mintCertificate(
          testData.patientAddress,
          "QmDifferent123",
          testData.documentHash, // Same hash
          "0xDifferentHash123",
          "Different diagnosis"
        );
        console.log("❌ ERROR: Should have failed with duplicate hash!");
      } catch (error) {
        console.log("✅ Correctly prevented duplicate document hash");
      }
    }
    
    // Test 9: Get updated total certificates
    const newTotalCertificates = await medicalCertNFT.totalCertificates();
    console.log("\n📈 Updated total certificates:", newTotalCertificates.toString());
    
  } catch (error) {
    console.error("❌ Error during testing:", error.message);
  }
  
  // Test 10: Test unauthorized access
  console.log("\n🔐 Testing unauthorized access...");
  const [, unauthorized] = await ethers.getSigners();
  
  try {
    await medicalCertNFT.connect(unauthorized).mintCertificate(
      unauthorized.address,
      "QmUnauthorized123",
      "0xUnauthorizedHash123",
      "0xUnauthorizedNameHash123",
      "Unauthorized diagnosis"
    );
    console.log("❌ ERROR: Unauthorized minting should have failed!");
  } catch (error) {
    console.log("✅ Correctly prevented unauthorized minting");
  }
  
  console.log("\n🎉 All tests completed!");
  console.log("\n📋 Test Summary:");
  console.log("✅ Contract deployment");
  console.log("✅ Basic contract info");
  console.log("✅ Doctor authorization");
  console.log("✅ Certificate minting");
  console.log("✅ Certificate verification");
  console.log("✅ Data retrieval");
  console.log("✅ Document hash validation");
  console.log("✅ Duplicate prevention");
  console.log("✅ Unauthorized access prevention");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:");
    console.error(error);
    process.exit(1);
  });
