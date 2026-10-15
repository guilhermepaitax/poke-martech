import { AuthForm } from "@/components/auth-form/auth-form";
import { AuthLayout } from "@/components/auth-form/auth-layout";
import { safeCallbackUrl } from "@/lib/profile-share";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "A conta nova começa com 100 moedas para os primeiros pacotes.",
};

export default async function CadastrarPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.callbackUrl) ? params.callbackUrl[0] : params.callbackUrl;
  return (
    <AuthLayout mode="sign-up">
      <AuthForm mode="sign-up" callbackUrl={safeCallbackUrl(raw ?? null)} />
    </AuthLayout>
  );
}
