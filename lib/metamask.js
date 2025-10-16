/**
 * MetaMask Integration for Filecoin Networks
 */

// Filecoin Network Configurations
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

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
}

/**
 * Request account access
 */
export const requestAccountAccess = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })
    return accounts[0]
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('User rejected the connection request.')
    }
    throw new Error(`Failed to connect to MetaMask: ${error.message}`)
  }
}

/**
 * Get current account
 */
export const getCurrentAccount = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed')
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    })
    return accounts[0] || null
  } catch (error) {
    throw new Error(`Failed to get current account: ${error.message}`)
  }
}

/**
 * Get current network
 */
export const getCurrentNetwork = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed')
  }

  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    })
    return chainId
  } catch (error) {
    throw new Error(`Failed to get current network: ${error.message}`)
  }
}

/**
 * Switch to Filecoin network
 */
export const switchToFilecoinNetwork = async (network = 'hyperspace') => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed')
  }

  const networkConfig = FILECOIN_NETWORKS[network]
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${network}`)
  }

  try {
    // Try to switch to the network
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
 * Listen for account changes
 */
export const onAccountsChanged = (callback) => {
  if (!isMetaMaskInstalled()) {
    return
  }

  window.ethereum.on('accountsChanged', callback)
}

/**
 * Listen for network changes
 */
export const onChainChanged = (callback) => {
  if (!isMetaMaskInstalled()) {
    return
  }

  window.ethereum.on('chainChanged', callback)
}

/**
 * Remove event listeners
 */
export const removeListeners = () => {
  if (!isMetaMaskInstalled()) {
    return
  }

  window.ethereum.removeAllListeners('accountsChanged')
  window.ethereum.removeAllListeners('chainChanged')
}

/**
 * Get network display name
 */
export const getNetworkDisplayName = (chainId) => {
  const networks = {
    '0x13a': 'Filecoin Mainnet',
    '0xc45': 'Filecoin Hyperspace Testnet',
    '0x539': 'Hardhat Local',
  }
  return networks[chainId] || `Unknown Network (${chainId})`
}

/**
 * Check if current network is supported
 */
export const isSupportedNetwork = (chainId) => {
  const supportedNetworks = ['0x13a', '0xc45', '0x539'] // Filecoin mainnet, hyperspace, hardhat
  return supportedNetworks.includes(chainId)
}

/**
 * Get explorer URL for address
 */
export const getExplorerUrl = (address, chainId) => {
  const explorers = {
    '0x13a': `https://filscan.io/address/${address}`,
    '0xc45': `https://hyperspace.filscan.io/address/${address}`,
  }
  return explorers[chainId] || '#'
}

/**
 * Get explorer URL for transaction
 */
export const getTransactionExplorerUrl = (txHash, chainId) => {
  const explorers = {
    '0x13a': `https://filscan.io/tx/${txHash}`,
    '0xc45': `https://hyperspace.filscan.io/tx/${txHash}`,
  }
  return explorers[chainId] || '#'
}

/**
 * Format address for display
 */
export const formatAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Validate Ethereum address
 */
export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}
