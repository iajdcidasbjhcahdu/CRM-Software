import { getDocuments } from "@/actions/documents.action";
import AccountDocumentsContent from "./AccountDocumentsContent";

export default async function AccountDocumentsPage() {
  const result = await getDocuments({ page: 1, limit: 50 });

  return <AccountDocumentsContent initialData={result.success ? result.data : { documents: [], pagination: {} }} />;
}
