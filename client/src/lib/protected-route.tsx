
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Navigate, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { queryClient } from "@/lib/queryClient";

// Demo user data for bypassing authentication
const demoUser = {
  id: 999,
  username: "demo-user",
  email: "demo@example.com",
  fullName: "Demo User",
  profilePicture: "",
  createdAt: new Date(),
  updatedAt: new Date(),
  password: "*****", // Masked password field
};

// Check if we're using demo mode
const isDemoMode = () => {
  return localStorage.getItem("demoMode") === "true";
};

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [checkingDemo, setCheckingDemo] = useState(true);

  useEffect(() => {
    const checkDemoMode = () => {
      if (isDemoMode()) {
        queryClient.setQueryData(["/api/user"], demoUser);
        setCheckingDemo(false);
      } else {
        setCheckingDemo(false);
      }
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "true") {
      localStorage.setItem("demoMode", "true");
      queryClient.setQueryData(["/api/user"], demoUser);
      setCheckingDemo(false);
    } else {
      checkDemoMode();
    }
  }, []);

  if (isLoading || checkingDemo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user && !isDemoMode()) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
