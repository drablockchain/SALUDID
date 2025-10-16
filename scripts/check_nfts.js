const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verificando NFTs en el contrato...\n");

  // Obtener el contrato
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const MedicalCertificateNFT = await ethers.getContractFactory("MedicalCertificateNFT");
  const contract = MedicalCertificateNFT.attach(contractAddress);

  try {
    // Verificar información básica del contrato
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    
    console.log("📋 Información del Contrato:");
    console.log(`   Nombre: ${name}`);
    console.log(`   Símbolo: ${symbol}`);
    console.log(`   Total Supply: ${totalSupply.toString()}\n`);

    if (totalSupply.toString() === "0") {
      console.log("❌ No hay NFTs mintidos en el contrato");
      console.log("💡 Necesitas emitir un certificado desde el frontend");
      return;
    }

    // Verificar cada NFT mintido
    console.log("🎫 NFTs Encontrados:");
    for (let i = 0; i < totalSupply; i++) {
      try {
        const owner = await contract.ownerOf(i);
        const tokenURI = await contract.tokenURI(i);
        
        console.log(`\n   Token ID: ${i}`);
        console.log(`   Owner: ${owner}`);
        console.log(`   Token URI: ${tokenURI}`);
        
        // Verificar datos del certificado
        const certData = await contract.getCertificateData(i);
        console.log(`   IPFS CID: ${certData.ipfsCid}`);
        console.log(`   Document Hash: ${certData.documentHash}`);
        console.log(`   Doctor: ${certData.doctorAddress}`);
        console.log(`   Activo: ${certData.isActive}`);
        
      } catch (error) {
        console.log(`   Token ID ${i}: Error - ${error.message}`);
      }
    }

    // Verificar balance de la cuenta principal
    const [owner] = await ethers.getSigners();
    const balance = await contract.balanceOf(owner.address);
    console.log(`\n💰 Balance de ${owner.address}: ${balance.toString()} NFTs`);

  } catch (error) {
    console.error("❌ Error verificando NFTs:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
