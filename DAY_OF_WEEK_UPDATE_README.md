# Day of Week Column Update Scripts

These scripts will add a "Day of Week" column to your production Google Sheet and calculate the days based on dates in column B.

## 📁 Files Created

1. **`update-prod-sheet-day-of-week.js`** - Updates ALL sheets in production spreadsheet
2. **`update-sheet-day-of-week-simple.js`** - Updates ONE specific sheet
3. **`DAY_OF_WEEK_UPDATE_README.md`** - This instruction file

## 🚀 Quick Start (Recommended)

Use the simple script to update one sheet at a time:

```bash
node update-sheet-day-of-week-simple.js [SPREADSHEET_ID] [SHEET_NAME]
```

### Example:
```bash
node update-sheet-day-of-week-simple.js 1ABC123DEF456 "September 2024 Attendance"
```

## 📋 Prerequisites

1. **Google Credentials**: Make sure `google-credentials.json` is in the project root
2. **Environment Variables**: `VITE_GOOGLE_SHEET_ID_PROD` should be set (for the full script)
3. **Node.js**: Scripts use ES modules, ensure Node.js version supports them

## 🔧 What the Scripts Do

### 1. Check Current Structure
- Reads the first row to see current headers
- Checks if "Day of Week" column already exists

### 2. Add Column (if needed)
- Inserts a new column C with header "Day of Week"
- Shifts existing columns D-K to the right

### 3. Calculate Days
- Reads dates from column B (Thai format: DD/MM/YYYY)
- Converts Thai years to Gregorian years (subtract 543)
- Calculates day of week in Thai (จันทร์, อังคาร, พุธ, etc.)
- Updates column C with calculated Thai day values

### 4. Batch Update
- Updates all rows in one efficient batch operation
- Shows progress and sample calculations

## 📊 Expected Results

### Before:
```
A: Driver Name | B: Date      | C: Clock In | D: Clock Out | ...
Jean          | 15/9/2568    | 08:00       | 17:30       | ...
```

### After:
```
A: Driver Name | B: Date      | C: Day of Week | D: Clock In | E: Clock Out | ...
Jean          | 15/9/2568    | จันทร์         | 08:00       | 17:30       | ...
```

## 🛡️ Safety Features

- **Non-destructive**: Only adds columns, doesn't modify existing data
- **Error handling**: Skips invalid dates gracefully
- **Validation**: Checks sheet existence and permissions
- **Logging**: Detailed progress and error messages

## 🔍 Troubleshooting

### "Unable to parse range"
- Check that the sheet name is exactly correct
- Sheet names are case-sensitive

### "Permission denied"
- Ensure your Google credentials have edit access to the spreadsheet
- Check that `google-credentials.json` is valid

### "Invalid Thai date format"
- Script will log these and continue with other rows
- Common issue: dates not in DD/MM/YYYY format

## 📝 Sample Output

```
🚀 Starting Day of Week column update...
📊 Spreadsheet ID: 1ABC123DEF456
📋 Sheet Name: "September 2024 Attendance"
📋 Current headers: Driver Name | Date | Clock In | Clock Out | ...
🔧 Adding Day of Week column...
✅ Added Day of Week column header
📊 Found 25 total rows
📅 15/9/2568 -> จันทร์
📅 16/9/2568 -> อังคาร
📅 17/9/2568 -> พุธ
🔄 Updating 25 Day of Week values...
✅ Successfully updated all Day of Week values!
🎉 Sheet update completed!
```

## 🎯 Next Steps

After running the script:
1. Verify the "Day of Week" column appears in your Google Sheet
2. Check that the calculated days look correct
3. Your app will now automatically detect the new structure
4. The Day of Week will be stored in Thai and displayed appropriately based on user language

## ⚠️ Important Notes

- **Backup**: Consider making a copy of your sheet before running
- **Test First**: Try on a small test sheet first if possible
- **Production**: The full script (`update-prod-sheet-day-of-week.js`) will update ALL sheets in your production spreadsheet
- **One at a Time**: The simple script is safer for updating individual sheets
