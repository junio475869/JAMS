
import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import { AuthProvider } from "./hooks/use-auth";
import { ApplicationProvider } from "./contexts/application-context";
import { ThemeProvider } from "./contexts/theme-context";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Router>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ApplicationProvider>
            <App />
          </ApplicationProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </Router>,
);
