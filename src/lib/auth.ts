import { AuthOptions } from "next-auth"
import TwitchProvider from "next-auth/providers/twitch"
import DiscordProvider from "next-auth/providers/discord"
import { storeUserToken } from "./data-collector"
import { logSuccessfulLogin } from "./login-logger"
import { query } from "./railway-db"

export const authOptions: AuthOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'user:read:subscriptions',
          ].join(' ')
        }
      }
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email'
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        const newToken = {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 4 * 60 * 60 * 1000, // 4 hours
          provider: account.provider,
          user,
        }
        
        // Store user in Railway database
        if (token.sub && user.name) {
          await storeUserInRailway(
            token.sub,
            user.name,
            user.name, // display name
            user.email || null,
            user.image || null,
            account.provider
          ).catch(error => {
            console.error('Failed to store user in Railway:', error)
          })
        }
        
        // Store token for background data collection (only for Twitch)
        if (account.provider === 'twitch' && account.access_token && account.refresh_token && token.sub) {
          await storeUserToken(
            token.sub,
            user.name || 'Unknown',
            account.access_token,
            account.refresh_token,
            newToken.accessTokenExpires as number
          ).catch(error => {
            console.error('Failed to store user token:', error)
          })
        }
        
        // Log the successful login
        await logSuccessfulLogin(
          user,
          undefined, // We don't have access to the request here
          undefined, // Session token will be generated later
          newToken.accessTokenExpires as number
        ).catch(error => {
          console.error('Failed to log login:', error)
        })
        
        return newToken
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // Access token has expired, try to update it
      const refreshedToken = await refreshAccessToken(token)
      
      // If refresh failed, force re-authentication
      if ('error' in refreshedToken) {
        return {
          ...token,
          error: "RefreshAccessTokenError",
        }
      }
      
      return refreshedToken
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      // Send properties to the client
      session.accessToken = token.accessToken;
      session.error = token.error;
      session.provider = token.provider;
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('NextAuth redirect callback:', { url, baseUrl })
      
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        const finalUrl = `${baseUrl}${url}`
        console.log('Redirecting to relative URL:', finalUrl)
        return finalUrl
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        console.log('Redirecting to same origin URL:', url)
        return url
      }
      
      console.log('Falling back to baseUrl:', baseUrl)
      return baseUrl
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    // Different OAuth providers have different token refresh mechanisms
    // Currently, we only implement Twitch token refresh
    // Discord tokens have a longer default expiry and would use a different refresh flow
    if (token.provider !== 'twitch') {
      console.log('Token refresh not implemented for provider:', token.provider);
      return token;
    }

    const url = "https://id.twitch.tv/oauth2/token"
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    })

    const tokens = await response.json()

    if (!response.ok) {
      throw tokens
    }

    return {
      ...token,
      accessToken: tokens.access_token,
      accessTokenExpires: Date.now() + tokens.expires_in * 1000,
      refreshToken: tokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    }
  } catch (error) {
    console.log(error)

    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

/**
 * Store user information in Railway database
 * Note: The database schema uses twitch_* column names for historical reasons,
 * but these columns now store user IDs from any OAuth provider (Discord, Twitch, etc.)
 */
async function storeUserInRailway(
  userId: string, 
  username: string, 
  displayName: string | null,
  email: string | null,
  profileImageUrl: string | null,
  provider: string
): Promise<void> {
  try {
    // Store in main users table
    // Note: Column names say "twitch_*" but they store any OAuth provider's data
    await query(`
      INSERT INTO users (
        twitch_user_id, 
        twitch_username, 
        twitch_display_name,
        email,
        profile_image_url,
        total_logins,
        last_login_at
      ) VALUES ($1, $2, $3, $4, $5, 1, NOW())
      ON CONFLICT (twitch_user_id) 
      DO UPDATE SET 
        twitch_username = EXCLUDED.twitch_username,
        twitch_display_name = EXCLUDED.twitch_display_name,
        email = EXCLUDED.email,
        profile_image_url = EXCLUDED.profile_image_url,
        total_logins = users.total_logins + 1,
        last_login_at = NOW(),
        is_active = true,
        updated_at = NOW()
    `, [userId, username, displayName || username, email, profileImageUrl]);
    
    console.log(`Stored/updated user in Railway: ${username} (provider: ${provider})`);
  } catch (error) {
    console.error('Error storing user in Railway:', error);
    throw error;
  }
}
