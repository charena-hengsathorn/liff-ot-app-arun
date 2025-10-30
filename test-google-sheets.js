import { handleGoogleSheetsRequest } from './src/googleSheetsHandler.js';

// Test function
async function testGoogleSheets() {
  console.log('🧪 Testing Google Sheets API...\n');

  try {
    // Test 1: Check existing entry
    console.log('1️⃣ Testing checkExisting...');
    const checkResult = await handleGoogleSheetsRequest({
      action: 'checkExisting',
      driverName: 'Test Driver',
      thaiDate: '06/01/2568',
      env: 'dev'
    });
    console.log('✅ Check existing result:', checkResult);

    // Test 2: Submit with clock times
    console.log('\n2️⃣ Testing submitWithClockTimes...');
    const submitResult = await handleGoogleSheetsRequest({
      action: 'submitWithClockTimes',
      driverName: 'Test Driver',
      thaiDate: '06/01/2568',
      clockIn: '08:30',
      clockOut: '17:30',
      comments: 'Test submission via Google Sheets API',
      env: 'dev',
      isAutoSubmitted: false
    });
    console.log('✅ Submit result:', submitResult);

    // Test 3: Check existing again
    console.log('\n3️⃣ Testing checkExisting again...');
    const checkResult2 = await handleGoogleSheetsRequest({
      action: 'checkExisting',
      driverName: 'Test Driver',
      thaiDate: '06/01/2568',
      env: 'dev'
    });
    console.log('✅ Check existing result:', checkResult2);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testGoogleSheets(); 