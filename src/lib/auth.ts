import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { container } from "@/server/container";
import { db } from "@/server/infrastructure/db/drizzle/client";
import * as schema from "@/server/infrastructure/db/drizzle/schema";

const configuredUrl = process.env.BETTER_AUTH_URL;

const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "development-only-secret-change-me",
  baseURL: configuredUrl
    ? configuredUrl
    : {
        allowedHosts: ["localhost", "127.0.0.1"],
        fallback: "http://localhost:3000",
        protocol: "auto",
      },
  trustedOrigins: [
    ...(configuredUrl ? [configuredUrl] : []),
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
        unique: true,
      },
      bio: {
        type: "string",
        required: false,
        defaultValue: "",
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    nextCookies(),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (typeof user.username === "string") {
            return { data: { ...user, username: user.username.toLowerCase() } };
          }
          return { data: user };
        },
        after: async (user) => {
          const result = await container.grantSignupBonus.execute({ userId: user.id });
          if (!result.ok) {
            console.error(result.error.message);
          }
        },
      },
    },
  },
});

export { auth };
