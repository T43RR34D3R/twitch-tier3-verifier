# Supabase Database Setup Guide

This guide will help you set up a free Supabase database for your Twitch Tier 3 Verifier application.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. It's completely free for the tier we need!

## Step 2: Create a New Project

1. After signing in, click "New project"
2. Choose your organization (or create one)
3. Give your project a name (e.g., "twitch-tier3-verifier")
4. Create a strong database password and save it somewhere safe
5. Choose a region close to you
6. Click "Create new project"

Wait a few minutes for the project to be set up.

## Step 3: Get Your API Keys

1. In your Supabase dashboard, go to "Settings" → "API"
2. Copy the following values:
   - **Project URL** (looks like `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

## Step 4: Set Up Your Environment Variables

1. In your project root, copy `.env.example` to `.env.local`
2. Add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 5: Create Database Tables

1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New query"
3. Copy and paste the entire content of `database-setup.sql` file
4. Click "Run" to execute the SQL

This will create:
- `verification_logs` table for storing verification attempts
- `page_settings` table for storing customizable page text
- Proper indexes for performance
- Default page settings

## Step 6: Test the Setup

1. Start your development server: `npm run dev`
2. Go to your admin dashboard (`/admin`)
3. The verification logs should now be empty (no mock data)
4. Try the "Check BuckFoozle Tier 3 Status" button - it should create a real log entry
5. The logs should persist even after restarting the server

## Features You Now Have

✅ **Persistent verification logs** - All verification attempts are saved to the database
✅ **Real-time admin dashboard** - See actual verification attempts from users
✅ **Persistent page settings** - Text customizations are saved and persist
✅ **Cloud hosting** - Works even when your PC is off (when deployed)
✅ **Free tier** - Supabase free tier is generous for this use case

## Security Notes

- The anon key is safe to use in client-side code
- Row Level Security (RLS) is automatically enabled
- Only authenticated admins can access admin endpoints
- Database operations are secured through your API routes

## Next Steps

When you're ready to deploy:
1. Deploy your app to Vercel, Netlify, or your preferred platform
2. Add the same environment variables to your production environment
3. Your database will work automatically in production!

## Troubleshooting

- **"Failed to load verification logs"**: Check your environment variables
- **Database connection errors**: Verify your Supabase URL and key
- **SQL errors**: Make sure you ran the entire `database-setup.sql` script
- **Missing logs**: Ensure the check-tier3 API is working properly

Your verification system is now fully persistent and cloud-hosted! 🎉
