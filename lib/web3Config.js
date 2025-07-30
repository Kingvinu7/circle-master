import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'Circle Master',
      appLogoUrl: 'https://circle-master.vercel.app/logo.png'
    })
  ],
  transports: {
    [base.id]: http()
  }
})

// Your deployed contract details - REPLACE WITH YOUR ACTUAL CONTRACT ADDRESS
export const CONTRACT_ADDRESS = "0xd86239227D339f9f7Af6eb862ADBB8C2513d5F0C" // Replace with your deployed address
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
    "inputs": [{"type": "uint256", "name": "limit"}],
    "name": "getTopPlayers",
    "outputs": [
      {"type": "address[]", "name": "topAddresses"},
      {"type": "uint256[]", "name": "topScores"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
