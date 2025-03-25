"use client";
import { useState } from "react";

export default function TestClient() {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test");
      const result = await response.json();
      setData(result.message);
    } catch (error) {
      setData("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchData} className="bg-blue-500 text-white px-4 py-2 rounded">
        Fetch API Data
      </button>
      {loading && <p>Loading...</p>}
      {data && <p>Response: {data}</p>}
    </div>
  );
}