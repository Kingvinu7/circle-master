import { CONTRACT_ADDRESS, CONTRACT_ABI } from './web3Config';

export const optimizeGasForTransaction = async (score, walletAddress) => {
  try {
    const { ethers } = await import('ethers');
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // Check if player already has a better score
    const currentStats = await contract.getPlayerStats(walletAddress);
    const currentBest = currentStats.bestScore.toNumber();
    
    if (currentBest >= score) {
      throw new Error(`You already have a better score of ${currentBest}! No need to submit ${score}.`);
    }
    
    // Estimate gas with different strategies
    const gasEstimate = await contract.estimateGas.submitScore(score);
    const gasPrice = await provider.getGasPrice();
    
    // Use 90% of current gas price for slower but cheaper transaction
    const optimizedGasPrice = gasPrice.mul(90).div(100);
    
    // Calculate costs
    const estimatedCost = gasPrice.mul(gasEstimate);
    const optimizedCost = optimizedGasPrice.mul(gasEstimate);
    
    return {
      canSubmit: true,
      improvement: score - currentBest,
      gasLimit: gasEstimate,
      standardGasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
      optimizedGasPrice: ethers.utils.formatUnits(optimizedGasPrice, 'gwei'),
      estimatedCostETH: ethers.utils.formatEther(estimatedCost),
      optimizedCostETH: ethers.utils.formatEther(optimizedCost),
      savings: ethers.utils.formatEther(estimatedCost.sub(optimizedCost))
    };
    
  } catch (error) {
    return {
      canSubmit: false,
      error: error.message
    };
  }
};

// Submit with optimized gas settings
export const submitWithOptimizedGas = async (score, contract) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const gasPrice = await provider.getGasPrice();
    const gasEstimate = await contract.estimateGas.submitScore(score);
    
    // Use 85% gas price for slower but cheaper tx
    const optimizedGasPrice = gasPrice.mul(85).div(100);
    
    const tx = await contract.submitScore(score, {
      gasLimit: gasEstimate.mul(110).div(100), // 10% buffer
      gasPrice: optimizedGasPrice
    });
    
    return tx;
  } catch (error) {
    throw error;
  }
};
