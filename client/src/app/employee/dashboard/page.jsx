import { getEmployeeDashboardStats } from "@/actions/dashboard.action";
import EmployeeDashboardContent from "./EmployeeDashboardContent";

export default async function EmployeeDashboard() {
  const stats = await getEmployeeDashboardStats();

  return <EmployeeDashboardContent stats={stats} />;
}
