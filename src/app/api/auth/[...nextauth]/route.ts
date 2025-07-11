import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth"

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: {
  accessToken?: string;
  accessTokenExpires?: number;
  refreshToken?: string;
  error?: string;
}) {
  try {
    if (!token.refreshToken) {
      throw new Error("No refresh token available");
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
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    }
  } catch (error) {
    console.log(error)

    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "twitch",
      name: "Twitch",
      type: "oauth",
      authorization: {
        url: "https://id.twitch.tv/oauth2/authorize",
        params: {
          scope: "user:read:email user:read:subscriptions user:read:follows",
          response_type: "code",
          force_verify: "true", // Force Twitch to show authorization screen
        },
      },
      token: {
        url: "https://id.twitch.tv/oauth2/token",
        async request(context) {
          console.log("Token request context:", {
            client_id: context.provider.clientId,
            code: context.params.code,
            redirect_uri: context.params.redirect_uri,
          });
          
          const response = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: context.provider.clientId!,
              client_secret: context.provider.clientSecret!,
              code: context.params.code!,
              grant_type: "authorization_code",
              redirect_uri: (context.params.redirect_uri as string) || context.provider.callbackUrl!,
            }),
          });
          
          const responseText = await response.text();
          console.log("Token response status:", response.status);
          console.log("Token response text:", responseText);
          
          if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status} - ${responseText}`);
          }
          
          const tokens = JSON.parse(responseText);
          return { tokens };
        },
      },
      userinfo: {
        url: "https://api.twitch.tv/helix/users",
        async request(context) {
          const response = await fetch("https://api.twitch.tv/helix/users", {
            headers: {
              Authorization: `Bearer ${context.tokens.access_token}`,
              "Client-Id": context.provider.clientId!,
            },
          });
          
          return await response.json();
        },
      },
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      profile(profile) {
        console.log("Profile received:", profile);
        return {
          id: profile.data?.[0]?.id || profile.id,
          name: profile.data?.[0]?.display_name || profile.display_name,
          email: profile.data?.[0]?.email || profile.email,
          image: profile.data?.[0]?.profile_image_url || profile.profile_image_url,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          sub: user.id, // Store user ID in sub field
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + (account.expires_in as number) * 1000,
          refreshToken: account.refresh_token,
        }
      }

      // If there's an error, force re-authentication
      if (token.error === "RefreshAccessTokenError") {
        return { ...token, error: "RefreshAccessTokenError" }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.error = token.error
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  events: {
    async signOut() {
      // Clear any cached tokens when signing out
      console.log("User signed out - clearing tokens");
    },
  },
  debug: true,
  logger: {
    error(code, metadata) {
      console.error("NextAuth Error:", code, metadata)
    },
    warn(code) {
      console.warn("NextAuth Warning:", code)
    },
    debug(code, metadata) {
      console.log("NextAuth Debug:", code, metadata)
    }
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
