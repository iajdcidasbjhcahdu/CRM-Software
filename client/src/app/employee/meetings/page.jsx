import { getMeetings } from "@/actions/meetings.action";
import EmployeeMeetingsContent from "./EmployeeMeetingsContent";

export default async function EmployeeMeetingsPage() {
  const result = await getMeetings({ page: 1, limit: 50, sortBy: "scheduledAt", sortOrder: "desc" });

  return <EmployeeMeetingsContent initialData={result.success ? result.data : { meetings: [], pagination: {} }} />;
}
