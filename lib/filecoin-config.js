/**
 * Filecoin Network Configuration for MetaMask
 */

export const FILECOIN_NETWORKS = {
  hyperspace: {
    chainId: '0xc45', // 3141 in hex
    chainName: 'Filecoin Hyperspace Testnet',
    nativeCurrency: {
      name: 'Test Filecoin',
      symbol: 'tFIL',
      decimals: 18,
    },
    rpcUrls: ['https://api.hyperspace.node.glif.io/rpc/v1'],
    blockExplorerUrls: ['https://hyperspace.filscan.io/'],
    iconUrls: ['https://filecoin.io/images/filecoin-logo.svg'],
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
    iconUrls: ['https://filecoin.io/images/filecoin-logo.svg'],
  },
}

/**
 * Add Filecoin network to MetaMask
 */
export const addFilecoinNetwork = async (network = 'hyperspace') => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected')
  }

  const networkConfig = FILECOIN_NETWORKS[network]
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${network}`)
  }

  try {
    // Try to switch to the network first
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: networkConfig.chainId }],
    })
  } catch (switchError) {
    // If the network doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkConfig],
        })
      } catch (addError) {
        throw new Error(`Failed to add network: ${addError.message}`)
      }
    } else {
      throw new Error(`Failed to switch network: ${switchError.message}`)
    }
  }
}

/**
 * Verify current network
 */
export const verifyFilecoinNetwork = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected')
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    
    const networks = {
      '0x13a': 'Filecoin Mainnet',
      '0xc45': 'Filecoin Hyperspace Testnet',
    }
    
    const networkName = networks[chainId]
    
    if (!networkName) {
      throw new Error(`Unsupported network. Chain ID: ${chainId}`)
    }
    
    return {
      chainId,
      networkName,
      isSupported: true
    }
  } catch (error) {
    throw new Error(`Network verification failed: ${error.message}`)
  }
}

/**
 * Get network display information
 */
export const getNetworkInfo = (chainId) => {
  const networks = {
    '0x13a': {
      name: 'Filecoin Mainnet',
      symbol: 'FIL',
      explorer: 'https://filscan.io/',
      faucet: null
    },
    '0xc45': {
      name: 'Filecoin Hyperspace Testnet',
      symbol: 'tFIL',
      explorer: 'https://hyperspace.filscan.io/',
      faucet: 'https://hyperspace.yoga/#faucet'
    }
  }
  
  return networks[chainId] || {
    name: `Unknown Network (${chainId})`,
    symbol: 'UNKNOWN',
    explorer: null,
    faucet: null
  }
}
