// Enhanced Web3 config with reliable RPC endpoint
export const BASE_CHAIN_ID = '0x2105' // Base mainnet
export const BASE_RPC_URL = 'https://base-rpc.publicnode.com' // Reliable alternative

// Your deployed contract details
export const CONTRACT_ADDRESS = "0xd86239227D339f9f7Af6eb862ADBB8C2513d5F0C"
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
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "player", "type": "address"},
      {"indexed": false, "name": "score", "type": "uint256"},
      {"indexed": false, "name": "timestamp", "type": "uint256"}
    ],
    "name": "ScoreSubmitted",
    "type": "event"
  }
]

// Enhanced wallet connection with fallback RPCs
export const connectWallet = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== BASE_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_CHAIN_ID }],
          });
        } catch (switchError) {
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
