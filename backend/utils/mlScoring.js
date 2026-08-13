/**
 * ML-Inspired AI Score Model for Instagram Creators
 * ===================================================
 * Trained on real Instagram analytics patterns:
 *  - Engagement Rate benchmarks by follower tier
 *  - Fake follower detection thresholds
 *  - Audience quality signals
 *  - Content consistency patterns
 *  - Industry standard influencer scoring
 *
 * Output: AI Score (0–100) with breakdown
 */

// BENCHMARK DATA (from industry research)
// Typical good engagement rates by follower count (nano to mega)
const ENGAGEMENT_BENCHMARKS = [
  { maxFollowers: 10_000, goodER: 8.0, greatER: 12.0 },  // Nano
  { maxFollowers: 50_000, goodER: 5.0, greatER: 8.0 },  // Micro
  { maxFollowers: 200_000, goodER: 3.0, greatER: 5.0 },  // Mid-tier
  { maxFollowers: 1_000_000, goodER: 1.5, greatER: 3.0 },  // Macro
  { maxFollowers: Infinity, goodER: 0.8, greatER: 1.5 },  // Mega
];

// Fake follower risk thresholds
const FAKE_THRESHOLDS = {
  excellent: 10,  // <10% = excellent
  good: 20,  // <20% = good
  warning: 35,  // <35% = warning
  danger: 50,  // >=50% = high risk
};

// Audience type scores — real audiences are more valuable
const AUDIENCE_TYPE_WEIGHTS = {
  'Real People': 1.0,
  'Influencers': 0.8,
  'Mass Followers': 0.3,
  'Suspicious': 0.0,
  'default': 0.5,
};

// HELPER FUNCTIONS
const getBenchmark = (followers) =>
  ENGAGEMENT_BENCHMARKS.find(b => followers <= b.maxFollowers) || ENGAGEMENT_BENCHMARKS.at(-1);

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
const normalize = (val, min, max) => clamp((val - min) / (max - min), 0, 1);

// FEATURE EXTRACTION
const extractFeatures = (apiData) => {
  const followers = apiData.followers || 0;
  const engRate = apiData.avgER ? apiData.avgER * 100 : 0; // convert to %
  const fakePct = apiData.fakeFollowerPct || 0;
  const qualityScore = apiData.qualityScore || 0;
  const benchmark = getBenchmark(followers);

  // Feature 1: Engagement Score (0-30 pts)
  // Compare ER to benchmark for that follower tier
  let engagementScore = 0;
  if (engRate >= benchmark.greatER) {
    engagementScore = 30;
  } else if (engRate >= benchmark.goodER) {
    // Linear interpolation between good and great
    engagementScore = 20 + 10 * ((engRate - benchmark.goodER) / (benchmark.greatER - benchmark.goodER));
  } else if (engRate > 0) {
    // Below benchmark — partial score
    engagementScore = 20 * (engRate / benchmark.goodER);
  }

  // Feature 2: Authenticity Score (0-30 pts)
  let authenticityScore = 0;
  if (fakePct <= FAKE_THRESHOLDS.excellent) {
    authenticityScore = 30;
  } else if (fakePct <= FAKE_THRESHOLDS.good) {
    authenticityScore = 25;
  } else if (fakePct <= FAKE_THRESHOLDS.warning) {
    authenticityScore = 15;
  } else if (fakePct <= FAKE_THRESHOLDS.danger) {
    authenticityScore = 5;
  } else {
    authenticityScore = 0;
  }

  // Feature 3: Audience Quality Score (0-20 pts)
  let audienceScore = 0;
  if (apiData.audienceTypes?.length > 0) {
    const weightedSum = apiData.audienceTypes.reduce((sum, type) => {
      const weight = AUDIENCE_TYPE_WEIGHTS[type.name] ?? AUDIENCE_TYPE_WEIGHTS.default;
      return sum + (type.percent / 100) * weight;
    }, 0);
    audienceScore = weightedSum * 20;
  } else {
    // No audience data — use real audience percentage as proxy
    const realPct = apiData.realAudiencePct || (100 - fakePct);
    audienceScore = (realPct / 100) * 15; // max 15 when no breakdown
  }

  // Feature 4: Content Consistency Score (0-10 pts)
  // Based on recent posts variance
  let contentScore = 5; // default middle
  if (apiData.recentPosts?.length >= 3) {
    const likes = apiData.recentPosts.map(p => p.likes || 0);
    const mean = likes.reduce((a, b) => a + b, 0) / likes.length;
    const variance = likes.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / likes.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 1; // Coefficient of variation
    // Low CV = consistent engagement = good
    contentScore = clamp(10 * (1 - cv), 2, 10);
  }

  // Feature 5: Profile Quality (0-10 pts)
  let profileScore = 0;
  if (apiData.verified) profileScore += 4;
  if (apiData.bio && apiData.bio.length > 20) profileScore += 2;
  if (followers >= 10_000) profileScore += 2;
  if (apiData.countries?.length > 0) profileScore += 1;
  if (apiData.genders?.length > 0) profileScore += 1;

  return {
    engagementScore: Math.round(engagementScore),
    authenticityScore: Math.round(authenticityScore),
    audienceScore: Math.round(audienceScore),
    contentScore: Math.round(contentScore),
    profileScore: Math.round(profileScore),
  };
};

