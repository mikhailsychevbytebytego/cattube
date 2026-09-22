import { redirect } from "next/navigation";

import { signUpAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/cattube/auth-form";
import { getSession, safeCallbackPath } from "@/lib/session";

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const session = await getSession();
  const params = await searchParams;
  const callbackUrl = safeCallbackPath(first(params.callbackUrl));
  if (session) redirect(callbackUrl);

  return (
    <AuthForm
      title="Create account"
      submitLabel="Sign up"
      action={signUpAction}
      callbackUrl={callbackUrl}
      switchHref="/sign-in"
      switchLabel="Already have an account? Sign in"
      includeName
    />
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
