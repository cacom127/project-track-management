import { useEffect, useState } from "react";
import { Route, Routes } from "react-router";
import Header from "./components/Header";
import RouteGuard from "./components/RouteGuard";
import LoginFlow from "./pages/LoginFlow";

type HealthResponse = {
  status: string;
  db: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => res.json())
      .then((data: HealthResponse) => setHealth(data));
  }, []);

  return (
    <>
      <Header />
      <main>
        <h1>実績管理システム</h1>
        <p>Status: {health?.status ?? "loading..."}</p>
        <p>DB: {health?.db ?? "loading..."}</p>
      </main>
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginFlow />} />
      <Route
        path="/"
        element={
          <RouteGuard>
            <Home />
          </RouteGuard>
        }
      />
    </Routes>
  );
}

export default App;
