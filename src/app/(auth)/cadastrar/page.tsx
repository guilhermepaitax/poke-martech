import { AuthForm } from "@/components/auth-form/auth-form";

export default function CadastrarPage() {
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-16">
      <AuthForm mode="sign-up" />
    </main>
  );
}
