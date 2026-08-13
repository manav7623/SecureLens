const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { auth } = require('../middleware/auth');
const { analyzeInstagramProfile } = require('../utils/instagramML');

router.post('/analyze', auth, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username?.trim()) return res.status(400).json({ error: 'Username required' });
    const clean = username.trim().replace(/^@/, '').replace(/\s/g, '');
    console.log(`Analyzing @${clean}`);

    const result = await analyzeInstagramProfile(clean);
    const { instagramData: ig, mlScore } = result;

    // Use findByIdAndUpdate with $set so only specified fields change
    // This avoids Mongoose casting issues with partial objects
    const existing = await User.findById(req.user._id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const existingCP = existing.creatorProfile || {};

    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'creatorProfile.socialLinks.instagram.username':  ig.username || '',
        'creatorProfile.socialLinks.instagram.followers': ig.followers || 0,
        'creatorProfile.socialLinks.instagram.url':       `https://www.instagram.com/${ig.username}/`,

        'creatorProfile.totalFollowers':         ig.followers || 0,
        'creatorProfile.engagementRate':         parseFloat(((ig.avgER||0) * 100).toFixed(2)),
        'creatorProfile.fakeFollowerPercentage': parseFloat((ig.fakeFollowerPct||0).toFixed(1)),
        'creatorProfile.contentConsistency':     (mlScore.breakdown.contentScore || 0) * 10,
        'creatorProfile.aiScore':                mlScore.aiScore || 0,

        'creatorProfile.audienceLocations': (ig.countries||[]).slice(0,5).map(c => ({
          country: c.name, percentage: parseFloat(c.percent.toFixed(1))
        })),

        'creatorProfile.audienceTypes':  JSON.stringify(ig.audienceTypes  || []),
        'creatorProfile.genderSplit':    JSON.stringify(ig.genders         || []),
        'creatorProfile.lastPosts':      JSON.stringify(ig.lastPosts       || []),
        'creatorProfile.mlBreakdown':    JSON.stringify(mlScore.breakdown  || {}),
        'creatorProfile.mlLabel':        mlScore.label    || '',
        'creatorProfile.mlAnalysis':     mlScore.analysis || '',
        'creatorProfile.lastAnalyzedAt': new Date(),

        // Keep existing values, only set if not already present
        'creatorProfile.bio':      existingCP.bio      || ig.bio      || '',
        'creatorProfile.location': existingCP.location || ig.countryCode || '',
        'creatorProfile.niche':    existingCP.niche    || [],

        // rateCard — always set with safe defaults
        'creatorProfile.rateCard.postRate':  existingCP.rateCard?.postRate  || 0,
        'creatorProfile.rateCard.storyRate': existingCP.rateCard?.storyRate || 0,
        'creatorProfile.rateCard.videoRate': existingCP.rateCard?.videoRate || 0,

        'creatorProfile.isFeatured':         existingCP.isFeatured         || false,
        'creatorProfile.collaborationCount': existingCP.collaborationCount  || 0,
      }
    }, { new: true, runValidators: false });

    const updated = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      message: `@${clean} analyzed! AI Score: ${mlScore.aiScore}/100`,
      result,
      user: updated,
    });

  } catch (err) {
    console.error('Instagram error:', err.message);
    if (err.response?.status === 404 || err.message?.includes('No data'))
      return res.status(404).json({ error: `Account @${req.body.username} not found or private.` });
    if (err.response?.status === 429)
      return res.status(429).json({ error: 'API rate limit. Wait a minute and retry.' });
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT')
      return res.status(504).json({ error: 'API timed out. Try again.' });
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user || user.role !== 'creator') return res.status(404).json({ error: 'Creator not found' });
    const cp = user.creatorProfile || {};
    let audienceTypes=[], genderSplit=[], lastPosts=[], mlBreakdown={};
    try { audienceTypes = JSON.parse(cp.audienceTypes || '[]'); } catch {}
    try { genderSplit   = JSON.parse(cp.genderSplit   || '[]'); } catch {}
    try { lastPosts     = JSON.parse(cp.lastPosts     || '[]'); } catch {}
    try { mlBreakdown   = JSON.parse(cp.mlBreakdown   || '{}'); } catch {}
    res.json({
      creator: user,
      analysis: {
        aiScore:           cp.aiScore              || 0,
        engagementRate:    cp.engagementRate        || 0,
        fakeFollowerPct:   cp.fakeFollowerPercentage|| 0,
        totalFollowers:    cp.totalFollowers        || 0,
        mlLabel:           cp.mlLabel              || '',
        mlAnalysis:        cp.mlAnalysis            || '',
        mlBreakdown, audienceTypes, genderSplit, lastPosts,
        audienceLocations: cp.audienceLocations     || [],
        lastAnalyzedAt:    cp.lastAnalyzedAt        || null,
        instagramUsername: cp.socialLinks?.instagram?.username || '',
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
