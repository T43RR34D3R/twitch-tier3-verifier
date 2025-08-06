import { AuthOptions } from "next-auth"
import TwitchProvider from "next-auth/providers/twitch"
import { storeUserToken } from "./data-collector"
import { logSuccessfulLogin } from "./login-logger"

export const authOptions: AuthOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'user:read:email',
            'user:read:subscriptions',
            'channel:read:subscriptions',
            'moderator:read:followers',
            'channel:read:stream_key',
            'user:read:follows',
            'channel:moderate',
            'chat:read',
            'chat:edit'
          ].join(' ')
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
          user,
        }
        
        // Store token for background data collection
        if (account.access_token && account.refresh_token && token.sub) {
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
      return session;
    },
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
