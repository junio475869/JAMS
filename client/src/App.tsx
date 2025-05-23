import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { RoleBasedRoute } from "./components/role-based-route";
import { MainLayout } from "./components/layout/main-layout";
import { UserRole } from "@shared/schema";
import { AuthProvider } from "@/hooks/use-auth"; // Assuming this is where your AuthProvider is
import { ApplicationProvider } from "./contexts/application-context";
import { ThemeProvider } from "./contexts/theme-context";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ApplicationsPage from "@/pages/applications-page";
import ApplicationEditPage from "@/pages/application-edit-page";
import DocumentsPage from "@/pages/documents-page";
import ProfilePage from "@/pages/profile-page";
import AnalyticsPage from "@/pages/analytics-page";
import CalendarPage from "@/pages/calendar-page";
import EmailPage from "@/pages/email-page";
import InterviewPrepPage from "@/pages/interview-prep-page";
import TeamManagementPage from "@/pages/team-management-page";
import JobApplyPage from "@/pages/job-apply-page";
import ChatPage from "@/pages/chat-page";
import AdminPage from "./pages/admin-page";

function App() {
  return (
    <>
      <AuthProvider>
        <ThemeProvider>
          <ApplicationProvider>
            {/* Added AuthProvider wrapper */}
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
                        <Route path="/profile" component={ProfilePage} />
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
      {/* Closed AuthProvider wrapper */}
    </>
  );
}

export default App;
