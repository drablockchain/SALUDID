'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import blockchainService from '../lib/blockchain'
import NetworkStatus from './NetworkStatus'

export default function Dashboard({ 
  isConnected, 
  account, 
  isAuthorizedDoctor, 
  networkInfo 
}) {
  const [stats, setStats] = useState({
    totalCertificates: '0',
    myCertificates: '0',
    isAuthorized: false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isConnected) {
      loadDashboardData()
    } else {
      setLoading(false)
    }
  }, [isConnected, account])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // If contract is not initialized, skip on-chain reads gracefully
      if (!blockchainService.contract) {
        setStats(s => ({ ...s, totalCertificates: '0', myCertificates: '0' }))
        return
      }

      const totalCertificates = await blockchainService.getTotalCertificates()
      const myCertificates = await blockchainService.contract.balanceOf(account)
      
      setStats({
        totalCertificates,
        myCertificates: myCertificates.toString(),
        isAuthorized: isAuthorizedDoctor
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getNetworkDisplayName = (chainId) => {
    const networks = {
      '314': 'Filecoin Mainnet',
      '314159': 'Filecoin Calibration Testnet'
    }
    return networks[chainId] || `Network ${chainId}`
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔗</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-500 mb-6">
          Connect your MetaMask wallet to access the dashboard and manage medical certificates.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <h4 className="font-medium text-blue-900 mb-2">Supported Networks:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Filecoin Calibration Testnet (Chain ID: 314159)</li>
            <li>• Filecoin Mainnet (Chain ID: 314)</li>
          </ul>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to SaludID4</h2>
        <p className="text-primary-100">
          Secure medical certificate management using blockchain technology
        </p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Connected to {getNetworkDisplayName(networkInfo?.chainId)}</span>
          </div>
          {isAuthorizedDoctor && (
            <div className="flex items-center space-x-2">
              <span>👨‍⚕️</span>
              <span>Authorized Doctor</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Certificates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCertificates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Certificates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.myCertificates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Doctor Status</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.isAuthorized ? 'Authorized' : 'Not Authorized'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isAuthorizedDoctor ? (
            <>
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 text-lg">📝</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Issue Certificate</h4>
                    <p className="text-sm text-gray-500">Create a new medical certificate NFT</p>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">👥</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Manage Doctors</h4>
                    <p className="text-sm text-gray-500">Authorize or revoke doctor access</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-2 text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Doctor Access Required</h4>
              <p className="text-gray-500">
                You need to be an authorized doctor to issue certificates. Contact the contract owner for authorization.
              </p>
            </div>
          )}
          
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">🔍</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Verify Certificate</h4>
                <p className="text-sm text-gray-500">Check the authenticity of a certificate</p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-lg">📚</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">View My Certificates</h4>
                <p className="text-sm text-gray-500">Browse your issued certificates</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Status */}
      <NetworkStatus 
        isConnected={isConnected}
        networkInfo={networkInfo}
      />

      {/* Network Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Network Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Network:</p>
            <p className="font-medium text-gray-900">{getNetworkDisplayName(networkInfo?.chainId)}</p>
          </div>
          <div>
            <p className="text-gray-600">Chain ID:</p>
            <p className="font-medium text-gray-900">{networkInfo?.chainId}</p>
          </div>
          <div>
            <p className="text-gray-600">Account:</p>
            <p className="font-medium text-gray-900 font-mono">{account}</p>
          </div>
          <div>
            <p className="text-gray-600">Status:</p>
            <p className="font-medium text-green-600">Connected</p>
          </div>
        </div>
      </div>
    </div>
  )
}
