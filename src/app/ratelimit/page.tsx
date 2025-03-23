import { headers } from "next/headers";

export default async function TestRateLimit() {
  const headersList = await headers();
  const requestCount = headersList.get("X-Request-Count") || "0";

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Rate Limit Test</h1>
      <p>You have made {requestCount} requests in this window.</p>
    </div>
  );
}
    