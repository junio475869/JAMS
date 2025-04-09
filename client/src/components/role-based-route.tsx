import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { UserRole, UserRoleType } from "@shared/schema";

interface RoleBasedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  allowedRoles?: UserRoleType[];
  fallbackPath?: string;
}

export function RoleBasedRoute({
  path,
  component: Component,
  allowedRoles = Object.values(UserRole),
  fallbackPath = "/auth",
}: RoleBasedRouteProps) {
  const { user, isLoading } = useAuth();
  console.log(user);
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Route>
    );
  }

  // First check if user is authenticated
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to={fallbackPath} />
      </Route>
    );
  }

  // Then check if user has the required role
  if (!allowedRoles.includes(user.role as UserRoleType)) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground text-center mb-6">
            You don't have permission to access this page. This area is
            restricted to
            {allowedRoles.length === 1
              ? ` ${allowedRoles[0]} users only.`
              : ` users with one of these roles: ${allowedRoles.join(", ")}.`}
          </p>
          <p className="text-sm">
            Your current role: <span className="font-medium">{user.role}</span>
          </p>
        </div>
      </Route>
    );
  }

  // If user has the required role, render the component
  return <Route path={path} component={Component} />;
}
