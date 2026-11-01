import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/office/AppShell";
import { findOffice } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org")({
  loader: ({ params }) => {
    const office = findOffice(params.org);
    if (!office) throw notFound();
    return { office };
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: OrgLayout,
});

function OrgLayout() {
  const { office } = Route.useLoaderData();
  return (
    <AppShell key={office.id} office={office}>
      <Outlet />
    </AppShell>
  );
}
