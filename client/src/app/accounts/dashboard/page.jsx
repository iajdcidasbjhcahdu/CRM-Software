import { getAccountDashboardStats } from "@/actions/dashboard.action";
import AccountDashboardContent from "./AccountDashboardContent";

export default async function AccountsDashboard() {
  const stats = await getAccountDashboardStats();

  return <AccountDashboardContent stats={stats} />;
}
