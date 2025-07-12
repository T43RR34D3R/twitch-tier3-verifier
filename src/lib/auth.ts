import { AuthOptions } from "next-auth"
import TwitchProvider from "next-auth/providers/twitch"

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
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      // Send properties to the client
      session.accessToken = token.accessToken;
      return session;
    },
  },
}
