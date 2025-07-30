import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { connectWallet, CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/web3Config';
import { getLeaderboardFromEvents, getPlayerStatsFromEvents } from '../lib/leaderboardService';
import { optimizeGasForTransaction, submitWithOptimizedGas } from '../lib/gasOptimizer';

export default function EnhancedCircleMaster() {
  // ... (keep all your existing state variables)
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [result, setResult] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [bestScore, setBestScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partyMode, setPartyMode] = useState(false);
  
  // Enhanced state for new features
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [playerStats, setPlayerStats] = useState(null);
  const [gasInfo, setGasInfo] = useState(null);
  const [isLoadingGas, setIsLoadingGas] = useState(false);

  // Load leaderboard from events (no contract changes needed)
  const loadLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const leaderboard = await getLeaderboardFromEvents();
      setLeaderboardData(leaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // Load player stats from events
  const loadPlayerStats = async (address) => {
    if (!address) return;
    
    try {
      const stats = await getPlayerStatsFromEvents(address);
      setPlayerStats(stats);
    } catch (error) {
      console.error('Error loading player stats:', error);
    }
  };

  // Check gas and submission feasibility
  const checkGasAndFeasibility = async (score) => {
    if (!walletConnected || score < 70) return;
    
    setIsLoadingGas(true);
    try {
      const gasInfo = await optimizeGasForTransaction(score, walletAddress);
      setGasInfo(gasInfo);
    } catch (error) {
      console.error('Gas estimation error:', error);
      setGasInfo({ canSubmit: false, error: error.message });
    } finally {
      setIsLoadingGas(false);
    }
  };

  // Enhanced submit function with gas optimization
  const submitScoreOnchain = async (score) => {
    if (!walletConnected || !gasInfo?.canSubmit) return;
    
    setIsSubmitting(true);
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      // Submit with optimized gas
      const tx = await submitWithOptimizedGas(score, contract);
      await tx.wait();
      
      // Refresh data
      await loadPlayerStats(walletAddress);
      if (showLeaderboard) {
        await loadLeaderboard();
      }
      
      // Success celebration
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00ff00', '#ffd700']
      });
      
      alert(`Score ${score} submitted successfully! 🎉\nSaved ~$${gasInfo.savings} in gas fees!`);
      
    } catch (error) {
      console.error('Error submitting score:', error);
      if (error.code === 4001) {
        alert('Transaction cancelled by user');
      } else {
        alert('Failed to submit score: ' + error.message);
      }
    } finally {
      setIsSubmitting(false);
      setGasInfo(null);
    }
  };

  // ... (keep all your existing functions: evaluateCircle, triggerConfetti, etc.)
  
  // Modified stopDrawing to include gas checking
  const stopDrawing = () => {
    if (!isDrawing || result) return;
    setIsDrawing(false);
    
    const evaluation = evaluateCircle(points);
    setResult(evaluation);
    setAttempts(prev => prev + 1);
    
    if (evaluation.score > bestScore) {
      setBestScore(evaluation.score);
    }
    
    // Trigger effects
    if (evaluation.score >= 80) {
      setTimeout(() => {
        triggerConfetti(evaluation.score);
      }, 500);
    }
    
    // Check gas for submission
    if (walletConnected && evaluation.score >= 70) {
      checkGasAndFeasibility(evaluation.score);
    }
  };

  // Enhanced connect wallet
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const address = await connectWallet();
      setWalletConnected(true);
      setWalletAddress(address);
      
      // Load player stats from events
      await loadPlayerStats(address);
      
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#00ff7f', '#87ceeb']
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // ... (keep all your drawing functions unchanged)

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex flex-col ${partyMode ? 'animate-pulse' : ''}`}>
      {/* ... (keep your existing header) */}
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
        {/* ... (keep your existing canvas section) */}
        
        {/* Enhanced Controls */}
        <div className="flex gap-3 mt-4 px-4 flex-wrap justify-center">
          <button onClick={clearCanvas} className="px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 active:bg-white/40 transition-all duration-200 font-semibold text-sm sm:text-base touch-manipulation">
            {result ? 'Try Again' : 'Clear'}
          </button>
          <button onClick={() => setShowGrid(!showGrid)} className="px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 active:bg-white/40 transition-all duration-200 font-semibold text-sm sm:text-base touch-manipulation">
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
          <button
            onClick={() => {
              setShowLeaderboard(!showLeaderboard);
              if (!showLeaderboard) loadLeaderboard();
            }}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-yellow-500/80 backdrop-blur-sm text-white border border-yellow-400/30 rounded-xl hover:bg-yellow-500/90 active:bg-yellow-600/90 transition-all duration-200 font-semibold text-sm sm:text-base touch-manipulation"
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* Smart Leaderboard Modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">🏆 Live Leaderboard</h2>
                <button onClick={() => setShowLeaderboard(false)} className="text-white hover:text-red-300 text-2xl">×</button>
              </div>
              
              <p className="text-xs text-gray-300 mb-4">📡 Loaded from blockchain events - no extra gas needed!</p>
              
              {isLoadingLeaderboard ? (
                <div className="text-center text-white py-8">
                  <div className="animate-spin text-2xl mb-2">⏳</div>
                  Reading blockchain events...
                </div>
              ) : leaderboardData.length > 0 ? (
                <div className="space-y-2">
                  {leaderboardData.map((player, index) => (
                    <div key={player.address} className={`flex items-center justify-between p-3 rounded-xl ${
                      index === 0 ? 'bg-yellow-500/20 border border-yellow-400/30' :
                      index === 1 ? 'bg-gray-400/20 border border-gray-300/30' :
                      index === 2 ? 'bg-orange-500/20 border border-orange-400/30' :
                      'bg-white/10'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${player.rank}`}
                        </span>
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {player.address === walletAddress ? 'You 🎯' : player.shortAddress}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{player.score}</p>
                        <p className="text-gray-300 text-xs">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-white py-8">
                  <p>No scores yet!</p>
                  <p className="text-sm text-gray-300 mt-2">Be the first to submit a score onchain!</p>
                </div>
              )}
              
              <button onClick={loadLeaderboard} disabled={isLoadingLeaderboard} className="w-full mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-xl transition-colors">
                🔄 Refresh from Blockchain
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Web3 Section with Smart Gas Info */}
        <div className="web3-section mt-4 text-center max-w-lg w-full px-4">
          {!walletConnected ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white text-sm mb-3">Connect wallet to submit scores onchain!</p>
              <button onClick={handleConnectWallet} disabled={isConnecting} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-xl transition-colors font-semibold">
                {isConnecting ? 'Connecting...' : 'Connect Wallet 🔗'}
              </button>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
              <p className="text-white text-sm">
                ✅ Connected: {walletAddress?.slice(0,6)}...{walletAddress?.slice(-4)}
              </p>
              
              {playerStats && (
                <div className="bg-white/10 rounded-lg p-3 text-white text-sm">
                  <p>🏆 Onchain Best: {playerStats.bestScore}</p>
                  <p>🎮 Games Played: {playerStats.totalGames}</p>
                </div>
              )}
              
              {result && result.score >= 70 && (
                <div className="text-center">
                  {isLoadingGas ? (
                    <p className="text-white text-sm">⏳ Checking gas costs...</p>
                  ) : gasInfo ? (
                    gasInfo.canSubmit ? (
                      <div>
                        <p className="text-green-200 text-sm mb-2">
                          🎯 Score improvement: +{gasInfo.improvement} points! 🚀
                        </p>
                        <div className="bg-white/10 rounded-lg p-2 mb-3 text-xs">
                          <p className="text-white">💰 Optimized Gas: {gasInfo.optimizedGasPrice} gwei</p>
                          <p className="text-green-200">💵 Cost: ~{gasInfo.optimizedCostETH.slice(0,6)} ETH</p>
                          <p className="text-blue-200">💸 You save: ~{gasInfo.savings.slice(0,6)} ETH</p>
                        </div>
                        <button 
                          onClick={() => submitScoreOnchain(result.score)}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded-xl transition-colors text-sm"
                        >
                          {isSubmitting ? 'Submitting...' : `Submit Optimized 🏆`}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-yellow-200 text-sm mb-2">⚠️ {gasInfo.error}</p>
                        <p className="text-gray-300 text-xs">Try beating your current best score!</p>
                      </div>
                    )
                  ) : null}
                </div>
              )}
              
              <p className="text-purple-200 text-xs">
                🔗 Connected to Base Network • ⚡ Smart gas optimization
              </p>
            </div>
          )}
        </div>

        {/* ... (keep your existing footer) */}
      </div>
    </div>
  );
}
