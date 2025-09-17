#!/usr/bin/env node

/**
 * Check current EventSub subscription status for buckfoozle channel
 * This helps us see if subscriptions are already set up or need to be created
 */

const https = require('https');

async function checkEventSubStatus() {
  console.log('🔍 Checking current EventSub subscription status...\n');

  // Try to get the current status from the management endpoint
  const options = {
    hostname: 'buckfoozle.com',
    port: 443,
    path: '/api/twitch/eventsub-manage',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Response:', data);
        
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            if (result.success && result.subscriptions) {
              console.log(`\n✅ Found ${result.subscriptions.length} EventSub subscriptions:`);
              
              result.subscriptions.forEach((sub, index) => {
                console.log(`${index + 1}. ${sub.type} - Status: ${sub.status}`);
              });

              const requiredTypes = [
                'channel.subscribe',
                'channel.subscription.gift', 
                'channel.subscription.message',
                'channel.follow',
                'channel.cheer',
                'channel.raid'
              ];

              console.log('\n📋 Required subscriptions check:');
              requiredTypes.forEach(type => {
                const exists = result.subscriptions.some(sub => sub.type === type);
                console.log(`${exists ? '✅' : '❌'} ${type}`);
              });

              if (result.subscriptions.length === 0) {
                console.log('\n🔴 No EventSub subscriptions found. Buck needs to run Setup EventSub!');
              } else if (result.subscriptions.some(sub => sub.status !== 'enabled')) {
                console.log('\n🟡 Some subscriptions are not enabled. May need to recreate them.');
              } else {
                console.log('\n🟢 EventSub subscriptions appear to be set up correctly!');
              }
            }
            resolve(result);
          } catch (e) {
            console.log('\n❌ Failed to parse response as JSON');
            reject(e);
          }
        } else if (res.statusCode === 401) {
          console.log('\n🔐 Authentication required - Buck needs to be logged in to check EventSub status');
          console.log('This means Buck must click "Setup EventSub" from the settings page while logged in.');
          resolve({ requiresAuth: true });
        } else {
          console.log('\n❌ Failed to check EventSub status');
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request failed:', err);
      reject(err);
    });

    req.end();
  });
}

// Run the check
checkEventSubStatus()
  .then(() => {
    console.log('\n💡 Next steps:');
    console.log('1. Buck should log in to https://buckfoozle.com');
    console.log('2. Go to https://buckfoozle.com/subathon-settings'); 
    console.log('3. Click "🚀 Setup EventSub" in the webhooks section');
    console.log('4. Test with a real subscription or the simulation buttons');
  })
  .catch((error) => {
    console.error('Error:', error.message);
  });
