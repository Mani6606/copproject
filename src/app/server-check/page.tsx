import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ServerCheckPage() {
  const cookieStore = await cookies(); // No need for 'await' as it's synchronous
  const allowAccess = cookieStore.get("allowAccess")?.value;

  if (allowAccess !== "true") {
    redirect("/login"); // Redirect to login page
  }

  return <h1>Welcome! You have access.</h1>;
}
