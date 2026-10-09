"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import {
  evaluatePassword,
  isPasswordValid,
  unmetPasswordMessage,
} from "@/lib/password-policy";

type AuthMode = "sign-in" | "sign-up";

type AuthInput = {
  email: string;
  password: string;
  name: string;
  username: string;
};

function useAuthForm(mode: AuthMode) {
  const router = useRouter();
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [values, setValues] = useState<AuthInput>({
    email: "",
    password: "",
    name: "",
    username: "",
  });
  const passwordChecks = evaluatePassword(values.password);
  const passwordValid = isPasswordValid(values.password);

  const mutation = useMutation({
    mutationFn: async (input: AuthInput) => {
      if (mode === "sign-up" && !isPasswordValid(input.password)) {
        throw new Error(
          unmetPasswordMessage(input.password) ??
            "A senha não atende aos requisitos.",
        );
      }
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

  function submit() {
    if (mode === "sign-up" && !passwordValid) {
      setSubmitAttempted(true);
      return;
    }
    mutation.mutate(values);
  }

  return {
    values,
    update,
    mutation,
    submit,
    passwordChecks,
    passwordInvalid: mode === "sign-up" && submitAttempted && !passwordValid,
  };
}

export { useAuthForm };
export type { AuthMode };
