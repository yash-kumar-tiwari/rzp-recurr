/**
 * Seed Script: Creates Razorpay plans and saves them to MongoDB.
 *
 * Run with: npm run seed
 *
 * This script:
 * 1. Connects to MongoDB
 * 2. Creates 3 plans on Razorpay (Basic, Pro, Enterprise)
 * 3. Upserts them into the Plan collection
 *
 * IMPORTANT: You need valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Plan = require('../models/Plan');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS_CONFIG = [
  {
    name: 'Basic',
    slug: 'basic',
    description: 'Perfect for individuals and small projects',
    price: 299,           // INR per month (display)
    amountInPaise: 29900, // Razorpay uses paise
    sortOrder: 1,
    features: [
      '5 Projects',
      '10 GB Storage',
      'Email Support',
      'API Access',
      'Basic Analytics',
    ],
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'Ideal for growing teams and businesses',
    price: 799,
    amountInPaise: 79900,
    sortOrder: 2,
    features: [
      'Unlimited Projects',
      '100 GB Storage',
      'Priority Support',
      'Advanced Analytics',
      'Team Collaboration',
      'Custom Integrations',
    ],
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'For large organizations with advanced needs',
    price: 1999,
    amountInPaise: 199900,
    sortOrder: 3,
    features: [
      'Unlimited Everything',
      '1 TB Storage',
      '24/7 Dedicated Support',
      'Custom Reporting',
      'SSO & Advanced Security',
      'SLA Guarantee',
      'Onboarding & Training',
    ],
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    for (const config of PLANS_CONFIG) {
      console.log(`\n🔄 Creating Razorpay plan: ${config.name}...`);

      // Create plan on Razorpay
      const razorpayPlan = await razorpay.plans.create({
        period: 'monthly',
        interval: 1,
        item: {
          name: `${config.name} Plan`,
          amount: config.amountInPaise,
          currency: 'INR',
          description: config.description,
        },
        notes: {
          slug: config.slug,
        },
      });

      console.log(`  ✅ Razorpay plan created: ${razorpayPlan.id}`);

      // Upsert into MongoDB
      await Plan.findOneAndUpdate(
        { slug: config.slug },
        {
          name: config.name,
          slug: config.slug,
          description: config.description,
          price: config.price,
          currency: 'INR',
          interval: 'monthly',
          period: 'monthly',
          features: config.features,
          razorpayPlanId: razorpayPlan.id,
          isActive: true,
          sortOrder: config.sortOrder,
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Plan saved to MongoDB: ${config.slug}`);
    }

    console.log('\n🎉 Seeding complete! All 3 plans are ready.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    if (error.error) {
      console.error('Razorpay error:', JSON.stringify(error.error, null, 2));
    }
    process.exit(1);
  }
};

seed();
