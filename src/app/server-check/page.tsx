import { cookies } from "next/headers";

export default async function ServerCheckPage() {
  const cookieStore = await cookies();
  const allowAccess = cookieStore.get("allowAccess")?.value;

  if (allowAccess !== "true") {
    return <h1>Unauthorized - Access Denied</h1>;
  }

  return <h1>Welcome! You have access.</h1>;
}
