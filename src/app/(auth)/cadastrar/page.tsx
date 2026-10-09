import { AuthForm } from "@/components/auth-form/auth-form";
import { AuthLayout } from "@/components/auth-form/auth-layout";

export default function CadastrarPage() {
  return (
    <AuthLayout mode="sign-up">
      <AuthForm mode="sign-up" />
    </AuthLayout>
  );
}
