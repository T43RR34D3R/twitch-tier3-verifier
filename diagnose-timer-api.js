#!/usr/bin/env node

/**
 * Comprehensive test to diagnose timer API issues
 */

const https = require('https');

async function testApiCall(description, options) {
  console.log(`\n🧪 Testing: ${description}`);
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.request(options, (res) => {
      const duration = Date.now() - startTime;
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`   Status: ${res.statusCode} (${duration}ms)`);
        console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
        
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log(`   ✅ Valid JSON response:`, parsed);
            resolve({ success: true, data: parsed, status: res.statusCode });
          } catch (e) {
            console.log(`   ❌ Invalid JSON:`, data);
            resolve({ success: false, error: 'Invalid JSON', rawData: data });
          }
        } else {
          console.log(`   ❌ HTTP Error: ${data}`);
          resolve({ success: false, error: `HTTP ${res.statusCode}`, rawData: data });
        }
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      console.log(`   ❌ Network Error (${duration}ms):`, err.message);
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      console.log(`   ❌ Timeout (${duration}ms)`);
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.setTimeout(10000); // 10 second timeout
    req.end();
  });
}

async function runDiagnostics() {
  console.log('🔍 Diagnosing timer API issues...');
  
  // Test 1: Basic GET request
  const getResult = await testApiCall('GET /api/subathon-timer', {
    hostname: 'buckfoozle.com',
    port: 443,
    path: '/api/subathon-timer',
    method: 'GET',
    headers: {
      'User-Agent': 'Timer-Diagnostic-Tool/1.0',
      'Accept': 'application/json',
    }
  });

  // Test 2: POST request (add time)
  const postBody = JSON.stringify({ action: 'addTime' });
  const postResult = await testApiCall('POST /api/subathon-timer (addTime)', {
    hostname: 'buckfoozle.com',
    port: 443,
    path: '/api/subathon-timer',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postBody),
      'User-Agent': 'Timer-Diagnostic-Tool/1.0',
      'Accept': 'application/json',
    },
    body: postBody
  });

  // Test 3: Check if there are any CORS issues by testing from different origins
  const corsResult = await testApiCall('GET /api/subathon-timer (with origin)', {
    hostname: 'buckfoozle.com',
    port: 443,
    path: '/api/subathon-timer',
    method: 'GET',
    headers: {
      'Origin': 'https://buckfoozle.com',
      'User-Agent': 'Timer-Diagnostic-Tool/1.0',
      'Accept': 'application/json',
    }
  });

  // Summary
  console.log('\n📋 Diagnostic Summary:');
  console.log(`   GET request: ${getResult.success ? '✅ Working' : '❌ Failed - ' + getResult.error}`);
  console.log(`   POST request: ${postResult.success ? '✅ Working' : '❌ Failed - ' + postResult.error}`);
  console.log(`   CORS test: ${corsResult.success ? '✅ Working' : '❌ Failed - ' + corsResult.error}`);

  if (getResult.success && getResult.data) {
    const { timeInSeconds, isRunning, status } = getResult.data;
    console.log('\n⚙️ Timer State:');
    console.log(`   Time: ${timeInSeconds} seconds (${Math.floor(timeInSeconds/60)}:${(timeInSeconds%60).toString().padStart(2,'0')})`);
    console.log(`   Running: ${isRunning}`);
    console.log(`   Status: "${status}"`);
  }

  if (!getResult.success) {
    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('1. Check if the server is running and deployed');
    console.log('2. Verify the API route exists at /api/subathon-timer');
    console.log('3. Check server logs for errors');
    console.log('4. Ensure database connection is working');
    console.log('5. Test from browser developer tools: fetch("/api/subathon-timer")');
  }
}

runDiagnostics().catch(console.error);
