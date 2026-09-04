// types/auth.d.ts
import { DefaultSession, DefaultUser } from "@auth/core/types"
import { JWT as DefaultJWT } from "@auth/core/jwt"

declare module "@auth/core/types" {
  /**
   * Extend the built-in User type
   */
  interface User extends DefaultUser {
    id: string
    firstName: string
    lastName: string
    profileImage?: string | null
    authMethods?: string[]
  }

  /**
   * Extend the built-in Session type
   */
  interface Session {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      profileImage?: string | null
      authMethods?: string[]
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/jwt" {
  /**
   * Extend the built-in JWT type
   */
  interface JWT extends DefaultJWT {
    id?: string
    firstName?: string
    lastName?: string
    profileImage?: string | null
    authMethods?: string[]
  }
}

export {}