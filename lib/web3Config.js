// Enhanced Web3 config with proper signing support
export const BASE_CHAIN_ID = '0x2105' // Base mainnet
export const BASE_RPC_URL = 'https://mainnet.base.org'

// Contract details - replace with your deployed contract
export const CONTRACT_ADDRESS = "0x..." // Your deployed contract address
export const CONTRACT_ABI = [
  {
    "inputs": [{"type": "uint256", "name": "score"}],
    "name": "submitScore", 
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "address", "name": "_player"}],
    "name": "getPlayerStats",
    "outputs": [
      {"type": "uint256", "name": "bestScore"},
      {"type": "uint256", "name": "totalGames"}, 
      {"type": "uint256", "name": "lastPlayed"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

// Enhanced wallet connection with proper error handling
export const connectWallet = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }
      
      // Check current network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      // Switch to Base network if not already
      if (chainId !== BASE_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_CHAIN_ID }],
          });
        } catch (switchError) {
          // Add Base network if not exists
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: BASE_CHAIN_ID,
                chainName: 'Base',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [BASE_RPC_URL],
                blockExplorerUrls: ['https://basescan.org'],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }
      
      return accounts[0];
    } catch (error) {
      console.error('Wallet connection error:', error);
      if (error.code === 4001) {
        throw new Error('Please approve the connection request in your wallet.');
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending. Please check your wallet.');
      } else {
        throw new Error('Failed to connect wallet: ' + error.message);
      }
    }
  } else {
    throw new Error('Please install MetaMask, Coinbase Wallet, or another Web3 wallet');
  }
};
