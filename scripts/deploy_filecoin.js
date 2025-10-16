const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment to Filecoin network...");
  
  // Get the contract factory
  const MedicalCertificateNFT = await ethers.getContractFactory("MedicalCertificateNFT");
  
  // Deploy the contract
  console.log("Deploying MedicalCertificateNFT...");
  const medicalCertNFT = await MedicalCertificateNFT.deploy();
  
  // Wait for deployment to complete
  await medicalCertNFT.waitForDeployment();
  
  const contractAddress = await medicalCertNFT.getAddress();
  
  console.log("✅ MedicalCertificateNFT deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);
  
  // Verify deployment by checking owner
  const owner = await medicalCertNFT.owner();
  console.log("Contract Owner:", owner);
  
  // Check if owner is authorized as doctor
  const isOwnerAuthorized = await medicalCertNFT.authorizedDoctors(owner);
  console.log("Owner is authorized doctor:", isOwnerAuthorized);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: owner,
    timestamp: new Date().toISOString(),
    transactionHash: medicalCertNFT.deploymentTransaction().hash
  };
  
  console.log("\n📋 Deployment Information:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Instructions for next steps
  console.log("\n🔧 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update your .env file with NEXT_PUBLIC_CONTRACT_ADDRESS=" + contractAddress);
  console.log("3. Update your .env file with NEXT_PUBLIC_NETWORK_ID=" + hre.network.config.chainId);
  console.log("4. Run 'npm run dev' to start the frontend");
  
  if (hre.network.name === "hyperspace") {
    console.log("\n🌐 Filecoin Hyperspace Testnet Configuration:");
    console.log("Network Name: Filecoin Hyperspace");
    console.log("RPC URL: https://api.hyperspace.node.glif.io/rpc/v1");
    console.log("Chain ID: 3141");
    console.log("Currency Symbol: tFIL");
    console.log("Block Explorer: https://hyperspace.filscan.io/");
  } else if (hre.network.name === "filecoin") {
    console.log("\n🌐 Filecoin Mainnet Configuration:");
    console.log("Network Name: Filecoin");
    console.log("RPC URL: https://api.node.glif.io/rpc/v1");
    console.log("Chain ID: 314");
    console.log("Currency Symbol: FIL");
    console.log("Block Explorer: https://filscan.io/");
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
