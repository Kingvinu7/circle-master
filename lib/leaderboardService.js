import { CONTRACT_ADDRESS, CONTRACT_ABI } from './web3Config';

// Get leaderboard data from contract events (no redeployment needed)
export const getLeaderboardFromEvents = async () => {
  try {
    const { ethers } = await import('ethers');
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Get all ScoreSubmitted events
    const filter = contract.filters.ScoreSubmitted();
    const events = await contract.queryFilter(filter, 0, 'latest');
    
    // Process events to build leaderboard
    const playerScores = {};
    
    events.forEach(event => {
      const { player, score } = event.args;
      const scoreNum = score.toNumber();
      
      // Keep only the highest score for each player
      if (!playerScores[player] || playerScores[player] < scoreNum) {
        playerScores[player] = scoreNum;
      }
    });
    
    // Convert to array and sort
    const leaderboard = Object.entries(playerScores)
      .map(([address, score]) => ({
        address,
        score,
        shortAddress: `${address.slice(0,6)}...${address.slice(-4)}`
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Top 10
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));
    
    return leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard from events:', error);
    return [];
  }
};

// Get player stats from events
export const getPlayerStatsFromEvents = async (address) => {
  try {
    const { ethers } = await import('ethers');
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Get events for specific player
    const filter = contract.filters.ScoreSubmitted(address);
    const events = await contract.queryFilter(filter, 0, 'latest');
    
    if (events.length === 0) {
      return { bestScore: 0, totalGames: 0, lastPlayed: 0 };
    }
    
    let bestScore = 0;
    let lastPlayed = 0;
    
    events.forEach(event => {
      const score = event.args.score.toNumber();
      if (score > bestScore) bestScore = score;
      
      const blockNumber = event.blockNumber;
      if (blockNumber > lastPlayed) lastPlayed = blockNumber;
    });
    
    return {
      bestScore,
      totalGames: events.length,
      lastPlayed
    };
  } catch (error) {
    console.error('Error fetching player stats from events:', error);
    return { bestScore: 0, totalGames: 0, lastPlayed: 0 };
  }
};
