import { getDocuments } from "@/actions/documents.action";
import ClientDocumentsContent from "./ClientDocumentsContent";

export default async function ClientDocumentsPage() {
  const result = await getDocuments({ page: 1, limit: 50 });

  return <ClientDocumentsContent initialData={result.success ? result.data : { documents: [], pagination: {} }} />;
}
