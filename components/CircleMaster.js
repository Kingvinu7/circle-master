import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { connectWallet, CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/web3Config';

export default function CircleMaster() {
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [partyMode, setPartyMode] = useState(false);

  // Visual Effects Functions
  const triggerConfetti = (score) => {
    if (score >= 100) {
      // PARTY MODE for perfect 100!
      setPartyMode(true);
      
      // Mega party confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
          setPartyMode(false);
          return clearInterval(interval);
        }
        
        // Random confetti bursts
        confetti({
          particleCount: 50,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: Math.random(),
            y: Math.random() - 0.2
          },
          colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
        });
      }, 250);
      
      // Extra big burst
      confetti({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#ff69b4', '#00ff7f', '#ff6347']
      });
      
    } else if (score >= 90) {
      // Double confetti for 90-99
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#ffb347', '#ff69b4']
      });
      
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { x: 0.3, y: 0.7 },
          colors: ['#00ff7f', '#87ceeb', '#dda0dd']
        });
      }, 300);
      
    } else if (score >= 80) {
      // Single confetti for 80-89
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#ff6347', '#ffd700', '#98fb98']
      });
    }
  };

  // Get congratulations message with emojis
  const getCongratulationsMessage = (score) => {
    if (score >= 100) {
      return "🎉 PERFECT CIRCLE! ABSOLUTE LEGEND! 🎉";
    } else if (score >= 90) {
      return "🔥 AMAZING! Near Perfect Circle! 🔥";
    } else if (score >= 80) {
      return "⭐ EXCELLENT! Great Circle Drawing! ⭐";
    }
    return "";
  };

  // Load leaderboard from events
  const loadLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const { ethers } = await import("ethers");
      const provider = new ethers.providers.JsonRpcProvider("https://base-rpc.publicnode.com");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const filter = contract.filters.ScoreSubmitted();
      const events = await contract.queryFilter(filter, 0, "latest");

      const playerScores = {};

      events.forEach(event => {
        const { player, score } = event.args;
        const scoreNum = score.toNumber();
        if (!playerScores[player] || playerScores[player] < scoreNum) {
          playerScores[player] = scoreNum;
        }
      });

      const leaderboard = Object.entries(playerScores)
        .map(([address, score]) => ({
          address,
          score,
          shortAddress: `${address.slice(0,6)}...${address.slice(-4)}`
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((player, index) => ({ ...player, rank: index + 1 }));

      setLeaderboardData(leaderboard);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      setLeaderboardData([]);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // Connect wallet function
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const { address } = await connectWallet();
      setWalletAddress(address);
      setWalletConnected(true);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Submit score to blockchain
  const submitScore = async (score) => {
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    setIsSubmitting(true);
    try {
      const { ethers } = await import("ethers");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.submitScore(score);
      await tx.wait();
      
      alert("Score submitted successfully!");
      loadLeaderboard(); // Refresh leaderboard
    } catch (error) {
      console.error("Error submitting score:", error);
      alert("Failed to submit score. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Canvas resize handler
  const updateCanvasSize = useCallback(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const size = Math.min(container.clientWidth - 40, container.clientHeight - 200, 500);
      setCanvasSize({ width: size, height: size });
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  // Drawing functions
  const startDrawing = (e) => {
    setIsDrawing(true);
    setPoints([]);
    setResult(null);
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPoints([{ x, y }]);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPoints(prev => [...prev, { x, y }]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    analyzeCircle();
  };

  // Circle analysis algorithm
  const analyzeCircle = () => {
    if (points.length < 10) return;

    // Find center using least squares method
    let sumX = 0, sumY = 0;
    points.forEach(point => {
      sumX += point.x;
      sumY += point.y;
    });
    const centerX = sumX / points.length;
    const centerY = sumY / points.length;

    // Calculate average radius
    let sumRadius = 0;
    points.forEach(point => {
      const distance = Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2);
      sumRadius += distance;
    });
    const avgRadius = sumRadius / points.length;

    // Calculate variance from perfect circle
    let variance = 0;
    points.forEach(point => {
      const distance = Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2);
      variance += (distance - avgRadius) ** 2;
    });
    variance /= points.length;

    // Score calculation (0-100)
    const maxVariance = (avgRadius * 0.3) ** 2; // 30% tolerance
    const score = Math.max(0, Math.min(100, 100 - (variance / maxVariance) * 100));
    const roundedScore = Math.round(score);

    setResult({
      score: roundedScore,
      center: { x: centerX, y: centerY },
      radius: avgRadius,
      variance
    });

    setAttempts(prev => prev + 1);
    if (roundedScore > bestScore) {
      setBestScore(roundedScore);
    }

    // Trigger confetti for good scores
    triggerConfetti(roundedScore);
  };

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      const gridSize = 20;
      
      for (let i = 0; i <= canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      
      for (let i = 0; i <= canvas.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
    }

    // Draw user's path
    if (points.length > 1) {
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }

    // Draw perfect circle overlay
    if (result) {
      ctx.strokeStyle = '#28a745';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(result.center.x, result.center.y, result.radius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw center point
      ctx.fillStyle = '#28a745';
      ctx.beginPath();
      ctx.arc(result.center.x, result.center.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [points, result, showGrid, canvasSize]);

  // Load leaderboard on component mount
  useEffect(() => {
    loadLeaderboard();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      {partyMode && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl font-bold text-yellow-400 animate-bounce">
            🎉 PERFECT! 🎉
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Circle Master</h1>
          <p className="text-gray-600">Draw the most perfect circle you can!</p>
        </div>

        {/* Wallet Section */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!walletConnected ? (
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
            >
              {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        {showLeaderboard && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">🏆 Leaderboard</h3>
            {isLoadingLeaderboard ? (
              <div className="text-center py-4">Loading...</div>
            ) : leaderboardData.length > 0 ? (
              <div className="space-y-2">
                {leaderboardData.map((player) => (
                  <div key={player.address} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">#{player.rank}</span>
                      <span className="text-sm text-gray-600">{player.shortAddress}</span>
                    </div>
                    <div className="text-lg font-bold text-blue-600">{player.score}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">No scores yet. Be the first!</div>
            )}
          </div>
        )}

        {/* Game Canvas */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{bestScore}</div>
                <div className="text-sm text-gray-500">Best Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{attempts}</div>
                <div className="text-sm text-gray-500">Attempts</div>
              </div>
            </div>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show Grid</span>
            </label>
          </div>

          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>

          {result && (
            <div className="mt-6 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                Score: {result.score}
              </div>
              {getCongratulationsMessage(result.score) && (
                <div className="text-lg text-green-600 font-semibold mb-4">
                  {getCongratulationsMessage(result.score)}
                </div>
              )}
              
              {walletConnected && result.score >= 80 && (
                <button
                  onClick={() => submitScore(result.score)}
                  disabled={isSubmitting}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit to Leaderboard'}
                </button>
              )}
              
              <div className="mt-4 text-sm text-gray-600">
                <p>Variance: {result.variance.toFixed(2)}</p>
                <p>Radius: {result.radius.toFixed(1)}px</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-3">How to Play</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click and drag to draw a circle</li>
            <li>• Try to make it as perfect as possible</li>
            <li>• Scores of 80+ can be submitted to the leaderboard</li>
            <li>• Connect your wallet to participate in the global leaderboard</li>
            <li>• Perfect circles (100 points) trigger special celebrations!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
