# Discord Authentication Setup

This guide explains how to configure Discord OAuth authentication for the game voting system.

## Prerequisites

- A Discord account
- A Discord application with OAuth2 credentials

## Setup Steps

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give your application a name (e.g., "Game Voting System")
4. Click "Create"

### 2. Configure OAuth2

1. In your application, navigate to **OAuth2** > **General**
2. Add your redirect URLs under "Redirects":
   - For local development: `http://localhost:3000/api/auth/callback/discord`
   - For production: `https://your-domain.com/api/auth/callback/discord`
3. Save your changes

### 3. Get Your Credentials

1. In the OAuth2 section, copy your:
   - **Client ID**
   - **Client Secret** (click "Reset Secret" if needed, then copy it)

### 4. Configure Environment Variables

Add the following to your `.env.local` file (create it if it doesn't exist):

```env
# Discord OAuth
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# NextAuth (required)
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
```

To generate a secure `NEXTAUTH_SECRET`, you can run:
```bash
openssl rand -base64 32
```

### 5. Existing Twitch Authentication

The system also supports Twitch authentication. If you want to keep both providers, ensure these are also set:

```env
# Twitch OAuth (optional, if you want both providers)
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
```

**Important Note about Database Schema:**
The database uses column names like `twitch_user_id` and `twitch_username` for historical reasons. These columns now store user IDs and usernames from any OAuth provider (Discord, Twitch, etc.). No database migration is needed - the existing schema works for all providers.

### 7. IGDB Integration

For game search functionality, configure IGDB:

```env
# IGDB (for game search)
IGDB_CLIENT_ID=your_igdb_client_id
```

Note: IGDB uses Twitch credentials, so you can use your Twitch Client ID for IGDB_CLIENT_ID.

## Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`

3. You should see buttons for both Twitch and Discord sign-in options

4. Click "Sign in with Discord" and complete the OAuth flow

5. After successful authentication, you'll be redirected to the home page

## Features

### Discord Authentication
- Users can sign in using their Discord account
- The system stores Discord user ID and display name
- Discord avatar is displayed in the user interface

### Twitch Authentication (Legacy)
- Existing Twitch authentication continues to work
- Users can choose between Discord and Twitch sign-in
- All auth providers share the same session management

### Game Voting System
- Authenticated users can vote for up to 3 games
- Vote limit is enforced both client-side and server-side
- Users can remove votes to vote for different games
- Real-time vote count display (X/3 votes used)

## Troubleshooting

### "Authentication required" error
- Ensure your environment variables are set correctly
- Check that NEXTAUTH_SECRET is configured
- Restart your development server after adding environment variables

### Discord OAuth redirect issues
- Verify your redirect URL matches exactly in Discord Developer Portal
- Check NEXTAUTH_URL matches your application URL
- Ensure no trailing slashes in URLs

### Vote limit not working
- Clear your browser cache and cookies
- Check browser console for any API errors
- Verify the database connection is working

## Security Notes

- Never commit `.env.local` or any file containing secrets to version control
- Keep your `DISCORD_CLIENT_SECRET` and `NEXTAUTH_SECRET` secure
- Rotate secrets regularly in production
- Use HTTPS in production environments

## Support

For issues or questions, please refer to:
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
