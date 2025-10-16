'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function NetworkStatus({ isConnected, networkInfo }) {
  const [networkStatus, setNetworkStatus] = useState({
    isCorrect: false,
    networkName: '',
    chainId: '',
    needsSwitch: false
  })

  useEffect(() => {
    if (isConnected && networkInfo) {
      checkNetworkStatus()
    }
  }, [isConnected, networkInfo])

  const checkNetworkStatus = () => {
    const expectedChainId = process.env.NEXT_PUBLIC_NETWORK_ID || '314159'
    const currentChainId = networkInfo?.chainId?.toString()
    
    const isCorrect = currentChainId === expectedChainId
    const networkName = getNetworkDisplayName(currentChainId)
    
    setNetworkStatus({
      isCorrect,
      networkName,
      chainId: currentChainId,
      needsSwitch: !isCorrect
    })
  }

  const getNetworkDisplayName = (chainId) => {
    const networks = {
      '314': 'Filecoin Mainnet',
      '314159': 'Filecoin Calibration Testnet'
    }
    return networks[chainId] || `Unknown Network (${chainId})`
  }

  const switchToFilecoinNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('MetaMask no detectado')
      return
    }

    const targetNetwork = process.env.NEXT_PUBLIC_NETWORK_ID === '314' ? 'mainnet' : 'calibration'
    
    const networkConfigs = {
      calibration: {
        chainId: '0x4cb2f', // 314159 in hex
        chainName: 'Filecoin Calibration Testnet',
        nativeCurrency: {
          name: 'Test Filecoin',
          symbol: 'tFIL',
          decimals: 18,
        },
        rpcUrls: ['https://rpc.ankr.com/filecoin_testnet'],
        blockExplorerUrls: ['https://calibration.filscan.io/'],
      },
      mainnet: {
        chainId: '0x13a', // 314 in hex
        chainName: 'Filecoin Mainnet',
        nativeCurrency: {
          name: 'Filecoin',
          symbol: 'FIL',
          decimals: 18,
        },
        rpcUrls: ['https://api.node.glif.io/rpc/v1'],
        blockExplorerUrls: ['https://filscan.io/'],
      },
    }

    const networkConfig = networkConfigs[targetNetwork]

    try {
      // Try to switch to the network first
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      })
      toast.success(`Conectado a ${networkConfig.chainName}`)
    } catch (switchError) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          })
          toast.success(`Red ${networkConfig.chainName} agregada y conectada`)
        } catch (addError) {
          toast.error(`Error al agregar la red: ${addError.message}`)
        }
      } else {
        toast.error(`Error al cambiar de red: ${switchError.message}`)
      }
    }
  }

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-400 rounded-full mr-3"></div>
          <div>
            <h4 className="font-medium text-yellow-800">MetaMask no conectado</h4>
            <p className="text-sm text-yellow-700">Conecta tu wallet para verificar la red</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`border rounded-lg p-4 ${
      networkStatus.isCorrect 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded-full mr-3 ${
            networkStatus.isCorrect ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          <div>
            <h4 className={`font-medium ${
              networkStatus.isCorrect ? 'text-green-800' : 'text-red-800'
            }`}>
              {networkStatus.isCorrect ? 'Red Correcta' : 'Red Incorrecta'}
            </h4>
            <p className={`text-sm ${
              networkStatus.isCorrect ? 'text-green-700' : 'text-red-700'
            }`}>
              {networkStatus.networkName} (Chain ID: {networkStatus.chainId})
            </p>
          </div>
        </div>
        
        {networkStatus.needsSwitch && (
          <button
            onClick={switchToFilecoinNetwork}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Cambiar Red
          </button>
        )}
      </div>
      
      {!networkStatus.isCorrect && (
        <div className="mt-3 text-sm text-red-700">
          <p><strong>Red requerida:</strong> Filecoin Calibration Testnet (Chain ID: 314159)</p>
          <p><strong>Para obtener tFIL:</strong> <a 
            href="https://faucet.calibration.fildev.network/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Faucet de Calibration
          </a></p>
        </div>
      )}
    </div>
  )
}
