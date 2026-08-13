// AI-based creator analysis utility
// This simulates AI analysis since we don't have real social API access

const analyzeCreator = (socialLinks) => {
  const platforms = Object.values(socialLinks || {}).filter(p => p && p.username);
  
  if (platforms.length === 0) {
    return {
      aiScore: 0,
      engagementRate: 0,
      fakeFollowerPercentage: 0,
      contentConsistency: 0,
      totalFollowers: 0,
      analysis: 'No social links provided'
    };
  }

  // Calculate total followers
  const totalFollowers = platforms.reduce((sum, p) => {
    return sum + (p.followers || p.subscribers || 0);
  }, 0);

  // Simulate engagement rate calculation (real platform would use API data)
  // Engagement rate typically 1-10% for authentic accounts
  const baseEngagement = totalFollowers > 1000000 ? 1.5 :
    totalFollowers > 100000 ? 3 :
    totalFollowers > 10000 ? 5 : 7;
  
  const engagementVariation = (Math.random() * 2 - 1); // -1 to +1
  const engagementRate = Math.max(0.5, Math.min(15, baseEngagement + engagementVariation));

  // Fake follower detection algorithm
  // Real analysis uses: follower/following ratio, engagement vs followers ratio, account age, etc.
  let fakeFollowerScore = 0;
  
  // Check follower count anomalies
  if (totalFollowers > 100000 && engagementRate < 1) {
    fakeFollowerScore += 40; // Low engagement for high followers = suspicious
  }
  
  // Simulate fake follower percentage based on follower growth patterns
  const fakeFollowerPercentage = Math.max(0, Math.min(80,
    fakeFollowerScore + Math.floor(Math.random() * 25)
  ));

  // Content consistency score (0-100)
  const contentConsistency = Math.floor(60 + Math.random() * 35);

  // AI Score calculation (0-100)
  // Factors: engagement rate, fake followers, content consistency, platform diversity
  const engagementScore = Math.min(30, engagementRate * 3);
  const authenticityScore = (100 - fakeFollowerPercentage) * 0.3;
  const consistencyScore = contentConsistency * 0.2;
  const platformScore = Math.min(20, platforms.length * 5);

  const aiScore = Math.round(engagementScore + authenticityScore + consistencyScore + platformScore);

  // Audience location simulation
  const audienceLocations = [
    { country: 'India', percentage: Math.floor(40 + Math.random() * 30) },
    { country: 'USA', percentage: Math.floor(10 + Math.random() * 15) },
    { country: 'UK', percentage: Math.floor(5 + Math.random() * 10) },
    { country: 'UAE', percentage: Math.floor(3 + Math.random() * 8) },
    { country: 'Other', percentage: 0 }
  ];
  
  // Fix percentages to sum to 100
  const total = audienceLocations.slice(0, 4).reduce((s, l) => s + l.percentage, 0);
  audienceLocations[4].percentage = Math.max(0, 100 - total);

  return {
    aiScore: Math.min(100, aiScore),
    engagementRate: parseFloat(engagementRate.toFixed(2)),
    fakeFollowerPercentage,
    contentConsistency,
    totalFollowers,
    audienceLocations,
    analysis: generateAnalysisText(aiScore, fakeFollowerPercentage, engagementRate)
  };
};

const generateAnalysisText = (score, fakePercent, engagement) => {
  if (score >= 80) return 'Excellent creator with high authenticity and strong engagement. Highly recommended for brand collaboration.';
  if (score >= 60) return 'Good creator with decent engagement. Minor concerns but overall suitable for collaboration.';
  if (score >= 40) return 'Average creator. Review analytics carefully before proceeding with collaboration.';
  return 'Low AI score. High risk of fake followers or low engagement. Proceed with caution.';
};

module.exports = { analyzeCreator };
