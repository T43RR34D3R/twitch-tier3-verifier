// Test script for analytics collection
// Run with: node scripts/test-analytics.js

async function testAnalyticsCollection() {
  try {
    console.log('Testing analytics collection...')
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-app.vercel.app' 
      : 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/collect-analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Analytics collection successful!')
      console.log('Response:', result)
    } else {
      console.log('❌ Analytics collection failed!')
      console.log('Error:', result)
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testAnalyticsCollection()
