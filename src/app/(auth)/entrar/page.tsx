import { AuthForm } from "@/components/auth-form/auth-form";

export default function EntrarPage() {
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-16">
      <AuthForm mode="sign-in" />
    </main>
  );
}
