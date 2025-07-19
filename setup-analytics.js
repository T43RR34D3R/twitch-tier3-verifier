#!/usr/bin/env node

// Setup script for daily analytics collection
console.log('🚀 Setting up Daily Analytics Collection...\n')

const instructions = [
  '1. 📊 UPDATE DATABASE',
  '   • Go to your Supabase Dashboard → SQL Editor',
  '   • Copy and paste the content from: migrations/001_add_user_tokens.sql', 
  '   • Click "Run" to create the user_tokens table and set up permissions',
  '',
  '2. 🔑 STORE USER TOKENS', 
  '   • Have Buckfoozle sign in to the app (/auth/signin)',
  '   • This automatically stores his tokens in the database for daily collection',
  '',
  '3. 🧪 TEST COLLECTION',
  '   • Start your dev server: npm run dev',
  '   • Run test: node scripts/test-analytics.js',
  '   • Or manually POST to: http://localhost:3000/api/collect-analytics',
  '',
  '4. ⚡ SET UP AUTOMATION',
  '   Choose one option:',
  '',
  '   Option A: Vercel Cron (Recommended)',
  '   • Create/update vercel.json:',
  '   {',
  '     "crons": [',
  '       {',
  '         "path": "/api/collect-analytics",',
  '         "schedule": "0 12 * * *"',
  '       }',
  '     ]',
  '   }',
  '',
  '   Option B: GitHub Actions',
  '   • Create .github/workflows/daily-analytics.yml',
  '   • See DAILY_ANALYTICS_SETUP.md for full example',
  '',
  '   Option C: External Cron Service',
  '   • Use cron-job.org, EasyCron, etc.',
  '   • Set to POST: https://your-app.vercel.app/api/collect-analytics',
  '',
  '5. 📈 VERIFY IT WORKS',
  '   • Go to /analytics in your app',
  '   • Should see real subscriber data immediately', 
  '   • Historical charts will build up over the coming days',
  '',
  '✅ Benefits:',
  '   • No more empty subscription data',
  '   • Real-time tier breakdown (T1, T2, T3)',
  '   • Complete subscriber list with usernames',
  '   • Historical growth tracking',
  '   • Runs automatically without user interaction',
  '',
  '🔧 Files Created:',
  '   • migrations/001_add_user_tokens.sql (database schema)',
  '   • src/lib/data-collector.ts (collection logic)', 
  '   • src/app/api/collect-analytics/route.ts (API endpoint)',
  '   • scripts/test-analytics.js (testing)',
  '   • DAILY_ANALYTICS_SETUP.md (full documentation)',
  '',
  '📚 Need help? Check DAILY_ANALYTICS_SETUP.md for detailed instructions!'
]

instructions.forEach(line => console.log(line))

console.log('\n🎉 Ready to set up! Start with step 1 above.')
console.log('💡 Tip: The system will work immediately for current data, and historical trends will build up over time.')
