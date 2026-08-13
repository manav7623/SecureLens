// Instagram Statistics API - RapidAPI
// Uses: instagram-statistics-api.p.rapidapi.com

const axios = require('axios');

const API_KEY  = process.env.RAPIDAPI_KEY  || 'e36f7a1536msh062d3a5c56c3a2bp1b611djsnb14f8f982c7c';
const HOST     = 'instagram-statistics-api.p.rapidapi.com';
const BASE_URL = `https://${HOST}`;

const HEADERS = {
  'x-rapidapi-key':  API_KEY,
  'x-rapidapi-host': HOST,
};

/**
 * Fetch Instagram profile data by username
 * Returns full stats: followers, engagement, fake%, countries, gender, posts, etc.
 */
const fetchInstagramData = async (username) => {
  try {
    const url = `https://www.instagram.com/${username}/`;
    
    const response = await axios.get(`${BASE_URL}/community`, {
      headers: HEADERS,
      params: { url },
      timeout: 15000,
    });

    const raw = response.data;
    // Unwrap {meta, data} wrapper if present
    const data = raw?.data || raw;

    if (!data || !data.screenName) {
      return { success: false, error: 'Profile not found or private account' };
    }

    // Normalize the data into our format
    const normalized = {
      // Basic
      name:           data.name || username,
      username:       data.screenName || username,
      cid:            data.cid,
      followers:      data.usersCount || 0,
      verified:       data.verified || false,
      type:           data.type || 'personal',
      country:        data.countryCode || 'IN',
      bio:            data.description || '',

      // Engagement
      avgER:          parseFloat((data.avgER || 0).toFixed(4)),
      avgLikes:       data.avgLikes || 0,
      avgComments:    data.avgComments || 0,
      avgVideoViews:  data.avgVideoViews || 0,
      qualityScore:   data.qualityScore || 0,

      // Authenticity
      fakeFollowerPct: parseFloat(((data.pctFakeFollowers || 0) * 100).toFixed(2)),
      realAudiencePct: parseFloat(((1 - (data.pctFakeFollowers || 0)) * 100).toFixed(2)),

      // Audience breakdown
      audienceTypes: (data.membersTypes || []).map(t => ({
        name:    t.name,
        percent: parseFloat((t.percent * 100).toFixed(1))
      })),

      // Countries
      countries: (data.countries || []).slice(0, 5).map(c => ({
        name:    c.name,
        code:    c.code,
        percent: parseFloat((c.percent * 100).toFixed(1))
      })),

      // Gender
      genders: (data.genders || []).map(g => ({
        name:    g.name,
        percent: parseFloat((g.percent * 100).toFixed(1))
      })),

      // Recent posts
      recentPosts: (data.lastPosts || []).slice(0, 6).map(p => ({
        type:     p.type,
        likes:    p.likes || 0,
        comments: p.comments || 0,
        views:    p.views || 0,
        date:     p.date || '',
        url:      p.url || '',
      })),
    };

    return { success: true, data: normalized };

  } catch (err) {
    console.error('Instagram API Error:', err?.response?.data || err.message);

    // If API fails (rate limit / network), return error
    if (err?.response?.status === 429) {
      return { success: false, error: 'API rate limit reached. Please try again in a minute.' };
    }
    if (err?.response?.status === 404) {
      return { success: false, error: 'Instagram profile not found.' };
    }
    return { success: false, error: `API Error: ${err.message}` };
  }
};

module.exports = { fetchInstagramData };
