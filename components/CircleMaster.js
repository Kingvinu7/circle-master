import React, { useState, useRef, useEffect, useCallback } from 'react';

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
  const [confetti, setConfetti] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const animationRef = useRef(null);
  
  // Function to evaluate circle quality (balanced difficulty)
  const evaluateCircle = (points) => {
    if (points.length < 10) { // Increased from 8
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

    // Check if circle is closed (stricter)
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const closureDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );
    const maxClosureDistance = avgRadius * 0.25; // Reduced from 0.3
    const isClosed = closureDistance < maxClosureDistance;

    // Calculate score (more strict)
    const maxVariance = avgRadius * 0.6; // Reduced from 0.7
    const varianceScore = Math.max(0, 1 - (radiusVariance / maxVariance));
    const closureScore = isClosed ? 1 : 0.6; // Reduced from 0.7
    
    let totalScore = Math.round((varianceScore * 0.6 + closureScore * 0.4) * 100);
    totalScore = Math.max(0, Math.min(100, totalScore));
    
    // Reduced bonus points for effort
    if (totalScore > 40) totalScore += 5; // Reduced from 10, increased threshold from 30
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

  // Confetti animation system
  const createConfetti = (intensity = 'normal') => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];
    const confettiCount = intensity === 'party' ? 150 : intensity === 'double' ? 100 : 50;
    
    const newConfetti = [];
    for (let i = 0; i < confettiCount; i++) {
      newConfetti.push({
        id: Math.random(),
        x: Math.random() * window.innerWidth,
        y: -10,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        gravity: 0.2,
        life: 1.0,
        decay: Math.random() * 0.02 + 0.005
      });
    }
    
    setConfetti(newConfetti);
    setShowCelebration(true);
    
    // Clear after animation
    setTimeout(() => {
      setShowCelebration(false);
      setConfetti([]);
    }, intensity === 'party' ? 5000 : 3000);
  };

  const updateConfetti = () => {
    setConfetti(prev => prev.map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vy: particle.vy + particle.gravity,
      rotation: particle.rotation + particle.rotationSpeed,
      life: Math.max(0, particle.life - particle.decay)
    })).filter(particle => particle.life > 0 && particle.y < window.innerHeight + 100));
  };

  const animateConfetti = () => {
    if (showCelebration) {
      updateConfetti();
      animationRef.current = requestAnimationFrame(animateConfetti);
    }
  };

  useEffect(() => {
    if (showCelebration) {
      animationRef.current = requestAnimationFrame(animateConfetti);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showCelebration]);

  // Share functionality
  const shareScore = async (score) => {
    const shareText = score === 100 
      ? `🎯 PERFECT CIRCLE! I scored 100/100 on Circle Master! Can you beat perfection? 🔥`
      : score >= 95 
      ? `🎨 INCREDIBLE! I scored ${score}/100 on Circle Master! Almost perfect! ✨`
      : `🎯 AMAZING! I scored ${score}/100 on Circle Master! Try to beat my score! 🔥`;
    
    const shareUrl = 'https://circle-master.vercel.app';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Circle Master - Farcaster Miniapp',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      const fullText = `${shareText}\n\n${shareUrl}`;
      try {
        await navigator.clipboard.writeText(fullText);
        alert('Score copied to clipboard! Share it anywhere! 🎉');
      } catch (err) {
        // Ultimate fallback
        const textArea = document.createElement('textarea');
        textArea.value = fullText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Score copied to clipboard! Share it anywhere! 🎉');
      }
    }
  };

  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Calculate optimal canvas size based on container
    const padding = 32; // 16px padding on each side
    const maxWidth = Math.min(containerRect.width - padding, 500);
    const maxHeight = Math.min(window.innerHeight * 0.6, 400);
    
    // Make it square for better circle drawing
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
      
      // Set canvas size with device pixel ratio for crisp rendering
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
    
    // Draw subtle grid if enabled
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
      // Glow effect
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
      
      // Reset shadow
      ctx.shadowBlur = 0;
    }
    
    // Draw result overlay if exists
    if (result) {
      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, width, height);
      
      // Special effects for high scores
      if (result.score === 100) {
        // Rainbow border effect for perfect score
        const rainbowGradient = ctx.createLinearGradient(0, 0, width, height);
        rainbowGradient.addColorStop(0, '#ff0000');
        rainbowGradient.addColorStop(0.16, '#ff8000');
        rainbowGradient.addColorStop(0.33, '#ffff00');
        rainbowGradient.addColorStop(0.5, '#00ff00');
        rainbowGradient.addColorStop(0.66, '#0080ff');
        rainbowGradient.addColorStop(0.83, '#8000ff');
        rainbowGradient.addColorStop(1, '#ff0080');
        
        ctx.strokeStyle = rainbowGradient;
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, width - 8, height - 8);
      } else if (result.score >= 95) {
        // Golden border for near-perfect
        const goldGradient = ctx.createLinearGradient(0, 0, width, 0);
        goldGradient.addColorStop(0, '#ffd700');
        goldGradient.addColorStop(0.5, '#ffed4e');
        goldGradient.addColorStop(1, '#ffd700');
        
        ctx.strokeStyle = goldGradient;
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, width - 6, height - 6);
      } else if (result.score >= 90) {
        // Silver border for excellent
        const silverGradient = ctx.createLinearGradient(0, 0, width, 0);
        silverGradient.addColorStop(0, '#c0c0c0');
        silverGradient.addColorStop(0.5, '#e8e8e8');
        silverGradient.addColorStop(1, '#c0c0c0');
        
        ctx.strokeStyle = silverGradient;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, width - 4, height - 4);
      }
      
      // Score display with enhanced glow for high scores
      const glowIntensity = result.score >= 90 ? 25 : 15;
      ctx.shadowColor = result.score === 100 ? '#ffd700' : result.score >= 95 ? '#ffed4e' : '#ffffff';
      ctx.shadowBlur = glowIntensity;
      ctx.fillStyle = result.score === 100 ? '#ffd700' : '#ffffff';
      
      // Responsive font sizes
      const isMobile = width < 400;
      const scoreFontSize = isMobile ? 48 : 56;
      const messageFontSize = isMobile ? 16 : 20;
      const statsFontSize = isMobile ? 12 : 14;
      
      ctx.font = `bold ${scoreFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const scoreText = `${result.score}/100`;
      ctx.fillText(scoreText, width / 2, height / 2 - 30);
      
      // Message
      ctx.shadowBlur = glowIntensity / 2;
      ctx.font = `${messageFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = result.score >= 90 ? '#ffed4e' : '#ffffff';
      ctx.fillText(result.message, width / 2, height / 2 + 15);
      
      // Stats
      ctx.shadowBlur = 4;
      ctx.font = `${statsFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = '#cccccc';
      ctx.fillText(`Best: ${bestScore} • Attempts: ${attempts}`, width / 2, height / 2 + 45);
      
      // Reset shadow
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

    // Trigger confetti based on score
    if (evaluation.score === 100) {
      createConfetti('party');
    } else if (evaluation.score >= 95) {
      createConfetti('double');
    } else if (evaluation.score >= 90) {
      createConfetti('normal');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex flex-col relative overflow-hidden">
      {/* Confetti Layer */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {confetti.map(particle => (
            <div
              key={particle.id}
              className="absolute"
              style={{
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                transform: `rotate(${particle.rotation}deg)`,
                opacity: particle.life,
                borderRadius: '2px'
              }}
            />
          ))}
        </div>
      )}

      {/* Fixed Header */}
      <div className="flex-shrink-0 text-center py-4 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Circle Master</h1>
        <p className="text-purple-100 text-xs sm:text-sm">A Farcaster Miniapp</p>
      </div>

      {/* Main Content Area */}
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
        
        {/* Controls */}
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
          
          {/* Share Button for High Scores */}
          {result && result.score >= 90 && (
            <button
              onClick={() => shareScore(result.score)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border border-yellow-300 rounded-xl hover:from-yellow-500 hover:to-orange-600 active:scale-95 transition-all duration-200 font-bold text-sm sm:text-base touch-manipulation shadow-lg"
            >
              🎉 Share
            </button>
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
