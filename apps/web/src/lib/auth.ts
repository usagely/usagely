import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import Database from "better-sqlite3"
import path from "path"

const dbPath = process.env.BETTER_AUTH_SQLITE_PATH
  ? path.resolve(process.env.BETTER_AUTH_SQLITE_PATH)
  : path.resolve(process.cwd(), "auth.db")

const db = new Database(dbPath)
db.pragma("journal_mode = WAL")

export const auth = betterAuth({
  appName: "Usagely",
  secret: process.env.AUTH_SECRET || "dev-secret-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",

  database: db,

  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    minPasswordLength: 6,
    autoSignIn: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  plugins: [
    jwt({
      jwt: {
        issuer: "usagely",
        audience: "usagely-api",
        expirationTime: "7d",
        definePayload: ({ user, session }) => ({
          sub: user.id,
          email: user.email,
          name: user.name,
          sessionId: session.id,
        }),
      },
    }),
  ],
})

export type Auth = typeof auth
