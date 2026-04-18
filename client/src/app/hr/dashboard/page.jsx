import { getHrDashboardStats } from "@/actions/dashboard.action";
import HrDashboardContent from "@/components/attendance/admin/HrDashboardContent";

export default async function HrDashboardPage() {
  const stats = await getHrDashboardStats();
  return <HrDashboardContent stats={stats} basePath="/hr" />;
}
