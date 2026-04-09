import { getProjects } from "@/actions/projects.action";
import EmployeeProjectsContent from "./EmployeeProjectsContent";

export default async function EmployeeProjectsPage() {
  const result = await getProjects({ page: 1, limit: 50 });

  return <EmployeeProjectsContent initialData={result.success ? result.data : { projects: [], pagination: {} }} />;
}
