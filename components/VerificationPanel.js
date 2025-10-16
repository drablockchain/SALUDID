'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import blockchainService from '../lib/blockchain'

export default function VerificationPanel({ isConnected }) {
  const [searchInput, setSearchInput] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchType, setSearchType] = useState('tokenId') // 'tokenId' or 'documentHash'

  const handleVerify = async (e) => {
    e.preventDefault()
    
    if (!searchInput.trim()) {
      toast.error('Please enter a token ID or document hash')
      return
    }

    setLoading(true)
    setVerificationResult(null)

    try {
      if (searchType === 'tokenId') {
        // Verify by token ID
        const tokenId = searchInput.trim()
        const result = await blockchainService.verifyCertificate(tokenId)
        const certificateData = await blockchainService.getCertificateData(tokenId)
        
        setVerificationResult({
          type: 'tokenId',
          tokenId,
          ...result,
          certificateData
        })
      } else {
        // Verify by document hash (this would require additional contract function)
        toast.error('Document hash verification not implemented yet')
        return
      }
    } catch (error) {
      console.error('Error verifying certificate:', error)
      toast.error(`Verification failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const getStatusBadge = (isValid) => {
    return isValid ? (
      <span className="status-valid">✅ Valid</span>
    ) : (
      <span className="status-invalid">❌ Invalid</span>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🔍 Certificate Verification</h2>
        <p className="text-gray-600">
          Verify the authenticity and validity of medical certificates by entering a token ID or document hash.
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="form-label">Search Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="tokenId"
                  checked={searchType === 'tokenId'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="mr-2"
                />
                Token ID
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="documentHash"
                  checked={searchType === 'documentHash'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="mr-2"
                />
                Document Hash
              </label>
            </div>
          </div>

          <div>
            <label className="form-label">
              {searchType === 'tokenId' ? 'Certificate Token ID' : 'Document Hash'}
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="form-input"
              placeholder={
                searchType === 'tokenId' 
                  ? 'Enter certificate token ID (e.g., 1, 2, 3...)' 
                  : 'Enter document hash'
              }
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </span>
            ) : (
              'Verify Certificate'
            )}
          </button>
        </form>
      </div>

      {/* Verification Result */}
      {verificationResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Verification Result</h3>
            {getStatusBadge(verificationResult.isValid)}
          </div>

          {verificationResult.isValid ? (
            <div className="space-y-6">
              {/* Certificate Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Certificate Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Token ID</p>
                      <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {verificationResult.tokenId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Issue Date</p>
                      <p className="text-sm">{formatDate(verificationResult.issueDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Doctor Address</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded flex-1">
                          {verificationResult.doctorAddress}
                        </p>
                        <button
                          onClick={() => copyToClipboard(verificationResult.doctorAddress)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Document Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">IPFS CID</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded flex-1">
                          {verificationResult.ipfsCid}
                        </p>
                        <button
                          onClick={() => copyToClipboard(verificationResult.ipfsCid)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Document Hash</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded flex-1">
                          {verificationResult.documentHash}
                        </p>
                        <button
                          onClick={() => copyToClipboard(verificationResult.documentHash)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Document Status</p>
                      <p className="text-sm">
                        {verificationResult.certificateData?.isActive ? 'Active' : 'Revoked'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              {verificationResult.certificateData && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Medical Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Patient Name Hash</p>
                        <p className="font-mono text-sm">
                          {verificationResult.certificateData.patientNameHash}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Diagnosis</p>
                        <p className="text-sm">{verificationResult.certificateData.diagnosis}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => window.open(`https://ipfs.io/ipfs/${verificationResult.ipfsCid}`, '_blank')}
                  className="btn-secondary"
                >
                  📄 View Document on IPFS
                </button>
                <button
                  onClick={() => {
                    const explorerUrl = process.env.NEXT_PUBLIC_NETWORK_ID === '314159' 
                      ? `https://calibration.filscan.io/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}/${verificationResult.tokenId}`
                      : process.env.NEXT_PUBLIC_NETWORK_ID === '314'
                      ? `https://filscan.io/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}/${verificationResult.tokenId}`
                      : '#'
                    window.open(explorerUrl, '_blank')
                  }}
                  className="btn-secondary"
                >
                  🔍 View on Block Explorer
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">❌</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Certificate Not Valid</h4>
              <p className="text-gray-500">
                This certificate could not be verified. It may have been revoked, 
                the token ID may be incorrect, or the certificate may not exist.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3">💡 How to Verify Certificates</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Token ID:</strong> Each certificate has a unique token ID. You can find this in the NFT metadata or from the issuing doctor.</p>
          <p><strong>Document Hash:</strong> A unique fingerprint of the original document that ensures authenticity.</p>
          <p><strong>Verification Process:</strong> The system checks the blockchain for the certificate's existence and validates the doctor's authorization.</p>
        </div>
      </div>
    </div>
  )
}
