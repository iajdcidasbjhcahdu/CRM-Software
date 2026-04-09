import { getDocuments } from "@/actions/documents.action";
import EmployeeDocumentsContent from "./EmployeeDocumentsContent";

export default async function EmployeeDocumentsPage() {
  const result = await getDocuments({ page: 1, limit: 50 });

  return <EmployeeDocumentsContent initialData={result.success ? result.data : { documents: [], pagination: {} }} />;
}
