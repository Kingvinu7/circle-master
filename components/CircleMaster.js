import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/web3Config'

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
  
  // Web3 hooks
  const { address, isConnected } = useAccount()
  const { writeContract, isPending } = useWriteContract()

  // Read player stats from contract
  const { data: playerStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPlayerStats',
    args: [address],
    enabled: !!address && CONTRACT_ADDRESS !== "0x..."
  })

  // Submit score onchain
  const submitScoreOnchain = async (score) => {
    if (!isConnected || score < 70 || CONTRACT_ADDRESS === "0x...") return
    
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'submitScore',
        args: [score]
      })
    } catch (error) {
      console.error('Error submitting score:', error)
    }
  }
  
  // Function to evaluate circle quality (balanced difficulty)
  const evaluateCircle = (points) => {
    if (points.length < 10) {
      return { score: 0, message: "Draw a complete circle!" };
    }

    // Calculate center using average of all points
    const center = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });
    
    center.x /= points.length;
    center.y /= points.length;

    // Calculate average radius and variance
    let avgRadius = 0;
    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(point.x - center.x, 2) + 
        Math.pow(point.y - center.y, 2)
      );
      avgRadius += distance;
    }
    avgRadius /= points.length;

    let radiusVariance = 0;
    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(point.x - center.x, 2) + 
        Math.pow(point.y - center.y, 2)
      );
      radiusVariance += Math.pow(distance - avgRadius, 2);
    }
    radiusVariance = Math.sqrt(radiusVariance / points.length);

    // Check if circle is closed
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const closureDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );
    const maxClosureDistance = avgRadius * 0.25;
    const isClosed = closureDistance < maxClosureDistance;

    // Calculate score
    const maxVariance = avgRadius * 0.6;
    const varianceScore = Math.max(0, 1 - (radiusVariance / maxVariance));
    const closureScore = isClosed ? 1 : 0.6;
    
    let totalScore = Math.round((varianceScore * 0.6 + closureScore * 0.4) * 100);
    totalScore = Math.max(0, Math.min(100, totalScore));
    
    if (totalScore > 40) totalScore += 5;
    totalScore = Math.min(100, totalScore);

    // Get appropriate message
    let message;
    if (totalScore >= 90) {
      message = "Incredible! Master of circles! 🎯✨";
    } else if (totalScore >= 80) {
      message = "Awesome! You're getting really good! 🔥";
    } else if (totalScore >= 70) {
      message = "Great work! Keep it up! 👏";
    } else if (totalScore >= 60) {
      message = "Nice job! You're improving! 💪";
    } else if (totalScore >= 50) {
      message = "Good effort! Practice makes perfect! 🎨";
    } else if (totalScore >= 30) {
      message = "Not bad! Try drawing a bit slower? 🖊️";
    } else {
      message = "Keep trying! Every artist starts somewhere! 🌟";
    }

    return { score: totalScore, message, isClosed };
  };

  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    const padding = 32;
    const maxWidth = Math.min(containerRect.width - padding, 500);
    const maxHeight = Math.min(window.innerHeight * 0.6, 400);
    
    const size = Math.min(maxWidth, maxHeight);
    
    setCanvasSize({ width: size, height: size });
  }, []);

  useEffect(() => {
    updateCanvasSize();
    
    const handleResize = () => {
      updateCanvasSize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasSize]);

  useEffect(() => {
    if (canvasRef.current && canvasSize.width > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const scale = window.devicePixelRatio || 1;
      canvas.width = canvasSize.width * scale;
      canvas.height = canvasSize.height * scale;
      canvas.style.width = canvasSize.width + 'px';
      canvas.style.height = canvasSize.height + 'px';
      ctx.scale(scale, scale);
      
      drawCanvas();
    }
  }, [canvasSize]);

  useEffect(() => {
    drawCanvas();
  }, [points, showGrid, result, canvasSize]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvasSize;
    
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      const gridSize = 25;
      
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
    
    // Draw the circle with glow effect
    if (points.length > 1) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Draw result overlay if exists
    if (result) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      
      const isMobile = width < 400;
      const scoreFontSize = isMobile ? 48 : 56;
      const messageFontSize = isMobile ? 16 : 20;
      const statsFontSize = isMobile ? 12 : 14;
      
      ctx.font = `bold ${scoreFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const scoreText = `${result.score}/100`;
      ctx.fillText(scoreText, width / 2, height / 2 - 30);
      
      ctx.shadowBlur = 8;
      ctx.font = `${messageFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(result.message, width / 2, height / 2 + 15);
      
      ctx.shadowBlur = 4;
      ctx.font = `${statsFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = '#cccccc';
      ctx.fillText(`Best: ${bestScore} • Attempts: ${attempts}`, width / 2, height / 2 + 45);
      
      ctx.shadowBlur = 0;
    }
  };

  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (pos) => {
    if (!pos) return;
    setIsDrawing(true);
    setPoints([pos]);
    setResult(null);
  };

  const draw = (pos) => {
    if (!pos || !isDrawing || result) return;
    setPoints(prev => [...prev, pos]);
  };

  const stopDrawing = () => {
    if (!isDrawing || result) return;
    setIsDrawing(false);
    
    const evaluation = evaluateCircle(points);
    setResult(evaluation);
    setAttempts(prev => prev + 1);
    
    if (evaluation.score > bestScore) {
      setBestScore(evaluation.score);
    }
    
    // Auto-submit good scores onchain if connected
    if (isConnected && evaluation.score >= 70) {
      submitScoreOnchain(evaluation.score);
    }
  };

  const handleStart = (e) => {
    e.preventDefault();
    startDrawing(getEventPos(e));
  };

  const handleMove = (e) => {
    e.preventDefault();
    draw(getEventPos(e));
  };

  const handleEnd = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  const clearCanvas = () => {
    setPoints([]);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 text-center py-4 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Circle Master</h1>
        <p className="text-purple-100 text-xs sm:text-sm">A Farcaster Miniapp</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
        {/* Canvas Container */}
        <div 
          ref={containerRef}
          className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-2xl w-full max-w-lg"
        >
          {canvasSize.width > 0 && (
            <canvas
              ref={canvasRef}
              className="rounded-xl cursor-crosshair shadow-lg touch-none select-none w-full"
              style={{ 
                width: canvasSize.width + 'px', 
                height: canvasSize.height + 'px'
              }}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            />
          )}
          
          {/* Instructions overlay */}
          {points.length === 0 && !result && canvasSize.width > 0 && (
            <div 
              className="absolute inset-4 flex items-center justify-center pointer-events-none rounded-xl"
              style={{ 
                width: canvasSize.width + 'px', 
                height: canvasSize.height + 'px'
              }}
            >
              <div className="text-center text-white">
                <h2 className="text-lg sm:text-xl font-bold mb-2">Draw Your Circle</h2>
                <p className="text-purple-100 text-sm sm:text-base">Tap and drag to create</p>
                <p className="text-purple-200 text-xs sm:text-sm mt-2">
                  Best: {bestScore} • Attempts: {attempts}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Game Controls */}
        <div className="flex gap-3 mt-4 px-4">
          <button
            onClick={clearCanvas}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 active:bg-white/40 transition-all duration-200 font-semibold text-sm sm:text-base touch-manipulation"
          >
            {result ? 'Try Again' : 'Clear'}
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 active:bg-white/40 transition-all duration-200 font-semibold text-sm sm:text-base touch-manipulation"
          >
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
        </div>

        {/* Web3 Section */}
        <div className="web3-section mt-4 text-center max-w-lg w-full px-4">
          {!isConnected ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white text-sm mb-3">Connect wallet to submit scores onchain!</p>
              <ConnectButton />
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
              <p className="text-white text-sm">
                Connected: {address?.slice(0,6)}...{address?.slice(-4)}
              </p>
              
              {playerStats && playerStats[0] > 0 && (
                <div className="bg-white/10 rounded-lg p-3 text-white text-sm">
                  <p>🏆 Onchain Best: {playerStats[0]?.toString()}</p>
                  <p>🎮 Games Played: {playerStats[1]?.toString()}</p>
                </div>
              )}
              
              {result && result.score >= 70 && (
                <button
                  onClick={() => submitScoreOnchain(result.score)}
                  disabled={isPending || CONTRACT_ADDRESS === "0x..."}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-xl transition-colors text-sm"
                >
                  {isPending ? 'Submitting...' : 
                   CONTRACT_ADDRESS === "0x..." ? 'Deploy Contract First' :
                   'Submit to Leaderboard 🚀'}
                </button>
              )}
              
              {CONTRACT_ADDRESS === "0x..." && (
                <p className="text-yellow-200 text-xs">
                  Deploy your smart contract and update the CONTRACT_ADDRESS in web3Config.js
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4 px-4">
          <p className="text-purple-200 text-xs">
            Made for Farcaster • Share your best score!
          </p>
        </div>
      </div>
    </div>
  );
}
