import Link from "next/link";

import { getAdminCounts } from "@/lib/admin-catalog";
import { adminPath } from "@/lib/admin-routes";

export default async function AdminHome() {
  const counts = await getAdminCounts();
  const cards = [
    { href: adminPath("/admin/videos"), label: "Videos", value: counts.videos },
    { href: adminPath("/admin/channels"), label: "Channels", value: counts.channels },
    { href: adminPath("/admin/categories"), label: "Categories", value: counts.categories },
    { href: adminPath("/admin/comments"), label: "Comments", value: counts.comments },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-ct-muted">
        Manage the CatTube catalog. Changes show up on the public site immediately.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className="block rounded-xl border border-ct-border bg-ct-bg px-4 py-5 hover:bg-ct-hover"
            >
              <p className="text-sm text-ct-muted">{card.label}</p>
              <p className="mt-1 text-3xl font-semibold">{card.value}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
