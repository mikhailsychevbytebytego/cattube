import { AppShell } from "@/components/cattube/app-shell";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <AppShell
      user={
        session
          ? {
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
              admin: Boolean(session.user.admin),
            }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
