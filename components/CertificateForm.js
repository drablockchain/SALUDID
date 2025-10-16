'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import blockchainService from '../lib/blockchain'
import unlockService from '../lib/unlock'
import ipfsService from '../lib/ipfs'
import UnlockCheckoutButton from './UnlockCheckoutButton'

export default function CertificateForm({ 
  isConnected, 
  isAuthorizedDoctor, 
  account,
  isUnlocked,
  onMembershipPurchased
}) {
  const [formData, setFormData] = useState({
    patientName: '',
    patientAddress: '',
    diagnosis: '',
    documentFile: null,
    encryptionPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const handleInputChange = (e) => {
    const { name, value, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }))
  }

  const validateForm = () => {
    if (!formData.patientName.trim()) {
      toast.error('Patient name is required')
      return false
    }
    if (!formData.patientAddress.trim()) {
      toast.error('Patient address is required')
      return false
    }
    if (!formData.diagnosis.trim()) {
      toast.error('Diagnosis is required')
      return false
    }
    if (!formData.documentFile) {
      toast.error('Please upload a document')
      return false
    }
    if (!formData.encryptionPassword.trim()) {
      toast.error('Encryption password is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!isAuthorizedDoctor) {
      toast.error('You are not an authorized doctor')
      return
    }

    // If Unlock is configured, ensure patient address has a valid key before proceeding
    if (unlockService.isConfigured()) {
      const { hasKey } = await unlockService.getMembership(formData.patientAddress)
      if (!hasKey) {
        toast.error('Patient must have an active Unlock membership')
        return
      }
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setStep(2)

    try {
      // Step 1: Upload document to IPFS
      toast.loading('Uploading document to IPFS...', { id: 'upload' })
      
      const certificateData = {
        patientName: formData.patientName,
        diagnosis: formData.diagnosis,
        doctorAddress: account,
        issueDate: new Date().toISOString(),
        documentType: formData.documentFile.type
      }

      const uploadResult = await ipfsService.uploadEncryptedCertificate(
        formData.documentFile,
        certificateData,
        formData.encryptionPassword
      )

      toast.success('Document uploaded successfully!', { id: 'upload' })
      setStep(3)

      // Step 2: Hash patient name for privacy
      const patientNameHash = ipfsService.hashPatientName(formData.patientName)

      // Step 3: Mint NFT
      toast.loading('Minting certificate NFT...', { id: 'mint' })

      const mintResult = await blockchainService.mintCertificate({
        patientAddress: formData.patientAddress,
        ipfsCid: uploadResult.cid,
        documentHash: uploadResult.hash,
        patientNameHash: patientNameHash,
        diagnosis: formData.diagnosis
      })

      toast.success('Certificate issued successfully!', { id: 'mint' })
      setStep(4)

      // Reset form
      setFormData({
        patientName: '',
        patientAddress: '',
        diagnosis: '',
        documentFile: null,
        encryptionPassword: ''
      })

      // Show success details
      toast.success(
        `Certificate #${mintResult.tokenId} issued successfully!`,
        { duration: 6000 }
      )

      // Step 4: Upload complete certificate JSON to Storacha (ONLY if NFT was successful)
      try {
        console.log('📋 NFT minted successfully, now uploading backup JSON...')
        toast.loading('Saving certificate backup to IPFS...', { id: 'json' })
        
        const completeCertificateData = {
          tokenId: mintResult.tokenId,
          patientName: formData.patientName,
          patientAddress: formData.patientAddress,
          patientNameHash: patientNameHash,
          diagnosis: formData.diagnosis,
          doctorAddress: account,
          ipfsCid: uploadResult.cid,
          documentHash: uploadResult.hash,
          transactionHash: mintResult.transactionHash,
          issueDate: new Date().toISOString(),
          documentType: formData.documentFile.type,
          documentName: formData.documentFile.name,
          documentSize: formData.documentFile.size,
          network: 'Filecoin Calibration Testnet',
          contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          type: 'medical_certificate_nft'
        }

        // Upload JSON backup to Storacha
        const jsonUploadResult = await ipfsService.uploadCertificateJSON(completeCertificateData)
        
        toast.success('Certificate backup saved to IPFS!', { id: 'json' })
        
        console.log('🎉 Certificate backup uploaded:', {
          tokenId: mintResult.tokenId,
          jsonCid: jsonUploadResult.cid,
          transactionHash: mintResult.transactionHash
        })
      } catch (jsonError) {
        console.warn('⚠️ JSON backup upload failed (but NFT was minted successfully):', jsonError)
        toast.error('Certificate minted but backup upload failed', { id: 'json' })
      }

    } catch (error) {
      console.error('Error issuing certificate:', error)
      toast.error(`Failed to issue certificate: ${error.message}`)
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔗</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-500">
          Please connect your MetaMask wallet to issue medical certificates.
        </p>
      </div>
    )
  }

  if (!isAuthorizedDoctor) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500 mb-4">
          You are not authorized to issue medical certificates. Only authorized doctors can create certificates.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-yellow-800">
            Contact the contract owner to request doctor authorization.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { step: 1, label: 'Form', icon: '📝' },
            { step: 2, label: 'Upload', icon: '☁️' },
            { step: 3, label: 'Mint', icon: '🎫' },
            { step: 4, label: 'Complete', icon: '✅' }
          ].map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step >= item.step 
                  ? 'bg-primary-600 border-primary-600 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                <span className="text-sm font-medium">{item.step}</span>
              </div>
              <div className="ml-2">
                <p className={`text-sm font-medium ${
                  step >= item.step ? 'text-primary-600' : 'text-gray-400'
                }`}>
                  {item.label}
                </p>
              </div>
              {index < 3 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  step > item.step ? 'bg-primary-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      {step === 1 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {unlockService.isConfigured() && !isUnlocked && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-1">Unlock membership notice</h4>
              <p className="text-sm text-yellow-800">
                Patient must have an active Unlock membership to receive the certificate.
              </p>
              <div className="mt-3">
                <UnlockCheckoutButton onPurchased={onMembershipPurchased} />
              </div>
            </div>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📋 Issue Medical Certificate</h3>
            <p className="text-sm text-blue-800">
              Fill out the form below to create a secure medical certificate NFT. 
              The document will be encrypted and stored on IPFS.
            </p>
          </div>

          <div>
            <label className="form-label">Patient Name *</label>
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter patient's full name"
              required
            />
          </div>

          <div>
            <label className="form-label">Patient Wallet Address *</label>
            <input
              type="text"
              name="patientAddress"
              value={formData.patientAddress}
              onChange={handleInputChange}
              className="form-input"
              placeholder="0x..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The NFT will be minted to this address
            </p>
          </div>

          <div>
            <label className="form-label">Medical Diagnosis *</label>
            <textarea
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              className="form-input"
              rows={4}
              placeholder="Enter medical diagnosis and recommendations"
              required
            />
          </div>

          <div>
            <label className="form-label">Medical Document (PDF) *</label>
            <input
              type="file"
              name="documentFile"
              onChange={handleInputChange}
              className="form-input"
              accept=".pdf"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload the medical certificate PDF (will be encrypted)
            </p>
          </div>

          <div>
            <label className="form-label">Encryption Password *</label>
            <input
              type="password"
              name="encryptionPassword"
              value={formData.encryptionPassword}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter password to encrypt the document"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This password will be needed to decrypt the document
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </span>
            ) : (
              'Issue Certificate'
            )}
          </button>
        </form>
      )}

      {/* Processing Steps */}
      {step > 1 && (
        <div className="text-center py-12">
          {step === 2 && (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Uploading to IPFS</h3>
              <p className="text-gray-500">Encrypting and uploading your document...</p>
            </div>
          )}
          
          {step === 3 && (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Minting NFT</h3>
              <p className="text-gray-500">Creating the certificate NFT on blockchain...</p>
            </div>
          )}
          
          {step === 4 && (
            <div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Certificate Issued!</h3>
              <p className="text-gray-500 mb-6">
                Your medical certificate has been successfully created and minted as an NFT.
              </p>
              <button
                onClick={() => setStep(1)}
                className="btn-primary"
              >
                Issue Another Certificate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
