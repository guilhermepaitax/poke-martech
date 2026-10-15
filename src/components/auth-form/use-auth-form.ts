"use client";

import { authClient } from "@/lib/auth-client";
import {
  authApiErrorMessage,
  authFieldErrors,
  type AuthFieldErrors,
  type AuthMode,
} from "@/lib/auth-form-errors";
import { evaluatePassword } from "@/lib/password-policy";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthInput = {
  email: string;
  password: string;
  name: string;
  username: string;
  imageUseConsent: boolean;
};

function useAuthForm(mode: AuthMode, callbackUrl?: string | null) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [values, setValues] = useState<AuthInput>({
    email: "",
    password: "",
    name: "",
    username: "",
    imageUseConsent: false,
  });
  const passwordChecks = evaluatePassword(values.password);

  const mutation = useMutation({
    mutationFn: async (input: AuthInput) => {
      if (mode === "sign-in") {
        const result = await authClient.signIn.email({
          email: input.email.trim(),
          password: input.password,
        });
        if (result.error) throw new Error(authApiErrorMessage(mode, result.error));
        return;
      }
      const result = await authClient.signUp.email({
        email: input.email.trim(),
        password: input.password,
        name: input.name.trim(),
        username: input.username.trim().toLowerCase(),
        imageUseConsent: input.imageUseConsent,
      });
      if (result.error) throw new Error(authApiErrorMessage(mode, result.error));
    },
    onSuccess: () => {
      router.push(callbackUrl || "/home");
      router.refresh();
    },
  });

  function update(patch: Partial<AuthInput>) {
    setValues((current) => ({ ...current, ...patch }));
    setFieldErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch) as (keyof AuthInput)[]) delete next[key];
      return next;
    });
    if (mutation.isError) mutation.reset();
  }

  function submit() {
    const errors = authFieldErrors(mode, values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (mutation.isError) mutation.reset();
      return;
    }
    mutation.mutate(values);
  }

  return {
    values,
    fieldErrors,
    update,
    mutation,
    submit,
    passwordChecks,
    passwordInvalid: Boolean(fieldErrors.password) && mode === "sign-up",
    consentInvalid: Boolean(fieldErrors.imageUseConsent),
  };
}

export { useAuthForm };
export type { AuthMode };
