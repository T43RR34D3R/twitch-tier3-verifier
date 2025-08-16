const { execSync } = require('child_process');

// Get the current Railway environment variables
const vars = execSync('railway variables --json', { encoding: 'utf8' });
const envVars = JSON.parse(vars);

const twitchClientId = envVars.TWITCH_CLIENT_ID;
const twitchClientSecret = envVars.TWITCH_CLIENT_SECRET;

console.log('Refreshing IGDB access token...');
console.log('Twitch Client ID:', twitchClientId);
console.log('Twitch Client Secret:', twitchClientSecret ? `${twitchClientSecret.substring(0, 8)}...` : 'Not set');

async function refreshIGDBToken() {
  try {
    // Step 1: Get a new access token from Twitch
    console.log('\nStep 1: Requesting new access token from Twitch...');
    
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: twitchClientId,
        client_secret: twitchClientSecret,
        grant_type: 'client_credentials'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to get access token:', response.status, errorText);
      return;
    }

    const tokenData = await response.json();
    console.log('✅ New access token obtained!');
    console.log('Token:', `${tokenData.access_token.substring(0, 8)}...`);
    console.log('Expires in:', tokenData.expires_in, 'seconds');

    // Step 2: Test the new token with IGDB API
    console.log('\nStep 2: Testing new token with IGDB API...');
    
    const testResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': twitchClientId,
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'text/plain'
      },
      body: `
        search "minecraft";
        fields name,summary;
        limit 1;
      `
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('❌ New token test failed:', testResponse.status, errorText);
      return;
    }

    const testData = await testResponse.json();
    console.log('✅ New token works with IGDB API!');
    console.log('Sample response:', JSON.stringify(testData, null, 2));

    // Step 3: Update Railway environment variables
    console.log('\nStep 3: Updating Railway environment variables...');
    
    try {
      execSync(`railway variables --set "IGDB_ACCESS_TOKEN=${tokenData.access_token}"`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('✅ IGDB_ACCESS_TOKEN updated in Railway!');
      
      // Also update the Client ID to match (in case it was different)
      execSync(`railway variables --set "IGDB_CLIENT_ID=${twitchClientId}"`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('✅ IGDB_CLIENT_ID updated in Railway!');
      
      console.log('\n🎉 IGDB token refresh completed successfully!');
      console.log('The application should now be able to search for games again.');
      console.log('Railway will automatically redeploy with the new environment variables.');
      
    } catch (railwayError) {
      console.error('❌ Failed to update Railway variables:', railwayError.message);
      console.log('\n📝 Manual update needed:');
      console.log(`railway variables --set "IGDB_ACCESS_TOKEN=${tokenData.access_token}"`);
      console.log(`railway variables --set "IGDB_CLIENT_ID=${twitchClientId}"`);
    }

  } catch (error) {
    console.error('❌ Error refreshing IGDB token:', error.message);
  }
}

if (!twitchClientId || !twitchClientSecret) {
  console.error('❌ Missing Twitch credentials! Need TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET');
  process.exit(1);
}

refreshIGDBToken();
