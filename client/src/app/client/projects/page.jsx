import { getProjects } from "@/actions/projects.action";
import ClientProjectsContent from "./ClientProjectsContent";

export default async function ClientProjectsPage() {
  const result = await getProjects({ page: 1, limit: 50 });

  return <ClientProjectsContent initialData={result.success ? result.data : { projects: [], pagination: {} }} />;
}
