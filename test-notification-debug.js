import fetch from 'node-fetch';

console.log('🔍 Testing LINE Notification Debug...\n');

// Test the notify-line endpoint to see what's happening
async function testNotification() {
  try {
    const testMessage = {
      message: "🧪 TEST NOTIFICATION\n\n👤 Driver: Test Driver\n📅 Date: 1/8/2568\n🕒 Clock In: 08:00\n🕔 Clock Out: 18:00\n💬 Comments: Test notification\n\n📊 Google Sheets updated\n\n📄 View in Google Sheets:\nhttps://docs.google.com/spreadsheets/d/1_ObqjB3eMOgbKmf3xvzQHeCttjyAUIn5meiu4nT0z34/edit",
      env: 'prod'
    };

    console.log('📤 Sending test notification to production...');
    console.log('Message:', testMessage.message);
    
    const response = await fetch('https://liff-ot-app-positive.herokuapp.com/notify-line', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage),
    });

    const result = await response.json();
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response:', result);
    
    if (response.ok) {
      console.log('✅ Notification sent successfully');
    } else {
      console.log('❌ Notification failed');
    }
    
  } catch (error) {
    console.error('❌ Error testing notification:', error.message);
  }
}

// Test the endpoint
testNotification();

console.log('\n🎯 Potential causes of double notifications:');
console.log('1. Frontend sends notification when form is submitted');
console.log('2. Backend might send another notification for the same event');
console.log('3. Google Apps Script might be triggered automatically');
console.log('4. Multiple form submissions due to user double-clicking');
console.log('\n💡 Solutions:');
console.log('1. Add notification deduplication logic');
console.log('2. Disable one of the notification sources');
console.log('3. Add request throttling');
console.log('4. Add unique identifiers to prevent duplicates'); 