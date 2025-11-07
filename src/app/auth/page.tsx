import AuthForm from "@/components/auth/auth-form";

export const metadata = {
  title: "Sign in",
};

export default function Page() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4 py-10">
      <AuthForm initialMode="login" />
    </div>
  );
}
