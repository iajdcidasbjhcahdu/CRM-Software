import { getMyTasks } from "@/actions/tasks.action";
import EmployeeTasksContent from "./EmployeeTasksContent";

export default async function EmployeeTasksPage() {
  const result = await getMyTasks();

  return <EmployeeTasksContent initialTasks={result.success ? result.data : []} />;
}
