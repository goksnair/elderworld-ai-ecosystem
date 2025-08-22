# Step-by-Step Setup Guide

## Step 1: Create Supabase Project

1. **Go to Supabase**: Visit [supabase.com](https://supabase.com)
2. **Sign Up/Login**: Create account or login
3. **Create New Project**: 
   - Click "New project"
   - Organization: Personal (or create new)
   - Name: `senior-care-ai-ecosystem`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to your location
   - Pricing: Start with Free tier

4. **Wait for Setup**: Project creation takes 2-3 minutes

## Step 2: Get Project Credentials

Once your project is ready:

1. **Go to Settings**: Click gear icon → Settings
2. **API Section**: Go to Settings → API
3. **Copy These Values**:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Project API Key (anon/public)**: `eyJ...` (long string)

## Step 3: Set Environment Variables

Run these commands with YOUR actual values:

```bash
# Replace with your actual Supabase URL
export SUPABASE_URL="https://your-project-ref.supabase.co"

# Replace with your actual anon key  
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Verify they're set
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

## Step 4: Create Database Schema

```bash
# If you have psql installed locally
psql $SUPABASE_URL -f supabase-setup.sql

# OR use Supabase web interface:
# 1. Go to your project dashboard
# 2. Click "SQL Editor" in sidebar
# 3. Copy contents of supabase-setup.sql
# 4. Paste and run the query
```

## Step 5: Test Connection

```bash
# This should work now with real credentials
npm test
```

## Step 6: Start Dashboard

```bash
npm run start-dashboard
# Should start on http://localhost:3001
```

---

**🚨 IMPORTANT**: Never commit your actual Supabase credentials to version control!

Create a `.env` file for permanent storage:
```bash
echo "SUPABASE_URL=$SUPABASE_URL" > .env
echo "SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> .env
```