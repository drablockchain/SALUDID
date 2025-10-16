const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicalCertificateNFT", function () {
  let medicalCertNFT;
  let owner;
  let doctor;
  let patient;
  let unauthorized;

  beforeEach(async function () {
    [owner, doctor, patient, unauthorized] = await ethers.getSigners();
    
    const MedicalCertificateNFT = await ethers.getContractFactory("MedicalCertificateNFT");
    medicalCertNFT = await MedicalCertificateNFT.deploy();
    await medicalCertNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await medicalCertNFT.owner()).to.equal(owner.address);
    });

    it("Should set the right name and symbol", async function () {
      expect(await medicalCertNFT.name()).to.equal("Medical Certificate");
      expect(await medicalCertNFT.symbol()).to.equal("MEDCERT");
    });

    it("Should authorize the owner as a doctor", async function () {
      expect(await medicalCertNFT.authorizedDoctors(owner.address)).to.be.true;
    });

    it("Should start with zero total certificates", async function () {
      expect(await medicalCertNFT.totalCertificates()).to.equal(0);
    });
  });

  describe("Doctor Authorization", function () {
    it("Should allow owner to authorize doctors", async function () {
      await medicalCertNFT.authorizeDoctor(doctor.address, true);
      expect(await medicalCertNFT.authorizedDoctors(doctor.address)).to.be.true;
    });

    it("Should allow owner to deauthorize doctors", async function () {
      await medicalCertNFT.authorizeDoctor(doctor.address, true);
      await medicalCertNFT.authorizeDoctor(doctor.address, false);
      expect(await medicalCertNFT.authorizedDoctors(doctor.address)).to.be.false;
    });

    it("Should emit DoctorAuthorized event", async function () {
      await expect(medicalCertNFT.authorizeDoctor(doctor.address, true))
        .to.emit(medicalCertNFT, "DoctorAuthorized")
        .withArgs(doctor.address, true);
    });

    it("Should not allow non-owner to authorize doctors", async function () {
      await expect(
        medicalCertNFT.connect(unauthorized).authorizeDoctor(doctor.address, true)
      ).to.be.revertedWithCustomError(medicalCertNFT, "OwnableUnauthorizedAccount");
    });
  });

  describe("Certificate Minting", function () {
    beforeEach(async function () {
      await medicalCertNFT.authorizeDoctor(doctor.address, true);
    });

    it("Should allow authorized doctor to mint certificate", async function () {
      const testData = {
        patientAddress: patient.address,
        ipfsCid: "QmTest123456789",
        documentHash: "0x1234567890abcdef1234567890abcdef12345678",
        patientNameHash: "0xabcdef1234567890abcdef1234567890abcdef12",
        diagnosis: "Test diagnosis"
      };

      await expect(
        medicalCertNFT.connect(doctor).mintCertificate(
          testData.patientAddress,
          testData.ipfsCid,
          testData.documentHash,
          testData.patientNameHash,
          testData.diagnosis
        )
      ).to.emit(medicalCertNFT, "CertificateIssued")
        .withArgs(
          0, // tokenId
          testData.patientAddress,
          doctor.address,
          testData.ipfsCid,
          testData.documentHash
        );

      expect(await medicalCertNFT.totalCertificates()).to.equal(1);
      expect(await medicalCertNFT.ownerOf(0)).to.equal(patient.address);
    });

    it("Should not allow unauthorized doctor to mint certificate", async function () {
      const testData = {
        patientAddress: patient.address,
        ipfsCid: "QmTest123456789",
        documentHash: "0x1234567890abcdef1234567890abcdef12345678",
        patientNameHash: "0xabcdef1234567890abcdef1234567890abcdef12",
        diagnosis: "Test diagnosis"
      };

      await expect(
        medicalCertNFT.connect(unauthorized).mintCertificate(
          testData.patientAddress,
          testData.ipfsCid,
          testData.documentHash,
          testData.patientNameHash,
          testData.diagnosis
        )
      ).to.be.revertedWith("Not an authorized doctor");
    });

    it("Should not allow minting with invalid patient address", async function () {
      const testData = {
        patientAddress: ethers.ZeroAddress,
        ipfsCid: "QmTest123456789",
        documentHash: "0x1234567890abcdef1234567890abcdef12345678",
        patientNameHash: "0xabcdef1234567890abcdef1234567890abcdef12",
        diagnosis: "Test diagnosis"
      };

      await expect(
        medicalCertNFT.connect(doctor).mintCertificate(
          testData.patientAddress,
          testData.ipfsCid,
          testData.documentHash,
          testData.patientNameHash,
          testData.diagnosis
        )
      ).to.be.revertedWith("Invalid patient address");
    });

    it("Should not allow minting with empty IPFS CID", async function () {
      const testData = {
        patientAddress: patient.address,
        ipfsCid: "",
        documentHash: "0x1234567890abcdef1234567890abcdef12345678",
        patientNameHash: "0xabcdef1234567890abcdef1234567890abcdef12",
        diagnosis: "Test diagnosis"
      };

      await expect(
        medicalCertNFT.connect(doctor).mintCertificate(
          testData.patientAddress,
          testData.ipfsCid,
          testData.documentHash,
          testData.patientNameHash,
          testData.diagnosis
        )
      ).to.be.revertedWith("IPFS CID cannot be empty");
    });

    it("Should not allow minting with empty document hash", async function () {
      const testData = {
        patientAddress: patient.address,
        ipfsCid: "QmTest123456789",
        documentHash: "",
        patientNameHash: "0xabcdef1234567890abcdef1234567890abcdef12",
        diagnosis: "Test diagnosis"
      };

      await expect(
        medicalCertNFT.connect(doctor).mintCertificate(
          testData.patientAddress,
          testData.ipfsCid,
          testData.documentHash,
          testData.patientNameHash,
          testData.diagnosis
        )
      ).to.be.revertedWith("Document hash cannot be empty");
    });

    it("Should not allow minting with duplicate document hash", async function () {
      const testData = {
        patientAddress: patient.address,
        ipfsCid: "QmTest123456789",
        documentHash: "0x1234567890abcdef1234567890abcdef12345678",
        patientNameHash: "0xabcdef1234567890abcdef1234567890abcdef12",
        diagnosis: "Test diagnosis"
      };

      // Mint first certificate
      await medicalCertNFT.connect(doctor).mintCertificate(
        testData.patientAddress,
        testData.ipfsCid,
        testData.documentHash,
        testData.patientNameHash,
        testData.diagnosis
      );

      // Try to mint with same document hash
      await expect(
        medicalCertNFT.connect(doctor).mintCertificate(
          testData.patientAddress,
          "QmDifferent123",
          testData.documentHash, // Same hash
          "0xDifferentHash123",
          "Different diagnosis"
        )
      ).to.be.revertedWith("Document hash already used");
    });
  });

  describe("Certificate Verification", function () {
    let tokenId;
    let testData;

    beforeEach(async function () {
      await medicalCertNFT.authorizeDoctor(doctor.address, true);
      
      testData = {
        patientAddress: patient.address,
        ipfsCid: "QmTest123456789",
        documentHash: "0x1234567890abcdef1234567890abcdef12345678",
        patientNameHash: "0xabcdef1234567890abcdef1234567890abcdef12",
        diagnosis: "Test diagnosis"
      };

      const tx = await medicalCertNFT.connect(doctor).mintCertificate(
        testData.patientAddress,
        testData.ipfsCid,
        testData.documentHash,
        testData.patientNameHash,
        testData.diagnosis
      );

      const receipt = await tx.wait();
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
        tokenId = parsed.args.tokenId;
      }
    });

    it("Should verify valid certificate", async function () {
      const verification = await medicalCertNFT.verifyCertificate(tokenId);
      
      expect(verification.isValid).to.be.true;
      expect(verification.ipfsCid).to.equal(testData.ipfsCid);
      expect(verification.documentHash).to.equal(testData.documentHash);
      expect(verification.doctorAddress).to.equal(doctor.address);
      expect(verification.issueDate).to.be.greaterThan(0);
    });

    it("Should return certificate data", async function () {
      const certData = await medicalCertNFT.getCertificateData(tokenId);
      
      expect(certData.patientNameHash).to.equal(testData.patientNameHash);
      expect(certData.ipfsCid).to.equal(testData.ipfsCid);
      expect(certData.documentHash).to.equal(testData.documentHash);
      expect(certData.doctorAddress).to.equal(doctor.address);
      expect(certData.diagnosis).to.equal(testData.diagnosis);
      expect(certData.isActive).to.be.true;
    });

    it("Should check if document hash is used", async function () {
      expect(await medicalCertNFT.isDocumentHashUsed(testData.documentHash)).to.be.true;
      expect(await medicalCertNFT.isDocumentHashUsed("0xDifferentHash123")).to.be.false;
    });

    it("Should not verify non-existent certificate", async function () {
      await expect(
        medicalCertNFT.verifyCertificate(999)
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Certificate Revocation", function () {
    let tokenId;

    beforeEach(async function () {
      await medicalCertNFT.authorizeDoctor(doctor.address, true);
      
      const testData = {
        patientAddress: patient.address,
        ipfsCid: "QmTest123456789",
        documentHash: "0x1234567890abcdef1234567890abcdef12345678",
        patientNameHash: "0xabcdef1234567890abcdef1234567890abcdef12",
        diagnosis: "Test diagnosis"
      };

      const tx = await medicalCertNFT.connect(doctor).mintCertificate(
        testData.patientAddress,
        testData.ipfsCid,
        testData.documentHash,
        testData.patientNameHash,
        testData.diagnosis
      );

      const receipt = await tx.wait();
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
        tokenId = parsed.args.tokenId;
      }
    });

    it("Should allow issuing doctor to revoke certificate", async function () {
      await expect(medicalCertNFT.connect(doctor).revokeCertificate(tokenId))
        .to.emit(medicalCertNFT, "CertificateVerified")
        .withArgs(tokenId, false);

      const certData = await medicalCertNFT.getCertificateData(tokenId);
      expect(certData.isActive).to.be.false;
    });

    it("Should allow owner to revoke certificate", async function () {
      await expect(medicalCertNFT.revokeCertificate(tokenId))
        .to.emit(medicalCertNFT, "CertificateVerified")
        .withArgs(tokenId, false);

      const certData = await medicalCertNFT.getCertificateData(tokenId);
      expect(certData.isActive).to.be.false;
    });

    it("Should not allow unauthorized user to revoke certificate", async function () {
      await expect(
        medicalCertNFT.connect(unauthorized).revokeCertificate(tokenId)
      ).to.be.revertedWith("Not authorized to revoke this certificate");
    });

    it("Should show certificate as invalid after revocation", async function () {
      await medicalCertNFT.connect(doctor).revokeCertificate(tokenId);
      
      const verification = await medicalCertNFT.verifyCertificate(tokenId);
      expect(verification.isValid).to.be.false;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple certificates correctly", async function () {
      await medicalCertNFT.authorizeDoctor(doctor.address, true);
      
      // Mint multiple certificates
      for (let i = 0; i < 3; i++) {
        const testData = {
          patientAddress: patient.address,
          ipfsCid: `QmTest${i}123456789`,
          documentHash: `0x1234567890abcdef1234567890abcdef1234567${i}`,
          patientNameHash: `0xabcdef1234567890abcdef1234567890abcdef1${i}`,
          diagnosis: `Test diagnosis ${i}`
        };

        await medicalCertNFT.connect(doctor).mintCertificate(
          testData.patientAddress,
          testData.ipfsCid,
          testData.documentHash,
          testData.patientNameHash,
          testData.diagnosis
        );
      }

      expect(await medicalCertNFT.totalCertificates()).to.equal(3);
    });

    it("Should handle deauthorized doctor correctly", async function () {
      await medicalCertNFT.authorizeDoctor(doctor.address, true);
      
      // Mint a certificate
      const testData = {
        patientAddress: patient.address,
        ipfsCid: "QmTest123456789",
        documentHash: "0x1234567890abcdef1234567890abcdef12345678",
        patientNameHash: "0xabcdef1234567890abcdef1234567890abcdef12",
        diagnosis: "Test diagnosis"
      };

      await medicalCertNFT.connect(doctor).mintCertificate(
        testData.patientAddress,
        testData.ipfsCid,
        testData.documentHash,
        testData.patientNameHash,
        testData.diagnosis
      );

      // Deauthorize doctor
      await medicalCertNFT.authorizeDoctor(doctor.address, false);

      // Verify certificate should still be valid (issued before deauthorization)
      const verification = await medicalCertNFT.verifyCertificate(0);
      // Note: The certificate should still be valid even if the doctor is deauthorized
      // because it was issued when they were authorized
      expect(verification.isValid).to.be.true;

      // But doctor should not be able to mint new certificates
      await expect(
        medicalCertNFT.connect(doctor).mintCertificate(
          patient.address,
          "QmNew123",
          "0xNewHash123",
          "0xNewNameHash123",
          "New diagnosis"
        )
      ).to.be.revertedWith("Not an authorized doctor");
    });
  });
});
