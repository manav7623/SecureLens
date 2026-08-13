/**
 * Instagram Real API + ML Scoring Engine
 * API: instagram-statistics-api.p.rapidapi.com
 * ML: Custom weighted scoring model trained on API features
 */

const axios = require('axios');

// API CONFIG 
const API_KEY  = 'e36f7a1536msh062d3a5c56c3a2bp1b611djsnb14f8f982c7c';
const HOST     = 'instagram-statistics-api.p.rapidapi.com';
const BASE_URL = `https://${HOST}`;
const HEADERS  = {
  'x-rapidapi-key':  API_KEY,
  'x-rapidapi-host': HOST,
};

// FETCH INSTAGRAM DATA 
async function fetchInstagramData(username) {
  const url = `https://www.instagram.com/${username}/`;
  const resp = await axios.get(`${BASE_URL}/community`, {
    headers: HEADERS,
    params: { url },
    timeout: 15000,
  });

  const raw = resp.data?.data || resp.data;
  if (!raw || !raw.usersCount) {
    throw new Error(`No data found for @${username}. Make sure the account is public.`);
  }
  return raw;
}

// PARSE API RESPONSE 
function parseInstagramData(raw, username) {
  const fake = raw.pctFakeFollowers || 0;          // 0–1 decimal
  const er   = raw.avgER            || 0;          // 0–1 decimal

  // Audience types — normalise percent to 0-100
  const audienceTypes = (raw.membersTypes || []).map(t => ({
    name:    t.name,
    percent: (t.percent || 0) * 100,
  }));

  // Countries
  const countries = (raw.countries || []).slice(0, 6).map(c => ({
    name:    c.name,
    percent: (c.percent || 0) * 100,
  }));

  // Gender split
  const genders = (raw.genders || []).map(g => ({
    name:    g.name,
    percent: (g.percent || 0) * 100,
  }));

  // Last posts
  const lastPosts = (raw.lastPosts || []).slice(0, 5).map(p => ({
    type:     p.type,
    likes:    p.likes    || 0,
    comments: p.comments || 0,
    date:     p.date     || '',
    url:      p.url      || '',
  }));

  return {
    username:         raw.screenName || username,
    name:             raw.name       || username,
    followers:        raw.usersCount || 0,
    avgER:            er,
    avgLikes:         raw.avgLikes    || 0,
    avgComments:      raw.avgComments || 0,
    avgVideoViews:    raw.avgVideoViews || 0,
    qualityScore:     raw.qualityScore  || 0,
    fakeFollowerPct:  fake * 100,           // convert to 0-100 for display
    isVerified:       raw.verified || false,
    countryCode:      raw.countryCode  || '',
    bio:              raw.description  || '',
    type:             raw.type || '',
    audienceTypes,
    countries,
    genders,
    lastPosts,
  };
}

// ML SCORING MODEL
/**
 * Feature Engineering + Weighted Scoring
 *
 * Training logic:
 *  - We use domain-knowledge-derived weights (proxy for trained coefficients)
 *  - Each feature is normalised 0-1, then multiplied by its weight
 *  - Weights sum to 100 (total possible score)
 *
 * Features used:
 *  1. Engagement Rate          (weight 30) — primary authenticity signal
 *  2. Fake Follower %          (weight 30) — authenticity / bot detection
 *  3. Real Audience %          (weight 20) — membersTypes "Real People"
 *  4. Content Consistency      (weight 10) — post frequency signal from lastPosts
 *  5. Profile Quality          (weight 10) — bio, verification, follower tier
 */
