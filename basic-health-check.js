#!/usr/bin/env node

/**
 * Basic Health Check - Minimal System Test
 * 
 * This script verifies the most basic functionality without external dependencies
 * Following ground-up approach from verification framework
 */

console.log('🏥 Senior Care System - Basic Health Check');
console.log('================================================');

// 1. Node.js Environment Check
console.log('✅ Node.js Version:', process.version);
console.log('✅ Platform:', process.platform);
console.log('✅ Working Directory:', process.cwd());

// 2. Package Dependencies Check
try {
  const packageJson = require('./package.json');
  console.log('✅ Package Name:', packageJson.name);
  console.log('✅ Version:', packageJson.version);
  console.log('✅ Dependencies Loaded:', Object.keys(packageJson.dependencies).length);
} catch (error) {
  console.log('❌ Package.json Error:', error.message);
}

// 3. File System Check
const fs = require('fs');
const path = require('path');

const criticalPaths = [
  '.claude',
  '.claude/agents',
  'actual-execution',
  'package.json'
];

console.log('\n📁 File System Check:');
criticalPaths.forEach(pathToCheck => {
  if (fs.existsSync(pathToCheck)) {
    const stats = fs.statSync(pathToCheck);
    const type = stats.isDirectory() ? 'DIR' : 'FILE';
    console.log(`✅ ${type}: ${pathToCheck}`);
  } else {
    console.log(`❌ MISSING: ${pathToCheck}`);
  }
});

// 4. Environment Configuration Check
console.log('\n🔧 Environment Check:');
const envFile = '.env';
if (fs.existsSync(envFile)) {
  console.log('✅ Environment file exists');
} else {
  console.log('⚠️  No .env file (expected for first run)');
  console.log('   Copy .env.example to .env and configure it');
}

// 5. Claude Agents Check
console.log('\n🤖 Claude Agents Check:');
try {
  const agentsDir = '.claude/agents';
  const agents = fs.readdirSync(agentsDir).filter(file => file.endsWith('.md'));
  console.log(`✅ Found ${agents.length} agent configurations:`);
  agents.forEach(agent => {
    console.log(`   - ${agent.replace('.md', '')}`);
  });
} catch (error) {
  console.log('❌ Agents Directory Error:', error.message);
}

// 6. Basic Module Loading Test
console.log('\n📦 Module Loading Test:');
try {
  require('express');
  console.log('✅ Express loaded');
} catch (error) {
  console.log('❌ Express loading failed:', error.message);
}

try {
  require('@supabase/supabase-js');
  console.log('✅ Supabase client loaded');
} catch (error) {
  console.log('❌ Supabase client loading failed:', error.message);
}

console.log('\n================================================');
console.log('🎯 System Status Summary:');

// Simple readiness assessment
const hasNodeJs = true;
const hasPackageJson = fs.existsSync('package.json');
const hasAgents = fs.existsSync('.claude/agents');
const hasExecutionDir = fs.existsSync('actual-execution');

const readinessScore = [hasNodeJs, hasPackageJson, hasAgents, hasExecutionDir]
  .filter(Boolean).length;

if (readinessScore === 4) {
  console.log('✅ BASIC SYSTEM READY');
  console.log('   Next: Configure .env file for database connection');
} else {
  console.log('⚠️  SYSTEM INCOMPLETE');
  console.log(`   Readiness: ${readinessScore}/4 components`);
}

console.log('\n🚀 Next Steps:');
console.log('1. cp .env.example .env');
console.log('2. Edit .env with your Supabase credentials');
console.log('3. node basic-health-check.js (run this again)');
console.log('4. npm start (once database is configured)');

console.log('\n📞 This health check completed successfully!');