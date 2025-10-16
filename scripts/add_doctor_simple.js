const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x6Ae38115D6e1aa16Cf6B436a6Bb468392350F388";
  
  // Cambia esta dirección por la del doctor que quieres autorizar
  const doctorAddress = "0xF850d6eBeE56184c0784e79Ee8c1813ece29d6d8"; // ← CAMBIA ESTA DIRECCIÓN
  
  console.log("🏥 Contrato:", contractAddress);
  console.log("👨‍⚕️ Doctor a autorizar:", doctorAddress);
  
  const signers = await ethers.getSigners();
  const owner = signers[0];
  
  console.log("👤 Usando cuenta:", owner.address);
  
  const contract = await ethers.getContractAt("MedicalCertificateNFT", contractAddress, owner);
  
  // Verificar que somos el owner
  const contractOwner = await contract.owner();
  console.log("🏠 Owner del contrato:", contractOwner);
  
  if (owner.address.toLowerCase() !== contractOwner.toLowerCase()) {
    console.log("❌ Error: Solo el owner puede autorizar doctores");
    return;
  }
  
  console.log("🔐 Autorizando doctor...");
  const tx = await contract.authorizeDoctor(doctorAddress, true);
  console.log("📝 Transaction hash:", tx.hash);
  console.log("✅ Transacción enviada! El doctor será autorizado cuando se confirme.");
  console.log("🔗 Ver en explorer: https://calibration.filscan.io/tx/" + tx.hash);
}

main().catch(console.error);