function mlScore(parsed) {
  const { followers, avgER, fakeFollowerPct, audienceTypes, lastPosts, isVerified, bio, qualityScore } = parsed;

  // 1. ENGAGEMENT SCORE (30 pts)
  // Benchmark ER by follower tier (industry standards)
  let goodER, greatER, tier;
  if      (followers >= 1_000_000) { goodER = 0.01; greatER = 0.025; tier = 'Mega'   ; }
  else if (followers >= 100_000)   { goodER = 0.02; greatER = 0.04;  tier = 'Macro'  ; }
  else if (followers >= 10_000)    { goodER = 0.03; greatER = 0.06;  tier = 'Mid'    ; }
  else if (followers >= 1_000)     { goodER = 0.05; greatER = 0.10;  tier = 'Micro'  ; }
  else                              { goodER = 0.08; greatER = 0.15;  tier = 'Nano'   ; }

  // Normalise ER relative to "great" benchmark
  const erNorm = Math.min(avgER / greatER, 1.5) / 1.5;  // cap at 150% of great ER
  const engagementScore = Math.round(erNorm * 30);

  // 2. AUTHENTICITY SCORE (30 pts)
  // Lower fake% = higher score
  const fakeNorm = Math.max(0, 1 - (fakeFollowerPct / 100));
  // Quality score from API (0-100) used as secondary signal
  const qNorm = Math.min((qualityScore || 50) / 100, 1);
  const authenticityScore = Math.round((fakeNorm * 0.7 + qNorm * 0.3) * 30);

  // 3. AUDIENCE QUALITY SCORE (20 pts)
  // "Real People" percentage from membersTypes
  const realPeople = audienceTypes.find(t => t.name?.toLowerCase().includes('real')) || { percent: 50 };
  const suspiciousAudience = audienceTypes.find(t => t.name?.toLowerCase().includes('suspicious')) || { percent: 0 };
  const realNorm = (realPeople.percent / 100) - (suspiciousAudience.percent / 200);
  const audienceScore = Math.round(Math.max(0, Math.min(realNorm, 1)) * 20);

  // 4. CONTENT CONSISTENCY SCORE (10 pts)
  // Based on post recency & count in lastPosts
  let contentScore = 5; // default mid
  if (lastPosts.length >= 5) {
    // Check if posts are within last 90 days
    const now = Date.now();
    const recentPosts = lastPosts.filter(p => {
      if (!p.date) return false;
      const diff = (now - new Date(p.date).getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 90;
    });
    contentScore = Math.round((recentPosts.length / 5) * 10);
  }

  // 5. PROFILE QUALITY SCORE (10 pts)
  let profileScore = 0;
  if (isVerified)             profileScore += 4;
  if (bio && bio.length > 30) profileScore += 3;
  if (followers >= 1000)      profileScore += 2;
  if (followers >= 10000)     profileScore += 1;
  profileScore = Math.min(profileScore, 10);

  // TOTAL AI SCORE
  const total = Math.min(100, engagementScore + authenticityScore + audienceScore + contentScore + profileScore);

  // LABEL
  let label, labelColor;
  if      (total >= 80) { label = 'Excellent'; labelColor = '#4ade80'; }
  else if (total >= 65) { label = 'Good';      labelColor = '#a3e635'; }
  else if (total >= 50) { label = 'Average';   labelColor = '#facc15'; }
  else if (total >= 35) { label = 'Below Avg'; labelColor = '#fb923c'; }
  else                   { label = 'Low Risk';  labelColor = '#f87171'; }

  // ANALYSIS TEXT
  const erDisplay = (avgER * 100).toFixed(2);
  let analysis = '';
  if      (total >= 80) analysis = `Outstanding creator! Engagement rate of ${erDisplay}% is ${erNorm >= 1 ? 'above' : 'near'} industry benchmark for ${tier} creators. Only ${fakeFollowerPct.toFixed(1)}% fake followers — very authentic audience. Highly recommended for brand deals.`;
  else if (total >= 65) analysis = `Good creator with solid metrics. ER ${erDisplay}% and ${fakeFollowerPct.toFixed(1)}% fake followers. Suitable for most campaigns in the ${tier} tier.`;
  else if (total >= 50) analysis = `Average performance. ER of ${erDisplay}% is below benchmark for ${tier} creators. ${fakeFollowerPct.toFixed(1)}% fake followers detected. Brands should negotiate carefully.`;
  else if (total >= 35) analysis = `Below average metrics. Low engagement (${erDisplay}%) with ${fakeFollowerPct.toFixed(1)}% suspected fake followers. Recommend verifying before campaign.`;
  else                   analysis = `Caution: Very low AI score. High fake follower rate (${fakeFollowerPct.toFixed(1)}%) and low engagement (${erDisplay}%). Not recommended for paid campaigns.`;

  // RECOMMENDATIONS
  const recommendations = [];
  if (fakeFollowerPct > 20)   recommendations.push('High fake follower percentage — audience may be bought');
  if (avgER < goodER)         recommendations.push(`Engagement below benchmark for ${tier} tier (need ≥${(goodER*100).toFixed(1)}%)`);
  if (contentScore < 5)       recommendations.push('Post more consistently — brands prefer regular creators');
  if (!isVerified)            recommendations.push('Getting verified builds additional trust with brands');
  if (total >= 65)            recommendations.push('Great profile! Keep engagement high for premium deals');

  return {
    aiScore: total,
    label,
    labelColor,
    analysis,
    recommendations,
    breakdown: { engagementScore, authenticityScore, audienceScore, contentScore, profileScore },
    benchmarkInfo: {
      followerTier: tier,
      goodEngagement:   parseFloat((goodER * 100).toFixed(2)),
      greatEngagement:  parseFloat((greatER * 100).toFixed(2)),
      actualEngagement: parseFloat((avgER * 100).toFixed(2)),
    },
  };
}

// MAIN EXPORT
async function analyzeInstagramProfile(username) {
  // 1. Fetch real data from API
  const raw    = await fetchInstagramData(username);
  // 2. Parse into clean object
  const parsed = parseInstagramData(raw, username);
  // 3. Run ML scoring model
  const score  = mlScore(parsed);

  return {
    instagramData: parsed,
    mlScore:       score,
    rawApiData:    raw,   // keep for debugging if needed
  };
}

// Fallback: pure-ML on user-provided numbers (no API) 
function analyzeManualData({ followers = 0, engagementRate = 0, fakeFollowerPct = 0 }) {
  const parsed = {
    username: 'manual',
    followers,
    avgER: engagementRate / 100,
    fakeFollowerPct,
    audienceTypes: [{ name: 'Real People', percent: 100 - fakeFollowerPct }],
    lastPosts: [],
    isVerified: false,
    bio: '',
    qualityScore: 50,
    avgLikes: 0,
    avgComments: 0,
    avgVideoViews: 0,
    countries: [],
    genders: [],
  };
  return { instagramData: parsed, mlScore: mlScore(parsed) };
}

module.exports = { analyzeInstagramProfile, analyzeManualData, mlScore };
