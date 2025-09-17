#!/usr/bin/env node

/**
 * Test script to simulate a Twitch subscription event for subathon timer testing
 * This helps diagnose if the webhook endpoint is working correctly
 */

const https = require('https');

// Simulate a Twitch subscription event
const testEvent = {
  subscription: {
    id: 'f1c2a387-161a-49f9-a165-0f21d7a4e1c4',
    status: 'enabled',
    type: 'channel.subscribe',
    version: '1',
    condition: {
      broadcaster_user_id: '269187200'  // BuckFoozle's user ID
    },
    transport: {
      method: 'webhook',
      callback: 'https://buckfoozle.com/api/twitch/eventsub'
    },
    created_at: '2023-01-01T00:00:00.000000000Z'
  },
  event: {
    user_id: '123456789',
    user_login: 'testuser',
    user_name: 'TestUser',
    broadcaster_user_id: '269187200',
    broadcaster_user_login: 'buckfoozle',
    broadcaster_user_name: 'BuckFoozle',
    tier: '1000',
    is_gift: false
  }
};

const testData = JSON.stringify(testEvent);

const options = {
  hostname: 'buckfoozle.com',
  port: 443,
  path: '/api/twitch/eventsub',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData),
    'Twitch-Eventsub-Message-Type': 'notification',
    'Twitch-Eventsub-Message-Id': 'sim-' + Date.now(),
    'Twitch-Eventsub-Message-Timestamp': new Date().toISOString(),
    // Omitting signature for simulated test - the code handles this
  }
};

console.log('Testing subathon webhook with simulated subscription event...');
console.log('Event data:', JSON.stringify(testEvent, null, 2));

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response body:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ Webhook test successful!');
      console.log('The subscription event should have added 5 minutes to the subathon timer.');
      console.log('Check the timer at https://buckfoozle.com/api/subathon-timer');
    } else {
      console.log('❌ Webhook test failed!');
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Request failed:', err);
});

req.write(testData);
req.end();
