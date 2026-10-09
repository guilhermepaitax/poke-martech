import { formatBaseUrl } from "@/lib/format-base-url";
import {
  MIN_PASSWORD_LENGTH,
  isPasswordValid,
  unmetPasswordMessage,
} from "@/lib/password-policy";
import { container } from "@/server/container";
import { db } from "@/server/infrastructure/db/drizzle/client";
import * as schema from "@/server/infrastructure/db/drizzle/schema";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

const canonicalUrl = formatBaseUrl(process.env.BETTER_AUTH_URL || "");
const vercelUrl = formatBaseUrl(process.env.VERCEL_URL || "");
const productionUrl = formatBaseUrl(
  process.env.VERCEL_PROJECT_PRODUCTION_URL || "",
);
const formattedBaseUrl = canonicalUrl || productionUrl || vercelUrl;

function readPassword(body: unknown) {
  if (!body || typeof body !== "object" || !("password" in body)) return null;
  return typeof body.password === "string" ? body.password : null;
}

const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "development-only-secret-change-me",
  baseURL: formattedBaseUrl
    ? formattedBaseUrl
    : {
        allowedHosts: ["localhost", "127.0.0.1"],
        fallback: "http://localhost:3000",
        protocol: "https",
      },
  trustedOrigins: [
    ...new Set(
      [
        formattedBaseUrl,
        vercelUrl,
        productionUrl,
        "http://localhost:3000",
        "http://localhost:3001",
      ].filter((origin) => origin.length > 0),
    ),
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
    minPasswordLength: MIN_PASSWORD_LENGTH,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const password = readPassword(ctx.body);
      if (password === null || isPasswordValid(password)) return;
      throw APIError.from("BAD_REQUEST", {
        code: "WEAK_PASSWORD",
        message:
          unmetPasswordMessage(password) ??
          "A senha não atende aos requisitos.",
      });
    }),
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
          const result = await container.grantSignupBonus.execute({
            userId: user.id,
          });
          if (!result.ok) {
            console.error(result.error.message);
          }
        },
      },
    },
  },
});

export { auth };
