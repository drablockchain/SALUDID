'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function Header({ 
  isConnected, 
  account, 
  networkInfo, 
  isAuthorizedDoctor, 
  onConnect, 
  onDisconnect 
}) {
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const getNetworkDisplayName = (chainId) => {
    const networks = {
      '314': 'Filecoin Mainnet',
      '314159': 'Filecoin Calibration Testnet'
    }
    return networks[chainId] || `Network ${chainId}`
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SaludID4</h1>
              <p className="text-sm text-gray-500">Medical Certificate NFT System</p>
            </div>
          </div>

          {/* Connection Status and Account */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                {/* Network Status */}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    {networkInfo ? getNetworkDisplayName(networkInfo.chainId) : 'Connected'}
                  </span>
                </div>

                {/* Doctor Status */}
                {isAuthorizedDoctor && (
                  <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    <span>👨‍⚕️</span>
                    <span>Authorized Doctor</span>
                  </div>
                )}

                {/* Account Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                  >
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {account ? account.slice(2, 4).toUpperCase() : '?'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {formatAddress(account)}
                    </span>
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showAccountMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                      <div className="p-4 border-b">
                        <p className="text-sm font-medium text-gray-900">Account Details</p>
                        <p className="text-xs text-gray-500 mt-1">{account}</p>
                      </div>
                      
                      <div className="p-2">
                        <button
                          onClick={() => copyToClipboard(account)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2"
                        >
                          <span>📋</span>
                          <span>Copy Address</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            const explorerUrl = networkInfo?.chainId === '314159' 
                              ? `https://calibration.filscan.io/address/${account}`
                              : networkInfo?.chainId === '314'
                              ? `https://filscan.io/address/${account}`
                              : '#'
                            window.open(explorerUrl, '_blank')
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2"
                        >
                          <span>🔍</span>
                          <span>View on Explorer</span>
                        </button>
                        
                        <hr className="my-2" />
                        
                        <button
                          onClick={() => {
                            onDisconnect()
                            setShowAccountMenu(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center space-x-2"
                        >
                          <span>🚪</span>
                          <span>Disconnect</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>🔗</span>
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
