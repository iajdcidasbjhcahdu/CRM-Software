import { getClientDashboardStats } from "@/actions/dashboard.action";
import ClientDashboardContent from "./ClientDashboardContent";

export default async function ClientDashboard() {
  const stats = await getClientDashboardStats();

  return <ClientDashboardContent stats={stats} />;
}
