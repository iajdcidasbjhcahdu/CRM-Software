import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";

export default async function RolicBasePage() {
  const user = await getAuthUser();

  if (!user?.role) {
    redirect("/login");
  }

  redirect(`/${user.role.toLowerCase()}`);

}
