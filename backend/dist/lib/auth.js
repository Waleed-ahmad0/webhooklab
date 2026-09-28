"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authConfig = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_js_1 = require("../lib/prisma.js");
const credentials_1 = __importDefault(require("@auth/express/providers/credentials"));
const google_1 = __importDefault(require("@auth/express/providers/google"));
const discord_1 = __importDefault(require("@auth/express/providers/discord"));
const github_1 = __importDefault(require("@auth/express/providers/github"));
const FRONTEND_URL = process.env.FRONTEND_URL;
exports.authConfig = {
    trustHost: true,
    providers: [
        (0, google_1.default)({
            redirectProxyUrl: `${FRONTEND_URL}/auth`,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
        (0, discord_1.default)({
            redirectProxyUrl: `${FRONTEND_URL}/auth`,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
        (0, github_1.default)({
            redirectProxyUrl: `${FRONTEND_URL}/auth`,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: "read:user user:email repo"
                },
            },
        }),
        (0, credentials_1.default)({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }
                const user = await prisma_js_1.prisma.user.findUnique({
                    where: { email: credentials.email }
                });
                if (!user?.password)
                    return null;
                const valid = await bcrypt_1.default.compare(credentials.password, user.password);
                if (!valid)
                    return null;
                return {
                    id: user.id.toString(),
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profileImage: user.profileImage,
                    authMethods: user.authMethods,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    cookies: {
        csrfToken: {
            name: "authjs.csrf-token",
            options: {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
            },
        },
        sessionToken: {
            name: "authjs.session-token",
            options: {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
            },
        },
        pkceCodeVerifier: {
            name: "authjs.pkce.code_verifier",
            options: {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 900,
            },
        },
        state: {
            name: "authjs.state",
            options: {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 900,
            },
        },
    },
    callbacks: {
        async redirect({ url, baseUrl }) {
            if (url.includes("error=")) {
                const parsed = new URL(url, baseUrl);
                return `${process.env.FRONTEND_URL}/login?${parsed.searchParams.toString()}`;
            }
            return `${process.env.FRONTEND_URL}/workspace`;
        },
        async signIn({ user, account, profile, }) {
            if (account?.provider === "credentials") {
                return true;
            }
            if (!account) {
                return false;
            }
            try {
                const existingUser = await prisma_js_1.prisma.user.findUnique({ where: { email: user.email } });
                const providerIdField = `${account.provider}Id`;
                if (existingUser) {
                    const updateData = {
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
                    await prisma_js_1.prisma.user.update({
                        where: { id: existingUser.id },
                        data: updateData,
                    });
                }
                else {
                    await prisma_js_1.prisma.user.create({
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
                    });
                }
                return true;
            }
            catch (error) {
                console.error("SignIn callback error:", error);
                return false;
            }
        },
        async jwt({ token, user, account, trigger, session }) {
            if (user) {
                if (account?.provider && account.provider !== "credentials") {
                    const dbUser = await prisma_js_1.prisma.user.findUnique({
                        where: { email: user.email },
                    });
                    if (dbUser) {
                        token.id = dbUser.id;
                        token.email = dbUser.email;
                        token.firstName = dbUser.firstName;
                        token.lastName = dbUser.lastName || '';
                        token.profileImage = dbUser.profileImage;
                        token.authMethods = dbUser.authMethods;
                    }
                }
                else {
                    token.id = user.id;
                    token.email = user.email;
                    token.firstName = user.firstName;
                    token.lastName = user.lastName;
                    token.profileImage = user.profileImage;
                    token.authMethods = user.authMethods;
                }
            }
            if (account?.provider === "github" && account.access_token) {
                token.githubAccessToken = account.access_token;
            }
            if (trigger === "update" && session?.user) {
                const { id, firstName, lastName, profileImage, authMethods, ...rest } = session.user;
                token = {
                    ...token,
                    ...rest,
                    id: id || token.id,
                    firstName: firstName || token.firstName,
                    lastName: lastName || token.lastName,
                    profileImage: profileImage || token.profileImage,
                    authMethods: authMethods || token.authMethods,
                };
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.firstName = token.firstName;
                session.user.lastName = token.lastName;
                session.user.profileImage = token.profileImage;
                session.user.authMethods = token.authMethods;
            }
            return session;
        },
    },
    logger: {
        error(error) {
            console.error(error);
        },
        warn(code, ...message) {
            console.warn(code, message);
        },
        debug(code, ...message) {
            if (process.env.NODE_ENV === 'development') {
                console.debug(code, message);
            }
        },
    },
};
