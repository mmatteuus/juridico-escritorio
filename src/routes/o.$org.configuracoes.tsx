import { createFileRoute } from "@tanstack/react-router";
import { OfficeAdministration } from "@/components/office/OfficeAdministration";
import { findOffice } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/configuracoes")({ component: Page });
function Page() { const { org } = Route.useParams(); return <OfficeAdministration office={findOffice(org)!} section="configuracoes" />; }

