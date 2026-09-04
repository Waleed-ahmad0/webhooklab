// auth.config.ts
import bcrypt from "bcrypt"
import { prisma } from '../lib/prisma.js'
import Credentials from "@auth/express/providers/credentials"
import type { User, Account } from "@auth/core/types"
import type { JWT } from "@auth/core/jwt"
import type { AuthConfig } from "@auth/core"
import Google from "@auth/express/providers/google"
import Discord from "@auth/express/providers/discord"
import Github from '@auth/express/providers/github'



export const authConfig = {
  trustHost: true,
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Discord({
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Github({
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials): Promise<User | null> => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user?.password) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!valid) return null

        return {
          id: user.id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
          authMethods: user.authMethods,
        } as User
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },

 cookies: {
  csrfToken: {
    name: "authjs.csrf-token",
    options: {
      httpOnly: true,
      sameSite: "none" as const,
      secure: true,
      path: "/",
    },
  },
  sessionToken: {
    name: "authjs.session-token",
    options: {
      httpOnly: true,
      sameSite: "none" as const,
      secure: true,
      path: "/",
    },
  },
  pkceCodeVerifier: {
    name: "authjs.pkce.code_verifier",
    options: {
      httpOnly: true,
      sameSite: "none" as const,
      secure: true,
      path: "/",
      maxAge: 900,
    },
  },
  state: {
    name: "authjs.state",
    options: {
      httpOnly: true,
      sameSite: "none" as const,
      secure: true,
      path: "/",
      maxAge: 900,
    },
  },
},


  callbacks: {
    async redirect({ url, baseUrl }) {
      return `${process.env.FRONTEND_URL}/workspace`
    },
    async signIn({
      user,
      account,
      profile,
    }: {
      user: any;
      account?: any | null;
      profile?: any;
    }) {
      if (account?.provider === "credentials") {
        return true;
      }

      if (!account) {
        return false;
      }

      try {
        const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
        const providerIdField = `${account.provider}Id`;

        if (existingUser) {
          const updateData: Record<string, any> = {
            [providerIdField]: account.providerAccountId,
            lastLogin: new Date(),
            isEmailVerified: true,
          };

          if (!existingUser.authMethods.includes(account.provider)) {
            updateData.authMethods = [...existingUser.authMethods, account.provider];
          }

          if (!existingUser.firstName && user?.name) {
            updateData.firstName = user.name;
          }

          if (!existingUser.profileImage && user?.image) {
            updateData.profileImage = user.image;
          }

          await prisma.user.update({
            where: { id: existingUser.id },
            data: updateData,
          });
        } else {
          await prisma.user.create({
            data: {
              email: user.email,
              firstName: profile?.name || user.name || "User",
              lastName: "",
              [providerIdField]: account.providerAccountId,
              authMethods: [account.provider],
              profileImage: profile?.image || user.image || null,
              isEmailVerified: true,
              lastLogin: new Date(),
            }
          })

        }
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    async jwt({
      token,
      user,
      account,
      trigger,
      session
    }: {
      token: JWT
      user?: User
      account?: Account | null
      trigger?: "signIn" | "signUp" | "update"
      session?: any
    }) {
      if (user) {
        if (account?.provider && account.provider !== "credentials") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.email = dbUser.email;
            token.firstName = dbUser.firstName;
            token.lastName = dbUser.lastName || '';
            token.profileImage = dbUser.profileImage;
            token.authMethods = dbUser.authMethods;
          }
        } else {
          token.id = user.id
          token.email = user.email
          token.firstName = user.firstName
          token.lastName = user.lastName
          token.profileImage = user.profileImage
          token.authMethods = user.authMethods
        }
      }


      if (trigger === "update" && session?.user) {
        const { id, firstName, lastName, profileImage, authMethods, ...rest } = session.user
        token = {
          ...token,
          ...rest,
          id: id || token.id,
          firstName: firstName || token.firstName,
          lastName: lastName || token.lastName,
          profileImage: profileImage || token.profileImage,
          authMethods: authMethods || token.authMethods,
        }
      }

      return token
    },

    async session({
      session,
      token
    }: {
      session: any
      token: JWT
    }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.profileImage = token.profileImage as string | null
        session.user.authMethods = token.authMethods as string[]
      }

      return session
    },
  },





  logger: {
    error(error: Error) {
      console.error(error)
    },
    warn(code: string, ...message: any[]) {
      console.warn(code, message)
    },
    debug(code: string, ...message: any[]) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(code, message)
      }
    },
  },
} satisfies AuthConfig