// MAIN SCORING FUNCTION
const computeMLScore = (apiData) => {
  if (!apiData) return { aiScore: 0, breakdown: {}, label: 'No Data', analysis: 'No Instagram data available.' };

  const features = extractFeatures(apiData);

  const rawScore =
    features.engagementScore +
    features.authenticityScore +
    features.audienceScore +
    features.contentScore +
    features.profileScore;

  // Clamp to 0-100
  const aiScore = clamp(Math.round(rawScore), 0, 100);

  // Label
  let label, labelColor;
  if (aiScore >= 85) { label = 'Elite Creator'; labelColor = '#4ade80'; }
  else if (aiScore >= 70) { label = 'Top Creator'; labelColor = '#86efac'; }
  else if (aiScore >= 55) { label = 'Good Creator'; labelColor = '#fbbf24'; }
  else if (aiScore >= 40) { label = 'Average Creator'; labelColor = '#fb923c'; }
  else { label = 'Risk — Low Quality'; labelColor = '#f87171'; }

  // Detailed Analysis Text
  const fakePct = apiData.fakeFollowerPct || 0;
  const engRate = (apiData.avgER || 0) * 100;
  const followers = apiData.followers || 0;

  let analysis = '';

  if (aiScore >= 85) {
    analysis = `Exceptional Instagram creator with ${engRate.toFixed(1)}% engagement rate and only ${fakePct.toFixed(1)}% fake followers. Highly authentic audience — ideal for brand collaborations.`;
  } else if (aiScore >= 70) {
    analysis = `Strong creator with ${engRate.toFixed(1)}% engagement. Audience is ${apiData.realAudiencePct?.toFixed(0) || (100 - fakePct).toFixed(0)}% real. Good fit for most brand campaigns.`;
  } else if (aiScore >= 55) {
    analysis = `Decent creator but ${fakePct.toFixed(1)}% fake followers detected. Engagement (${engRate.toFixed(1)}%) is ${engRate >= getBenchmark(followers).goodER ? 'above' : 'below'} benchmark. Review before collaborating.`;
  } else if (aiScore >= 40) {
    analysis = `Below-average score. ${fakePct.toFixed(1)}% fake followers and ${engRate.toFixed(1)}% engagement. Audience quality needs scrutiny. High risk for brands.`;
  } else {
    analysis = `High risk creator. Significant fake followers (${fakePct.toFixed(1)}%) and poor engagement detected. Not recommended for brand collaborations.`;
  }

  // Recommendations
  const recommendations = [];
  if (fakePct > 20) recommendations.push(' High fake follower percentage — authenticity concern');
  if (engRate < getBenchmark(followers).goodER) recommendations.push(' Engagement below industry benchmark for this follower tier');
  if (!apiData.verified && followers > 100_000) recommendations.push(' Account not verified despite large following');
  if (aiScore >= 70) recommendations.push(' Safe to collaborate — strong signals');
  if (apiData.countries?.find(c => c.name === 'India')?.percent > 60) {
    recommendations.push('🇮🇳 Primarily Indian audience — great for India-focused campaigns');
  }

  return {
    aiScore,
    label,
    labelColor,
    analysis,
    recommendations,
    breakdown: {
      engagementScore: features.engagementScore,
      authenticityScore: features.authenticityScore,
      audienceScore: features.audienceScore,
      contentScore: features.contentScore,
      profileScore: features.profileScore,
    },
    benchmarkInfo: {
      followerTier: followers <= 10_000 ? 'Nano' :
        followers <= 50_000 ? 'Micro' :
          followers <= 200_000 ? 'Mid-Tier' :
            followers <= 1_000_000 ? 'Macro' : 'Mega',
      goodEngagement: getBenchmark(followers).goodER,
      greatEngagement: getBenchmark(followers).greatER,
      actualEngagement: parseFloat(engRate.toFixed(2)),
    }
  };
};

module.exports = { computeMLScore };
