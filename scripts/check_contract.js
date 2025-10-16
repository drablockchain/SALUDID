const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verificando contrato y NFTs...");
  
  try {
    // Get the deployer account
    const signers = await ethers.getSigners();
    if (signers.length === 0) {
      throw new Error("No signers available");
    }
    const deployer = signers[0];
    console.log("👤 Checking with account:", deployer.address);
    
    // Get contract instance
    const contractAddress = "0x6Ae38115D6e1aa16Cf6B436a6Bb468392350F388";
    const contract = await ethers.getContractAt("MedicalCertificateNFT", contractAddress, deployer);
    
    // Get total certificates
    const totalCertificates = await contract.totalCertificates();
    console.log("📊 Total certificates minted:", totalCertificates.toString());
    
    // Check if deployer is authorized doctor
    const isAuthorized = await contract.authorizedDoctors(deployer.address);
    console.log("🩺 Deployer is authorized doctor:", isAuthorized);
    
    // Get owner of contract
    const owner = await contract.owner();
    console.log("👑 Contract owner:", owner);
    
    if (totalCertificates > 0) {
      console.log("\n📋 Certificate details:");
      for (let i = 0; i < totalCertificates; i++) {
        try {
          const certificateData = await contract.getCertificateData(i);
          console.log(`\n📜 Certificate #${i}:`);
          console.log("  Patient Name Hash:", certificateData.patientNameHash);
          console.log("  Issue Date:", new Date(Number(certificateData.issueDate) * 1000).toISOString());
          console.log("  IPFS CID:", certificateData.ipfsCid);
          console.log("  Document Hash:", certificateData.documentHash);
          console.log("  Doctor Address:", certificateData.doctorAddress);
          console.log("  Diagnosis:", certificateData.diagnosis);
          console.log("  Is Active:", certificateData.isActive);
        } catch (error) {
          console.log(`❌ Error getting certificate #${i}:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => {
    console.log("\n✅ Check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Check failed:", error);
    process.exit(1);
  });
