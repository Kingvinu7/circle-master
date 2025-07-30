// Simple Web3 config using ethers.js (no native dependencies)
export const BASE_CHAIN_ID = '0x2105' // Base mainnet
export const BASE_RPC_URL = 'https://mainnet.base.org'

// Contract details - replace with your deployed contract
export const CONTRACT_ADDRESS = "0xd86239227D339f9f7Af6eb862ADBB8C2513d5F0C" // Your deployed contract address
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

// Simple wallet connection function
export const connectWallet = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      // Switch to Base network
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
        }
      }
      
      return accounts[0];
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  } else {
    throw new Error('Please install MetaMask or Coinbase Wallet');
  }
};
