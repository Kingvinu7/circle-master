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

  // Enhanced wallet connection
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
