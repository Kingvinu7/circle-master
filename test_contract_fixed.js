const { ethers } = require('ethers');

async function testContract() {
  try {
    const CONTRACT_ADDRESS = "0xd86239227D339f9f7Af6eb862ADBB8C2513d5F0C";
    const CONTRACT_ABI = [
      {
        "inputs": [{"type": "uint256", "name": "score"}],
        "name": "submitScore",
        "outputs": [],
        "stateMutability": "nonpayable",
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
    ];
    
    // Try multiple RPC endpoints
    const rpcEndpoints = [
      'https://base-rpc.publicnode.com',
      'https://base.blockscout.com/api/eth-rpc',
      'https://base.llamarpc.com',
      'https://base-mainnet.public.blastapi.io'
    ];
    
    for (const rpcUrl of rpcEndpoints) {
      try {
        console.log(`Testing RPC: ${rpcUrl}`);
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        
        // Test connection
        const blockNumber = await provider.getBlockNumber();
        console.log(`✅ Connected! Current block: ${blockNumber}`);
        
        // Get events
        const filter = contract.filters.ScoreSubmitted();
        const events = await contract.queryFilter(filter, blockNumber - 1000, 'latest');
        
        console.log(`Found ${events.length} score events`);
        
        if (events.length > 0) {
          console.log("Sample events:");
          events.slice(0, 3).forEach((event, index) => {
            console.log(`Event ${index + 1}:`, {
              player: event.args.player,
              score: event.args.score.toString(),
              block: event.blockNumber
            });
          });
        }
        
        console.log(`🎯 RPC ${rpcUrl} is working!`);
        return; // Success, exit
        
      } catch (error) {
        console.log(`❌ RPC ${rpcUrl} failed: ${error.message.slice(0, 100)}`);
        continue; // Try next RPC
      }
    }
    
    console.log("❌ All RPC endpoints failed");
    
  } catch (error) {
    console.error("Contract test failed:", error.message);
  }
}

testContract();
