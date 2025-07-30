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
    
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    console.log("Testing contract connection...");
    
    // Try to get events
    const filter = contract.filters.ScoreSubmitted();
    const events = await contract.queryFilter(filter, 0, 'latest');
    
    console.log(`Found ${events.length} events`);
    
    if (events.length > 0) {
      console.log("Sample event:", events[0]);
      events.forEach((event, index) => {
        console.log(`Event ${index + 1}:`, {
          player: event.args.player,
          score: event.args.score.toString(),
          block: event.blockNumber
        });
      });
    } else {
      console.log("No events found. Possible reasons:");
      console.log("1. No scores have been submitted yet");
      console.log("2. Contract ABI doesn't match deployed contract");
      console.log("3. Wrong contract address");
    }
    
  } catch (error) {
    console.error("Contract test failed:", error.message);
  }
}

testContract();
