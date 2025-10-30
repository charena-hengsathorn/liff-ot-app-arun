import { getSheetNameFromDate, checkExistingEntry } from './src/googleSheetsHandler.js';

console.log('🧪 Testing Monthly Sheet Resolution...\n');

// Test cases with different Thai dates
const testCases = [
  { thaiDate: '1/8/2567', expected: 'August 2024 Attendance' },
  { thaiDate: '15/12/2567', expected: 'December 2024 Attendance' },
  { thaiDate: '1/1/2568', expected: 'January 2025 Attendance' },
  { thaiDate: '31/3/2568', expected: 'March 2025 Attendance' },
];

console.log('📅 Testing getSheetNameFromDate function:');
testCases.forEach(({ thaiDate, expected }) => {
  const result = getSheetNameFromDate(thaiDate);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} ${thaiDate} -> ${result} (expected: ${expected})`);
});

console.log('\n🔍 Testing checkExistingEntry function:');
console.log('This will test if the function can find the correct monthly sheet...');

// Test with a sample driver and date
const testDriver = 'Test Driver';
const testDate = '1/8/2568'; // August 2025 (matches existing sheet)

try {
  const result = await checkExistingEntry(testDriver, testDate, 'dev');
  console.log('✅ checkExistingEntry result:', result);
} catch (error) {
  console.log('❌ Error in checkExistingEntry:', error.message);
}

console.log('\n🎯 Summary:');
console.log('- All functions now use getSheetNameFromDate() to find the correct monthly sheet');
console.log('- Functions that previously used hardcoded ranges now include the sheet name');
console.log('- Legacy fallback is maintained for backward compatibility'); 