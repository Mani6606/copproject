import TestClient from "./api-test-component";

export default async function Country() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-3xl font-bold mb-4">Country: Global</h1>
      <TestClient />
    </div>
  );
}
