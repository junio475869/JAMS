import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { RoleBasedRoute } from "./components/role-based-route";
import { MainLayout } from "./components/layout/main-layout";
import { UserRole } from "@shared/schema";
import { AuthProvider } from "@/hooks/use-auth";
import { ApplicationProvider } from "./contexts/application-context";
import { ThemeProvider } from "./contexts/theme-context";

import NotFound from "@/pages/error/not-found";
import AuthPage from "@/pages/auth/auth-page";
import DashboardPage from "@/pages/dashboard/dashboard-page";
import AnalyticsPage from "@/pages/dashboard/analytics-page";
import ApplicationsPage from "@/pages/applications/applications-page";
import ApplicationEditPage from "@/pages/applications/application-edit-page";
import DocumentsPage from "@/pages/documents/documents-page";
import SettingsPage from "@/pages/settings";
import CalendarPage from "@/pages/calendar/calendar-page";
import EmailPage from "@/pages/email/email-page";
import InterviewPrepPage from "@/pages/interviews/interview-prep-page";
import TeamManagementPage from "@/pages/team/team-management-page";
import JobApplyPage from "@/pages/applications/job-apply-page";
import ChatPage from "@/pages/chat/chat-page";
import AdminPage from "@/pages/admin/admin-page";

import { queryClient } from "./lib/query-store";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ApplicationProvider>
            <Switch>
              <Route path="/auth" component={AuthPage} />

              <Route>
                {(params) => (
                  <ProtectedRoute>
                    <MainLayout>
                      <Switch>
                        <Route path="/" component={DashboardPage} />
                        <Route
                          path="/applications"
                          component={ApplicationsPage}
                        />
                        <Route
                          path="/applications/:id"
                          component={ApplicationEditPage}
                        />
                        <Route path="/documents" component={DocumentsPage} />
                        <Route path="/analytics" component={AnalyticsPage} />
                        <Route path="/calendar" component={CalendarPage} />
                        <Route path="/email" component={EmailPage} />
                        <Route
                          path="/interview"
                          component={InterviewPrepPage}
                        />
                        <Route path="/settings" component={SettingsPage} />
                        <Route path="/chat" component={ChatPage} />
                        <Route path="/team-management">
                          {() => (
                            <RoleBasedRoute
                              path="/team-management"
                              component={TeamManagementPage}
                              allowedRoles={[
                                UserRole.ADMIN,
                                UserRole.GROUP_LEADER,
                              ]}
                              fallbackPath="/dashboard"
                            />
                          )}
                        </Route>
                        <Route path="/job-apply">
                          {() => (
                            <RoleBasedRoute
                              path="/job-apply"
                              component={JobApplyPage}
                              allowedRoles={[
                                UserRole.ADMIN,
                                UserRole.JOB_SEEKER,
                                UserRole.JOB_BIDDER,
                              ]}
                              fallbackPath="/dashboard"
                            />
                          )}
                        </Route>
                        <Route path="/admin">
                          {() => (
                            <RoleBasedRoute
                              path="/admin"
                              component={AdminPage}
                              allowedRoles={[UserRole.ADMIN]}
                              fallbackPath="/dashboard"
                            />
                          )}
                        </Route>
                        <Route component={NotFound} />
                      </Switch>
                    </MainLayout>
                  </ProtectedRoute>
                )}
              </Route>
            </Switch>
            <Toaster />
          </ApplicationProvider>
        </ThemeProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
