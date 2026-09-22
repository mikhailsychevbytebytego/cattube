"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthFormState } from "@/app/(auth)/actions";

type AuthFormProps = {
  title: string;
  submitLabel: string;
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  callbackUrl: string;
  switchHref: "/sign-in" | "/sign-up";
  switchLabel: string;
  includeName?: boolean;
};

export function AuthForm({
  title,
  submitLabel,
  action,
  callbackUrl,
  switchHref,
  switchLabel,
  includeName,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ct-text">{title}</h1>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {includeName ? (
        <label className="block text-sm">
          <span className="mb-1 block text-ct-muted">Name</span>
          <input
            name="name"
            required
            autoComplete="name"
            className="h-10 w-full rounded-lg border border-ct-border bg-ct-bg px-3 text-sm text-ct-text outline-none focus:border-ct-text"
          />
        </label>
      ) : null}
      <label className="block text-sm">
        <span className="mb-1 block text-ct-muted">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
            className="h-10 w-full rounded-lg border border-ct-border bg-ct-bg px-3 text-sm text-ct-text outline-none focus:border-ct-text"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-ct-muted">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={includeName ? "new-password" : "current-password"}
            className="h-10 w-full rounded-lg border border-ct-border bg-ct-bg px-3 text-sm text-ct-text outline-none focus:border-ct-text"
        />
      </label>
      {state.error ? <p className="text-sm text-ct-red">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-full bg-ct-text text-sm font-medium text-ct-inverted disabled:opacity-60"
      >
        {pending ? "Working..." : submitLabel}
      </button>
      <p className="text-center text-sm text-ct-muted">
        <Link href={switchHref} className="text-ct-text underline">
          {switchLabel}
        </Link>
      </p>
    </form>
  );
}
