#!/bin/bash

# Add leaderboard states
sed -i '/const \[isSubmitting, setIsSubmitting\] = useState(false);/a\  const [showLeaderboard, setShowLeaderboard] = useState(false);\n  const [leaderboardData, setLeaderboardData] = useState([]);\n  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);' components/CircleMaster.js

# Add leaderboard button after the Show/Hide Grid button
sed -i '/Show Grid.*button>/a\          <button\n            onClick={() => {\n              setShowLeaderboard(!showLeaderboard);\n              if (!showLeaderboard) loadLeaderboard();\n            }}\n            className="px-3 sm:px-4 py-2 bg-yellow-500/80 backdrop-blur-sm text-white border border-yellow-400/30 rounded-xl hover:bg-yellow-500/90 active:bg-yellow-600/90 transition-all duration-200 font-semibold text-xs sm:text-sm touch-manipulation"\n          >\n            🏆 Leaderboard\n          </button>' components/CircleMaster.js

echo "✅ Leaderboard button added automatically!"
