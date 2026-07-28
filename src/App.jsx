import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import DashboardShell from "./pages/DashboardShell";

function Shell() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <DashboardShell /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}