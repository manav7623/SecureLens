// Run this file to create demo accounts
// Command: node seed.js

require('dotenv').config();
const { sequelize, initializeDatabase } = require('./config/database');
const setupAssociations = require('./models/associations');
const User = require('./models/User');
const Campaign = require('./models/Campaign');
const Application = require('./models/Application');
const Payment = require('./models/Payment');

async function seed() {
  try {
// Initialize DB and wipe/recreate collections
    await initializeDatabase();
    setupAssociations();
    await User.deleteMany({});
    await Campaign.deleteMany({});
    await Application.deleteMany({});
    await Payment.deleteMany({});
    const Message = require('./models/Message');
    const ContentSubmission = require('./models/ContentSubmission');
    await Message.deleteMany({});
    await ContentSubmission.deleteMany({});
    console.log('✅ MongoDB database collections cleared.');

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@demo.com',
      password: 'MD123456',
      role: 'admin',
      isVerified: true
    });
    console.log('✅ Admin created: admin@demo.com / MD123456');

    // Create Brands
    const brand1 = await User.create({
      name: 'TechCorp India',
      email: 'brand@demo.com',
      password: 'MD123456',
      role: 'brand',
      isVerified: true,
      brandProfile: {
        companyName: 'TechCorp India',
        industry: 'Technology',
        website: 'https://techcorp.in',
        description: 'Leading tech company in India specializing in mobile apps and software solutions.',
        location: 'Bangalore, India',
        campaignCount: 3
      }
    });

    const brand2 = await User.create({
      name: 'Nike India',
      email: 'nike@demo.com',
      password: 'MD123456',
      role: 'brand',
      isVerified: true,
      brandProfile: {
        companyName: 'Nike India',
        industry: 'Sports & Apparel',
        website: 'https://nike.in',
        description: 'Global leader in athletic footwear, apparel, equipment, and accessories.',
        location: 'Mumbai, India',
        campaignCount: 1
      }
    });

    const brand3 = await User.create({
      name: 'Zomato',
      email: 'zomato@demo.com',
      password: 'MD123456',
      role: 'brand',
      isVerified: true,
      brandProfile: {
        companyName: 'Zomato Limited',
        industry: 'Food & Beverage',
        website: 'https://zomato.com',
        description: 'Leading online food delivery and restaurant discovery platform.',
        location: 'Gurugram, India',
        campaignCount: 1
      }
    });

    const brand4 = await User.create({
      name: 'Adidas India',
      email: 'adidas@demo.com',
      password: 'MD123456',
      role: 'brand',
      isVerified: true,
      brandProfile: {
        companyName: 'Adidas India',
        industry: 'Sports & Lifestyle',
        website: 'https://adidas.co.in',
        description: 'Global sports brand designing and manufacturing footwear, sportswear, and equipment.',
        location: 'New Delhi, India',
        campaignCount: 0
      }
    });

    const brand5 = await User.create({
      name: 'Apple India',
      email: 'apple@demo.com',
      password: 'MD123456',
      role: 'brand',
      isVerified: true,
      brandProfile: {
        companyName: 'Apple India Private Limited',
        industry: 'Consumer Electronics',
        website: 'https://apple.com/in',
        description: 'Designs, manufactures, and markets smartphones, personal computers, tablets, and wearables.',
        location: 'Mumbai, India',
        campaignCount: 0
      }
    });

    const brand6 = await User.create({
      name: 'Samsung India',
      email: 'samsung@demo.com',
      password: 'MD123456',
      role: 'brand',
      isVerified: true,
      brandProfile: {
        companyName: 'Samsung India Electronics',
        industry: 'Consumer Electronics',
        website: 'https://samsung.com/in',
        description: 'Global leader in technology, mobile phones, home appliances, and semiconductors.',
        location: 'Gurugram, India',
        campaignCount: 0
      }
    });

    const brand7 = await User.create({
      name: 'Puma India',
      email: 'puma@demo.com',
      password: 'MD123456',
      role: 'brand',
      isVerified: true,
      brandProfile: {
        companyName: 'Puma India',
        industry: 'Sports & Lifestyle',
        website: 'https://puma.com',
        description: 'Third largest sportswear manufacturer in the world designing and manufacturing shoes and clothing.',
        location: 'Bangalore, India',
        campaignCount: 0
      }
    });

    const brand8 = await User.create({
      name: 'boAt Lifestyle',
      email: 'boat@demo.com',
      password: 'MD123456',
      role: 'brand',
      isVerified: true,
      brandProfile: {
        companyName: 'boAt Lifestyle',
        industry: 'Audio & Wearables',
        website: 'https://boat-lifestyle.com',
        description: 'India’s fastest-growing audio brand specializing in earphones, headphones, and smart watches.',
        location: 'New Delhi, India',
        campaignCount: 0
      }
    });

    const brand9 = await User.create({
      name: 'Netflix India',
      email: 'netflix@demo.com',
      password: 'MD123456',
      role: 'brand',
      isVerified: true,
      brandProfile: {
        companyName: 'Netflix India',
        industry: 'Entertainment',
        website: 'https://netflix.com',
        description: 'Leading streaming entertainment service offering movies, TV series, and documentaries.',
        location: 'Mumbai, India',
        campaignCount: 0
      }
    });
    console.log('✅ Brands created.');

    // Create Requested Creators
    const creatorNames = ['MD', 'krish', 'tamanna', 'harshita', 'manav', 'ravi', 'smit', 'happy', 'hitiksha'];
    const niches = [
      ['Tech', 'Lifestyle'],
      ['Fitness', 'Lifestyle'],
      ['Fashion', 'Beauty'],
      ['Travel', 'Food'],
      ['Fashion', 'Lifestyle'],
      ['Gaming', 'Tech'],
      ['Education', 'Finance'],
      ['Entertainment', 'Comedy'],
      ['Art', 'Design']
    ];
    const followerCounts = [150000, 45000, 95000, 120000, 85000, 250000, 60000, 310000, 75000];
    const engagementRates = [4.5, 3.8, 5.2, 4.1, 4.8, 6.2, 5.9, 7.1, 4.9];
    const aiScores = [85, 72, 88, 79, 81, 92, 86, 94, 80];

    const creators = [];

    for (let i = 0; i < creatorNames.length; i++) {
      const name = creatorNames[i];
      const email = `${name.toLowerCase()}@demo.com`;
      const creator = await User.create({
        name: name,
        email: email,
        password: 'MD123456',
        role: 'creator',
        isVerified: true,
        creatorProfile: {
          bio: `${name} is an active content creator sharing updates about ${niches[i].join(' and ')}.`,
          niche: niches[i],
          location: 'Mumbai, India',
          totalFollowers: followerCounts[i],
          engagementRate: engagementRates[i],
          aiScore: aiScores[i],
          fakeFollowerPercentage: Math.floor(Math.random() * 5) + 3,
          contentConsistency: Math.floor(Math.random() * 15) + 80,
          isFeatured: i % 2 === 0,
          collaborationCount: Math.floor(Math.random() * 10) + 4,
          socialLinks: {
            instagram: { username: `${name.toLowerCase()}.official`, followers: Math.floor(followerCounts[i] * 0.7), url: 'https://instagram.com' },
            youtube: { username: `${name} Vlogs`, subscribers: Math.floor(followerCounts[i] * 0.3), url: 'https://youtube.com' }
          },
          rateCard: { postRate: 12000, storyRate: 4000, videoRate: 20000 },
          tags: niches[i].map(n => n.toLowerCase())
        }
      });
      creators.push(creator);
      console.log(`✅ Creator created: ${email} / MD123456`);
    }

    // Create campaigns dynamically for each brand (2 to 4 each)
    const brands = [brand1, brand2, brand3, brand4, brand5, brand6, brand7, brand8, brand9];
    let campaign1, campaign2;

    const campaignTemplates = {
      'TechCorp India': [
        { title: 'Summer App Launch Campaign', desc: 'Looking for tech-savvy creators to showcase our new productivity app. We want authentic reviews and creative unboxing content.', niche: ['Tech', 'Lifestyle'], platforms: ['instagram', 'youtube'], budget: { min: 20000, max: 80000, currency: 'INR' }, req: { minFollowers: 10000, minEngagement: 2 }, del: ['1 YouTube video', '3 Instagram Reels'] },
        { title: 'SaaS Tool Walkthrough', desc: 'Promote our team collab features to professionals. Show how it simplifies project tracking.', niche: ['Tech', 'Education'], platforms: ['linkedin', 'youtube'], budget: { min: 15000, max: 60000, currency: 'INR' }, req: { minFollowers: 5000, minEngagement: 3 }, del: ['1 walkthrough post', '1 video review'] },
        { title: 'AI Assistant Integration', desc: 'Demonstrate our new AI assistant automation features to save time.', niche: ['Tech'], platforms: ['twitter', 'youtube'], budget: { min: 30000, max: 90000, currency: 'INR' }, req: { minFollowers: 15000, minEngagement: 2 }, del: ['1 thread', '1 YouTube video'] }
      ],
      'Nike India': [
        { title: 'Festive Fashion Collection', desc: 'Seeking fashion creators to feature our latest athletic wear collection for Diwali season.', niche: ['Fashion', 'Lifestyle'], platforms: ['instagram'], budget: { min: 10000, max: 50000, currency: 'INR' }, req: { minFollowers: 5000, minEngagement: 3 }, del: ['2 posts', '5 Reels'] },
        { title: 'Marathon Run Footwear Campaign', desc: 'Promote our high-performance running shoes designed for marathons.', niche: ['Fitness', 'Lifestyle'], platforms: ['instagram', 'youtube'], budget: { min: 40000, max: 120000, currency: 'INR' }, req: { minFollowers: 20000, minEngagement: 4 }, del: ['1 YouTube vlog', '2 Reels'] },
        { title: 'Air Max Streetwear Collab', desc: 'Showcase street fashion styling featuring our premium Air Max series.', niche: ['Fashion', 'Lifestyle'], platforms: ['instagram'], budget: { min: 30000, max: 80000, currency: 'INR' }, req: { minFollowers: 12000, minEngagement: 4.5 }, del: ['3 Reels', '5 Stories'] }
      ],
      'Zomato Limited': [
        { title: 'Zomato Gold Food Tour', desc: 'Vloggers and food bloggers needed to cover the Zomato food tour experiences in major cities.', niche: ['Food', 'Travel'], platforms: ['instagram', 'youtube'], budget: { min: 30000, max: 90000, currency: 'INR' }, req: { minFollowers: 20000, minEngagement: 4 }, del: ['1 YouTube Vlog', '2 Instagram Reels'] },
        { title: 'Late Night Delivery Craving', desc: 'Showcase Zomato’s 24/7 late-night delivery speed and food selection options.', niche: ['Food', 'Lifestyle'], platforms: ['instagram'], budget: { min: 15000, max: 45000, currency: 'INR' }, req: { minFollowers: 10000, minEngagement: 3 }, del: ['2 Reels', '4 Stories'] },
        { title: 'Home Cooking vs Ordering Out', desc: 'Make a fun, comparative Reel showing why ordering on Zomato saves time and effort during busy workdays.', niche: ['Food', 'Lifestyle'], platforms: ['instagram'], budget: { min: 20000, max: 55000, currency: 'INR' }, req: { minFollowers: 8000, minEngagement: 3.5 }, del: ['1 Reel', '2 Stories'] }
      ],
      'Adidas India': [
        { title: 'Ultraboost Comfort Challenge', desc: 'Wear Ultraboost sneakers for 24 hours straight and document your daily step counts.', niche: ['Fitness', 'Lifestyle'], platforms: ['instagram', 'youtube'], budget: { min: 25000, max: 75000, currency: 'INR' }, req: { minFollowers: 10000, minEngagement: 3.5 }, del: ['1 Reel', '1 Shorts video'] },
        { title: 'Street Style Sportswear Haul', desc: 'Create a fashion lookbook showcasing our newest arrivals of tracksuits and hoodies.', niche: ['Fashion', 'Lifestyle'], platforms: ['instagram'], budget: { min: 20000, max: 60000, currency: 'INR' }, req: { minFollowers: 8000, minEngagement: 4 }, del: ['1 lookbook video', '3 posts'] },
        { title: 'Workout Routine & Gear', desc: 'Share your daily workout regimen styled in full Adidas training wear.', niche: ['Fitness'], platforms: ['youtube'], budget: { min: 35000, max: 95000, currency: 'INR' }, req: { minFollowers: 15000, minEngagement: 3 }, del: ['1 workout video'] }
      ],
      'Apple India Private Limited': [
        { title: 'iPhone Cinematography Masterclass', desc: 'Shoot a high-quality cinematic mini-vlog entirely on the latest iPhone 15 Pro.', niche: ['Tech', 'Travel'], platforms: ['youtube', 'instagram'], budget: { min: 50000, max: 150000, currency: 'INR' }, req: { minFollowers: 30000, minEngagement: 5 }, del: ['1 cinematic vlog', '2 Reels'] },
        { title: 'iPad Pro Digital Art Challenge', desc: 'Draw a stunning illustration on iPad Pro using Apple Pencil and showcase the process.', niche: ['Art', 'Design'], platforms: ['instagram', 'tiktok'], budget: { min: 30000, max: 90000, currency: 'INR' }, req: { minFollowers: 10000, minEngagement: 6 }, del: ['1 speedpaint video', '1 story set'] }
      ],
      'Samsung India Electronics': [
        { title: 'Galaxy Nightography Challenge', desc: 'Capture stunning low-light photos and videos in city nightscapes using Galaxy Zoom.', niche: ['Tech', 'Lifestyle'], platforms: ['instagram'], budget: { min: 25000, max: 85000, currency: 'INR' }, req: { minFollowers: 12000, minEngagement: 4 }, del: ['3 posts', '2 Reels'] },
        { title: 'Foldable Screen Multitasking', desc: 'Show how the Galaxy Z Fold improves your productivity and daily multitasking.', niche: ['Tech'], platforms: ['youtube'], budget: { min: 40000, max: 110000, currency: 'INR' }, req: { minFollowers: 20000, minEngagement: 3 }, del: ['1 YouTube review'] },
        { title: 'SmartThings Smart Home Tour', desc: 'Set up automated home appliances using Samsung SmartThings integration.', niche: ['Tech', 'Lifestyle'], platforms: ['youtube', 'instagram'], budget: { min: 50000, max: 130000, currency: 'INR' }, req: { minFollowers: 25000, minEngagement: 2.5 }, del: ['1 home tour video'] }
      ],
      'Puma India': [
        { title: 'Puma Running Club Meetup', desc: 'Document your local running club experience wearing the new Nitro series.', niche: ['Fitness', 'Travel'], platforms: ['instagram'], budget: { min: 15000, max: 45000, currency: 'INR' }, req: { minFollowers: 8000, minEngagement: 3.8 }, del: ['1 Reel', '3 Stories'] },
        { title: 'Gym wear Lookbook', desc: 'A styling guide for high-impact workout clothing featuring breathable fabrics.', niche: ['Fashion', 'Fitness'], platforms: ['instagram', 'tiktok'], budget: { min: 20000, max: 55000, currency: 'INR' }, req: { minFollowers: 10000, minEngagement: 4.2 }, del: ['1 Reel', '2 posts'] }
      ],
      'boAt Lifestyle': [
        { title: 'boAt ANC Headphone Sound Test', desc: 'Create a sound test and active noise cancellation review in loud public spaces.', niche: ['Tech', 'Lifestyle'], platforms: ['youtube', 'instagram'], budget: { min: 18000, max: 50000, currency: 'INR' }, req: { minFollowers: 10000, minEngagement: 3 }, del: ['1 review video', '2 Reels'] },
        { title: 'Smartwatch Fitness Tracking', desc: 'Track your heart rate, steps, and sports modes over 3 days using our smartwatch.', niche: ['Fitness', 'Tech'], platforms: ['instagram'], budget: { min: 12000, max: 35000, currency: 'INR' }, req: { minFollowers: 5000, minEngagement: 4 }, del: ['1 Reel', '3 Stories'] },
        { title: 'Party Speaker Bass Test', desc: 'Throw a rooftop house party and showcase the volume and bass output of our speaker.', niche: ['Entertainment', 'Lifestyle'], platforms: ['youtube'], budget: { min: 30000, max: 70000, currency: 'INR' }, req: { minFollowers: 15000, minEngagement: 5 }, del: ['1 party vlog'] }
      ],
      'Netflix India': [
        { title: 'Watch Party Reaction Vlog', desc: 'Record authentic, funny reactions during the season finale release of our show.', niche: ['Entertainment', 'Comedy'], platforms: ['youtube'], budget: { min: 25000, max: 75000, currency: 'INR' }, req: { minFollowers: 15000, minEngagement: 6 }, del: ['1 reaction video'] },
        { title: 'Netflix Recommendation List', desc: 'Recommend 5 hidden gems/underrated series to watch this weekend.', niche: ['Entertainment', 'Lifestyle'], platforms: ['instagram', 'twitter'], budget: { min: 10000, max: 30000, currency: 'INR' }, req: { minFollowers: 5000, minEngagement: 5 }, del: ['1 carousel post', '1 thread'] },
        { title: 'Cosplay & Fan Art Showcase', desc: 'Dress up as characters from popular Netflix series and showcase the outfit transition.', niche: ['Art', 'Design', 'Fashion'], platforms: ['instagram', 'tiktok'], budget: { min: 20000, max: 60000, currency: 'INR' }, req: { minFollowers: 8000, minEngagement: 5.5 }, del: ['2 transition Reels'] }
      ]
    };

    console.log('⏳ Generating 2 to 4 campaigns for each brand...');

    for (const brand of brands) {
      const companyName = brand.brandProfile?.companyName;
      const templates = campaignTemplates[companyName] || [];
      // Ensure each brand gets 2 to 4 campaigns
      const count = Math.min(templates.length, Math.floor(Math.random() * 3) + 2); // random count 2, 3 or max templates

      for (let j = 0; j < count; j++) {
        const t = templates[j];
        const campaign = await Campaign.create({
          brandId: brand.id,
          title: t.title,
          description: t.desc,
          niche: t.niche,
          platforms: t.platforms,
          budget: t.budget,
          requirements: { minFollowers: t.req.minFollowers, minEngagement: t.req.minEngagement, location: ['India'] },
          deliverables: t.del,
          status: 'active',
          views: Math.floor(Math.random() * 200) + 50,
          isBoosted: j === 0,
          tags: t.niche.map(n => n.toLowerCase())
        });

        // Save references for linking the application objects
        if (brand.id === brand1.id && j === 0) campaign1 = campaign;
        if (brand.id === brand2.id && j === 0) campaign2 = campaign;
      }
    }
    console.log('✅ Campaigns created.');

    // Create Applications
    // Let MD (creators[0]) apply to campaign1
    const app1 = await Application.create({
      campaignId: campaign1.id,
      creatorId: creators[0].id,
      brandId: brand1.id,
      proposal: 'I would love to make an engaging productivity video showing a day in my life using your application.',
      proposedRate: 35000,
      deliverables: ['1 YouTube review video', '3 Instagram Reels'],
      timeline: '2 weeks',
      status: 'accepted',
      dealAmount: 35000
    });

    // Let manav (creators[4]) apply to campaign2
    const app2 = await Application.create({
      campaignId: campaign2.id,
      creatorId: creators[4].id,
      brandId: brand2.id,
      proposal: 'I will create stunning Reels displaying the outfit combinations for the Diwali season.',
      proposedRate: 20000,
      deliverables: ['2 Instagram posts', '5 Reels'],
      timeline: '10 days',
      status: 'completed',
      dealAmount: 20000,
      completedAt: new Date()
    });
    console.log('✅ Applications created.');

    // Create Payments
    await Payment.create({
      applicationId: app1.id,
      campaignId: campaign1.id,
      brandId: brand1.id,
      creatorId: creators[0].id,
      amount: 35000,
      platformFee: 3500,
      creatorAmount: 31500,
      status: 'held',
      paymentMethod: { type: 'card', last4: '1111' },
      paidAt: new Date(),
      heldAt: new Date()
    });

    await Payment.create({
      applicationId: app2.id,
      campaignId: campaign2.id,
      brandId: brand2.id,
      creatorId: creators[4].id,
      amount: 20000,
      platformFee: 2000,
      creatorAmount: 18000,
      status: 'released',
      paymentMethod: { type: 'upi', upiId: 'manav@okaxis' },
      paidAt: new Date(Date.now() - 86400000 * 2),
      heldAt: new Date(Date.now() - 86400000 * 2),
      releasedAt: new Date()
    });
    console.log('✅ Payments created.');

    console.log('\n🎉 Demo data seeded successfully!');
    console.log('\n📋 Demo Accounts (All Passwords are MD123456):');
    console.log('   Admin:   admin@demo.com');
    console.log('   Brands:  brand@demo.com, nike@demo.com, zomato@demo.com, adidas@demo.com, apple@demo.com, samsung@demo.com, puma@demo.com, boat@demo.com, netflix@demo.com');
    for (let i = 0; i < creatorNames.length; i++) {
      console.log(`   Creator: ${creatorNames[i].toLowerCase()}@demo.com`);
    }

  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await sequelize.close();
  }
}

seed();
