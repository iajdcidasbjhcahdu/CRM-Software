import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";

export default async function RolicRedirect({ params }) {
  const user = await getAuthUser();

  if (!user?.role) {
    redirect("/login");
  }

  const role = user.role.toLowerCase();
  const { slug } = await params;
  const remaining = slug.join("/");
  redirect(`/${role}/${remaining}`);
}
