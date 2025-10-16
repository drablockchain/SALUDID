'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Header from '../components/Header'
import CertificateForm from '../components/CertificateForm'
import VerificationPanel from '../components/VerificationPanel'
import Dashboard from '../components/Dashboard'
import blockchainService from '../lib/blockchain'
import useUnlock from '../hooks/useUnlock'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState('')
  const [isAuthorizedDoctor, setIsAuthorizedDoctor] = useState(false)
  const [networkInfo, setNetworkInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  const { isUnlocked, refetch: refetchUnlock } = useUnlock(account)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      setLoading(true)
      
      // Check if MetaMask is available
      if (typeof window !== 'undefined' && window.ethereum) {
        // Check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          // Fire-and-forget so UI doesn't block on wallet connection
          connectWallet()
        }
      }
    } catch (error) {
      console.error('Error initializing app:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectWallet = async () => {
    try {
      await blockchainService.requestAccountAccess()
      await blockchainService.initialize()
      await blockchainService.checkNetwork()

      // Set connection state early so UI doesn't fail if contract is missing
      const currentAccount = await blockchainService.getCurrentAccount()
      const network = await blockchainService.getNetworkInfo()
      setAccount(currentAccount)
      setNetworkInfo(network)
      setIsConnected(true)

      // Try to initialize contract and doctor status non-fatally
      try {
        await blockchainService.initializeContract()
        const isAuthorized = await blockchainService.isAuthorizedDoctor()
        setIsAuthorizedDoctor(isAuthorized)
      } catch (e) {
        console.warn('Contract unavailable or RPC down:', e?.message)
        setIsAuthorizedDoctor(false)
      }
      
      toast.success('Wallet connected successfully!')
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error(`Failed to connect wallet: ${error.message}`)
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setAccount('')
    setIsAuthorizedDoctor(false)
    setNetworkInfo(null)
    toast.success('Wallet disconnected')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SaludID4...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header 
        isConnected={isConnected}
        account={account}
        networkInfo={networkInfo}
        isAuthorizedDoctor={isAuthorizedDoctor}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'issue', label: 'Issue Certificate', icon: '📋' },
              { id: 'verify', label: 'Verify Certificate', icon: '🔍' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'dashboard' && (
            <Dashboard 
              isConnected={isConnected}
              account={account}
              isAuthorizedDoctor={isAuthorizedDoctor}
              networkInfo={networkInfo}
            />
          )}
          
          {activeTab === 'issue' && (
            <CertificateForm 
              isConnected={isConnected}
              isAuthorizedDoctor={isAuthorizedDoctor}
              account={account}
              isUnlocked={isUnlocked}
              onMembershipPurchased={refetchUnlock}
            />
          )}
          
          {activeTab === 'verify' && (
            <VerificationPanel 
              isConnected={isConnected}
            />
          )}
        </div>
      </main>
    </div>
  )
}
