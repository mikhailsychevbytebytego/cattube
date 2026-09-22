import { signInAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/cattube/auth-form";
import { getSession, safeCallbackPath } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const session = await getSession();
  const params = await searchParams;
  const callbackUrl = safeCallbackPath(first(params.callbackUrl));
  if (session) redirect(callbackUrl);

  return (
    <AuthForm
      title="Sign in"
      submitLabel="Sign in"
      action={signInAction}
      callbackUrl={callbackUrl}
      switchHref="/sign-up"
      switchLabel="Create an account"
    />
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
