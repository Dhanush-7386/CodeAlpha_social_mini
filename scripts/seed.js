require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const https = require('https');

const User = require('../models/User');
const Post = require('../models/Post');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/socialmini';

const indianPosts = [
  { caption: '🏏 What a match! India wins the World Cup! The entire nation celebrates as the Men in Blue lift the trophy. #IndiaWins #Cricket #WorldCup 🇮🇳🏆', seed: 101 },
  { caption: '🎬 Shah Rukh Khan returns with a blockbuster! Jawan breaks all box office records in the first week. Bollywood is alive and thriving! #Jawan #SRK #Bollywood', seed: 102 },
  { caption: '🕌 The beauty of Taj Mahal at sunrise is something everyone should witness at least once. Incredible India! ✨ #TajMahal #IncredibleIndia #Travel', seed: 103 },
  { caption: '🍛 Nothing beats a plate of authentic Hyderabadi Biryani on a rainy evening. The aroma, the spices, the dum — perfection! 😋 #Biryani #IndianFood #Foodie', seed: 104 },
  { caption: '🎵 AR Rahman\'s latest composition is pure magic. The man never fails to create goosebumps! 🎶 #ARRahman #IndianMusic #Oscar', seed: 105 },
  { caption: '🏏 Virat Kohli scores his 50th ODI century! King Kohli is back in form and the stadiums are roaring! 👑 #ViratKohli #CricketFever #Legend', seed: 106 },
  { caption: '🎭 RRR wins at the Golden Globes! Indian cinema is finally getting the global recognition it deserves. Proud moment! 🇮🇳 #RRR #Tollywood #NaatuNaatu', seed: 107 },
  { caption: '🌅 Sunset at Marine Drive, Mumbai. The Queen\'s Necklace never fails to take your breath away. This city has my heart ❤️ #Mumbai #MarineDrive #CityOfDreams', seed: 108 },
  { caption: '📱 India\'s tech startup ecosystem is booming! Another Indian unicorn just crossed $10B valuation. The future is digital 🚀 #StartupIndia #Tech #Innovation', seed: 109 },
  { caption: '🎪 Diwali celebrations across India — the festival of lights never gets old! Sweets, diyas, family, and fireworks 🪔✨ #Diwali #FestivalOfLights #Indian', seed: 110 },
  { caption: '🏔️ The breathtaking views from Ladakh — where the mountains meet the sky. Road trip of a lifetime! 🏍️ #Ladakh #RoadTrip #Himalayas #Adventure', seed: 111 },
  { caption: '💃 Pushpa 2 creates history! Allu Arjun proves once again why he is the Icon Star. "Thaggede Le!" 🔥 #Pushpa2 #AlluArjun #TheRule #Blockbuster', seed: 112 },
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }
    }).on('error', reject);
  });
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Create uploads directory
    const postsDir = path.join(__dirname, '..', 'uploads', 'posts');
    fs.mkdirSync(postsDir, { recursive: true });

    // Check if seed user already exists
    let seedUser = await User.findOne({ username: 'socialmini_official' });
    if (!seedUser) {
      seedUser = await User.create({
        username: 'socialmini_official',
        email: 'official@socialmini.app',
        password: 'Demo@123',
        bio: '📸 Official SocialMini Account | Indian Content 🇮🇳',
        isVerified: true,
        twoFactorEnabled: false,
      });
      console.log('👤 Created seed user: socialmini_official');
    } else {
      console.log('👤 Seed user already exists');
    }

    // Create additional Indian users
    const usernames = ['cricket_fever_india', 'bollywood_buzz', 'desi_foodie_official'];
    const users = [seedUser];
    
    for (const uname of usernames) {
      let u = await User.findOne({ username: uname });
      if (!u) {
        u = await User.create({
          username: uname,
          email: `${uname}@socialmini.app`,
          password: 'Demo@123',
          bio: `🇮🇳 Indian content creator on SocialMini`,
          isVerified: true,
          twoFactorEnabled: false,
        });
        console.log(`👤 Created user: ${uname}`);
      }
      users.push(u);
    }

    // Download images and create posts
    console.log('\n📸 Creating Indian-themed posts...');
    for (let i = 0; i < indianPosts.length; i++) {
      const post = indianPosts[i];
      const filename = `seed-${Date.now()}-${i}.jpg`;
      const filepath = path.join(postsDir, filename);
      const imageUrl = `https://picsum.photos/seed/${post.seed}/800/800`;

      try {
        console.log(`  Downloading image ${i + 1}/12...`);
        await downloadImage(imageUrl, filepath);
        
        const author = users[i % users.length];
        await Post.create({
          author: author._id,
          caption: post.caption,
          image: `/uploads/posts/${filename}`,
        });
        console.log(`  ✅ Post ${i + 1}: ${post.caption.substring(0, 50)}...`);
      } catch (err) {
        console.warn(`  ⚠️  Failed to create post ${i + 1}: ${err.message}`);
      }
    }

    console.log('\n🎉 Seed complete!');
    console.log(`   ${users.length} users created`);
    console.log(`   ${indianPosts.length} posts created`);
    console.log('\n   Demo login: official@socialmini.app / Demo@123');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
