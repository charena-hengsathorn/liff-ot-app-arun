#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Read local .env file
function readLocalEnv() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#')) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.log('No .env file found. Please create one first.');
    return {};
  }
}

// Sync to Vercel
function syncToVercel(envVars) {
  console.log('🔄 Syncing to Vercel...');
  
  Object.entries(envVars).forEach(([key, value]) => {
    if (key.startsWith('VITE_')) {
      try {
        execSync(`vercel env add ${key} production`, { 
          input: value + '\n',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(`✅ Added ${key} to Vercel`);
      } catch (error) {
        console.log(`⚠️  ${key} might already exist in Vercel`);
      }
    }
  });
}

// Sync to Heroku
function syncToHeroku(envVars) {
  console.log('🔄 Syncing to Heroku...');
  
  const herokuVars = {};
  Object.entries(envVars).forEach(([key, value]) => {
    if (!key.startsWith('VITE_')) {
      herokuVars[key] = value;
    }
  });
  
  if (Object.keys(herokuVars).length > 0) {
    const configString = Object.entries(herokuVars)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');
    
    try {
      execSync(`heroku config:set ${configString}`);
      console.log('✅ Synced environment variables to Heroku');
    } catch (error) {
      console.log('❌ Error syncing to Heroku:', error.message);
    }
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const envVars = readLocalEnv();
  
  if (Object.keys(envVars).length === 0) {
    console.log('❌ No environment variables found. Please create a .env file first.');
    return;
  }
  
  if (args.includes('--vercel') || args.includes('--all')) {
    syncToVercel(envVars);
  }
  
  if (args.includes('--heroku') || args.includes('--all')) {
    syncToHeroku(envVars);
  }
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node sync-env.js --vercel    # Sync to Vercel only');
    console.log('  node sync-env.js --heroku    # Sync to Heroku only');
    console.log('  node sync-env.js --all       # Sync to both');
  }
}

main(); 