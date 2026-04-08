import { getMeetings } from "@/actions/meetings.action";
import ClientMeetingsContent from "./ClientMeetingsContent";

export default async function ClientMeetingsPage() {
  const result = await getMeetings({ page: 1, limit: 50, sortBy: "scheduledAt", sortOrder: "desc" });

  return <ClientMeetingsContent initialData={result.success ? result.data : { meetings: [], pagination: {} }} />;
}
