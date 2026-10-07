"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";

type AuthInput = {
  email: string;
  password: string;
  name: string;
  username: string;
};

function useAuthForm(mode: AuthMode) {
  const router = useRouter();
  const [values, setValues] = useState<AuthInput>({
    email: "",
    password: "",
    name: "",
    username: "",
  });

  const mutation = useMutation({
    mutationFn: async (input: AuthInput) => {
      if (mode === "sign-in") {
        const result = await authClient.signIn.email({
          email: input.email,
          password: input.password,
        });
        if (result.error) throw new Error(result.error.message ?? "Não foi possível entrar.");
        return;
      }
      const result = await authClient.signUp.email({
        email: input.email,
        password: input.password,
        name: input.name,
        username: input.username.toLowerCase(),
      });
      if (result.error) throw new Error(result.error.message ?? "Não foi possível cadastrar.");
    },
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
  });

  function update(patch: Partial<AuthInput>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  return { values, update, mutation };
}

export { useAuthForm };
export type { AuthMode };
