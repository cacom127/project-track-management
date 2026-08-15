import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
  db: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => res.json())
      .then((data: HealthResponse) => setHealth(data));
  }, []);

  return (
    <main>
      <h1>実績管理システム</h1>
      <p>Status: {health?.status ?? "loading..."}</p>
      <p>DB: {health?.db ?? "loading..."}</p>
    </main>
  );
}

export default App;
