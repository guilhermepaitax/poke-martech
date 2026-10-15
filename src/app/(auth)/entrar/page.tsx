import { AuthForm } from "@/components/auth-form/auth-form";
import { AuthLayout } from "@/components/auth-form/auth-layout";
import { safeCallbackUrl } from "@/lib/profile-share";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Encontre seus PokéMartechs favoritos e comece a colecionar.",
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.callbackUrl) ? params.callbackUrl[0] : params.callbackUrl;
  return (
    <AuthLayout mode="sign-in">
      <AuthForm mode="sign-in" callbackUrl={safeCallbackUrl(raw ?? null)} />
    </AuthLayout>
  );
}
