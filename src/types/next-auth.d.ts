import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    error?: string
    provider?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      twitchId?: string
      discordId?: string
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    twitchId?: string
    discordId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    accessTokenExpires?: number
    refreshToken?: string
    error?: string
    provider?: string
  }
}
