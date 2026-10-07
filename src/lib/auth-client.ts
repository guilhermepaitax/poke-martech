"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        username: { type: "string", required: true },
        bio: { type: "string", required: false },
        role: { type: "string", required: false },
      },
    }),
    adminClient(),
  ],
});

export { authClient };
