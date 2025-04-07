import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { RoleBasedRoute } from "./components/role-based-route";
import { MainLayout } from "./components/layout/main-layout";
import { UserRole } from "@shared/schema";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ApplicationsPage from "@/pages/applications-page";
import DocumentsPage from "@/pages/documents-page";
import ProfilePage from "@/pages/profile-page";
import AnalyticsPage from "@/pages/analytics-page";
import CalendarPage from "@/pages/calendar-page";
import EmailPage from "@/pages/email-page";
import InterviewPrepPage from "@/pages/interview-prep-page";
import TeamManagementPage from "@/pages/team-management-page";
import JobApplyPage from "@/pages/job-apply-page";
import ChatPage from "@/pages/chat-page";

function App() {
  return (
    <>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/email" element={<EmailPage />} />
            <Route path="/interview" element={<InterviewPrepPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/chat" element={<ChatPage />} />

            <Route 
              path="/team-management" 
              element={
                <RoleBasedRoute 
                  allowedRoles={[UserRole.ADMIN, UserRole.GROUP_LEADER]}
                  element={<TeamManagementPage />}
                />
              } 
            />

            <Route
              path="/job-apply"
              element={
                <RoleBasedRoute
                  allowedRoles={[UserRole.JOB_SEEKER, UserRole.JOB_BIDDER]}
                  element={<JobApplyPage />}
                />
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;