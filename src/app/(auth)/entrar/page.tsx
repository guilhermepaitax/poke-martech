import { AuthForm } from "@/components/auth-form/auth-form";
import { AuthLayout } from "@/components/auth-form/auth-layout";

export default function EntrarPage() {
  return (
    <AuthLayout mode="sign-in">
      <AuthForm mode="sign-in" />
    </AuthLayout>
  );
}
