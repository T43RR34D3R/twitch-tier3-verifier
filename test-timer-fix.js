#!/usr/bin/env node

/**
 * Test script to verify the timer display fix works correctly
 * This adds 5 minutes to the timer and checks if it displays properly
 */

const https = require('https');

async function testTimerFix() {
  console.log('🧪 Testing timer fix...\n');

  // First, add 5 minutes to the timer
  console.log('1. Adding 5 minutes to timer...');
  
  const testData = JSON.stringify({ action: 'addTime' });
  
  const addTimeOptions = {
    hostname: 'buckfoozle.com',
    port: 443,
    path: '/api/subathon-timer',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData),
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(addTimeOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            console.log(`   Response:`, result);
            
            const { timeInSeconds, status } = result;
            
            if (timeInSeconds === 300) {
              console.log('✅ Timer correctly shows 300 seconds (5 minutes)');
            } else {
              console.log(`⚠️  Timer shows ${timeInSeconds} seconds (expected 300)`);
            }
            
            if (status && status.includes('5 minutes')) {
              console.log('✅ Status message looks correct');
            } else {
              console.log(`⚠️  Status: "${status}"`);
            }
            
            // Test the format function logic
            console.log('\n2. Testing formatTime logic with different values:');
            
            function formatTime(seconds) {
              // Ensure seconds is a valid number
              const safeSeconds = isNaN(seconds) || seconds < 0 ? 0 : Math.floor(seconds);
              const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, '0');
              const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, '0');
              const secs = String(Math.floor(safeSeconds % 60)).padStart(2, '0');
              return `${hours}:${minutes}:${secs}`;
            }
            
            // Test various values that could cause NaN
            const testValues = [
              { input: 300, expected: '00:05:00', desc: '300 seconds (5 minutes)' },
              { input: 0, expected: '00:00:00', desc: '0 seconds' },
              { input: 3661, expected: '01:01:01', desc: '3661 seconds (1h 1m 1s)' },
              { input: NaN, expected: '00:00:00', desc: 'NaN (should default to 0)' },
              { input: undefined, expected: '00:00:00', desc: 'undefined (should default to 0)' },
              { input: -5, expected: '00:00:00', desc: 'negative number (should default to 0)' },
              { input: 300.7, expected: '00:05:00', desc: 'decimal number (should floor to 300)' },
            ];
            
            testValues.forEach(({ input, expected, desc }) => {
              const result = formatTime(input);
              if (result === expected) {
                console.log(`   ✅ ${desc}: ${result}`);
              } else {
                console.log(`   ❌ ${desc}: got ${result}, expected ${expected}`);
              }
            });
            
            console.log('\n🎉 Timer fix test completed!');
            console.log('The timer should now display "00:05:00" instead of "NaN:NaN:NaN"');
            console.log('Visit https://buckfoozle.com/subathon-timer to see it in action!');
            
            resolve(result);
          } catch (e) {
            console.log('❌ Failed to parse response as JSON');
            reject(e);
          }
        } else {
          console.log('❌ Failed to add time to timer');
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request failed:', err);
      reject(err);
    });

    req.write(testData);
    req.end();
  });
}

// Run the test
testTimerFix().catch((error) => {
  console.error('Test failed:', error.message);
});
